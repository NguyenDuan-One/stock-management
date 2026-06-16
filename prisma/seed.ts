import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ============================================================
  // PERMISSIONS
  // ============================================================
  const permissions = [
    { name: "products.view", displayName: "Xem sản phẩm", module: "products", action: "view" },
    { name: "products.create", displayName: "Thêm sản phẩm", module: "products", action: "create" },
    { name: "products.update", displayName: "Sửa sản phẩm", module: "products", action: "update" },
    { name: "products.delete", displayName: "Xóa sản phẩm", module: "products", action: "delete" },
    { name: "categories.view", displayName: "Xem danh mục", module: "categories", action: "view" },
    { name: "categories.create", displayName: "Thêm danh mục", module: "categories", action: "create" },
    { name: "categories.update", displayName: "Sửa danh mục", module: "categories", action: "update" },
    { name: "categories.delete", displayName: "Xóa danh mục", module: "categories", action: "delete" },
    { name: "suppliers.view", displayName: "Xem nhà cung cấp", module: "suppliers", action: "view" },
    { name: "suppliers.create", displayName: "Thêm nhà cung cấp", module: "suppliers", action: "create" },
    { name: "suppliers.update", displayName: "Sửa nhà cung cấp", module: "suppliers", action: "update" },
    { name: "suppliers.delete", displayName: "Xóa nhà cung cấp", module: "suppliers", action: "delete" },
    { name: "customers.view", displayName: "Xem khách hàng", module: "customers", action: "view" },
    { name: "customers.create", displayName: "Thêm khách hàng", module: "customers", action: "create" },
    { name: "customers.update", displayName: "Sửa khách hàng", module: "customers", action: "update" },
    { name: "customers.delete", displayName: "Xóa khách hàng", module: "customers", action: "delete" },
    { name: "stock_in.view", displayName: "Xem phiếu nhập", module: "stock_in", action: "view" },
    { name: "stock_in.create", displayName: "Tạo phiếu nhập", module: "stock_in", action: "create" },
    { name: "stock_in.update", displayName: "Sửa phiếu nhập", module: "stock_in", action: "update" },
    { name: "stock_in.delete", displayName: "Xóa phiếu nhập", module: "stock_in", action: "delete" },
    { name: "stock_out.view", displayName: "Xem phiếu xuất", module: "stock_out", action: "view" },
    { name: "stock_out.create", displayName: "Tạo phiếu xuất", module: "stock_out", action: "create" },
    { name: "stock_out.update", displayName: "Sửa phiếu xuất", module: "stock_out", action: "update" },
    { name: "stock_out.delete", displayName: "Xóa phiếu xuất", module: "stock_out", action: "delete" },
    { name: "warranty.view", displayName: "Xem bảo hành", module: "warranty", action: "view" },
    { name: "reports.view", displayName: "Xem báo cáo", module: "reports", action: "view" },
    { name: "reports.export", displayName: "Xuất báo cáo", module: "reports", action: "export" },
    { name: "users.view", displayName: "Xem người dùng", module: "users", action: "view" },
    { name: "users.create", displayName: "Thêm người dùng", module: "users", action: "create" },
    { name: "users.update", displayName: "Sửa người dùng", module: "users", action: "update" },
    { name: "users.delete", displayName: "Xóa người dùng", module: "users", action: "delete" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log(`✅ Created ${permissions.length} permissions`);

  // ============================================================
  // ROLES
  // ============================================================
  const allPermNames = permissions.map((p) => p.name);
  const viewOnlyPerms = permissions.filter((p) => p.action === "view").map((p) => p.name);
  const staffPerms = permissions
    .filter((p) => !["users.create", "users.update", "users.delete", "users.view"].includes(p.name))
    .map((p) => p.name);
  const managerPerms = permissions
    .filter((p) => !["users.delete"].includes(p.name))
    .map((p) => p.name);

  const roles = [
    { name: "ADMIN", displayName: "Quản trị viên", description: "Toàn quyền hệ thống", perms: allPermNames },
    { name: "MANAGER", displayName: "Quản lý", description: "Quản lý kho và báo cáo", perms: managerPerms },
    { name: "STAFF", displayName: "Nhân viên", description: "Nhập/xuất kho", perms: staffPerms },
    { name: "VIEWER", displayName: "Người xem", description: "Chỉ xem", perms: viewOnlyPerms },
  ];

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { displayName: roleData.displayName },
      create: { name: roleData.name, displayName: roleData.displayName, description: roleData.description },
    });

    for (const permName of roleData.perms) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
  }
  console.log(`✅ Created 4 roles with permissions`);

  // ============================================================
  // USERS
  // ============================================================
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  const managerRole = await prisma.role.findUnique({ where: { name: "MANAGER" } });
  const staffRole = await prisma.role.findUnique({ where: { name: "STAFF" } });
  const viewerRole = await prisma.role.findUnique({ where: { name: "VIEWER" } });

  const usersData = [
    { username: "admin", email: "admin@datatech.vn", fullName: "Quản trị viên", role: adminRole },
    { username: "manager", email: "manager@datatech.vn", fullName: "Nguyễn Văn Manager", role: managerRole },
    { username: "staff1", email: "staff1@datatech.vn", fullName: "Trần Thị Nhân Viên", role: staffRole },
    { username: "viewer", email: "viewer@datatech.vn", fullName: "Lê Văn Xem", role: viewerRole },
  ];

  const hashedPassword = await bcrypt.hash("Admin@123", 12);

  for (const userData of usersData) {
    const user = await prisma.user.upsert({
      where: { username: userData.username },
      update: {},
      create: {
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        fullName: userData.fullName,
        isActive: true,
      },
    });

    if (userData.role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: userData.role.id } },
        update: {},
        create: { userId: user.id, roleId: userData.role.id },
      });
    }
  }
  console.log(`✅ Created 4 users (password: Admin@123)`);

  // ============================================================
  // PRODUCT CATEGORIES
  // ============================================================
  const categories = [
    { name: "Laptop", code: "LAP", description: "Máy tính xách tay" },
    { name: "Desktop", code: "DSK", description: "Máy tính để bàn" },
    { name: "Màn hình", code: "MON", description: "Màn hình máy tính" },
    { name: "Server", code: "SRV", description: "Máy chủ" },
    { name: "Switch & Router", code: "NET", description: "Thiết bị mạng" },
    { name: "UPS", code: "UPS", description: "Bộ lưu điện" },
    { name: "Phụ kiện", code: "ACC", description: "Phụ kiện công nghệ" },
    { name: "Phần mềm", code: "SFT", description: "Bản quyền phần mềm" },
  ];

  for (const cat of categories) {
    await prisma.productCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ Created ${categories.length} product categories`);

  // Get categories
  const lapCat = await prisma.productCategory.findUnique({ where: { code: "LAP" } });
  const monCat = await prisma.productCategory.findUnique({ where: { code: "MON" } });
  const netCat = await prisma.productCategory.findUnique({ where: { code: "NET" } });
  const srvCat = await prisma.productCategory.findUnique({ where: { code: "SRV" } });
  const upsCat = await prisma.productCategory.findUnique({ where: { code: "UPS" } });
  const dskCat = await prisma.productCategory.findUnique({ where: { code: "DSK" } });

  // ============================================================
  // PRODUCTS
  // ============================================================
  const products = [
    {
      name: "Laptop Dell Latitude 5420",
      sku: "DELL-LAT5420",
      model: "Latitude 5420",
      brand: "Dell",
      categoryId: lapCat?.id,
      unit: "cái",
      warrantyMonths: 36,
      quantity: 10,
      minQuantity: 2,
      costPrice: 18000000,
      sellingPrice: 22000000,
      status: "IN_STOCK" as const,
      barcode: "8901234567890",
    },
    {
      name: "Laptop HP EliteBook 840 G9",
      sku: "HP-EB840G9",
      model: "EliteBook 840 G9",
      brand: "HP",
      categoryId: lapCat?.id,
      unit: "cái",
      warrantyMonths: 36,
      quantity: 8,
      minQuantity: 2,
      costPrice: 20000000,
      sellingPrice: 25000000,
      status: "IN_STOCK" as const,
      barcode: "8901234567891",
    },
    {
      name: "Laptop Lenovo ThinkPad X1 Carbon",
      sku: "LEN-X1CAR",
      model: "ThinkPad X1 Carbon",
      brand: "Lenovo",
      categoryId: lapCat?.id,
      unit: "cái",
      warrantyMonths: 36,
      quantity: 5,
      minQuantity: 1,
      costPrice: 25000000,
      sellingPrice: 32000000,
      status: "IN_STOCK" as const,
      barcode: "8901234567892",
    },
    {
      name: "Màn hình Dell U2422H 24 inch",
      sku: "DELL-U2422H",
      model: "U2422H",
      brand: "Dell",
      categoryId: monCat?.id,
      unit: "cái",
      warrantyMonths: 36,
      quantity: 15,
      minQuantity: 3,
      costPrice: 4500000,
      sellingPrice: 6000000,
      status: "IN_STOCK" as const,
      barcode: "8901234567893",
    },
    {
      name: "Switch Cisco Catalyst 2960X-24TS",
      sku: "CISCO-2960X24",
      model: "Catalyst 2960X-24TS",
      brand: "Cisco",
      categoryId: netCat?.id,
      unit: "cái",
      warrantyMonths: 12,
      quantity: 6,
      minQuantity: 1,
      costPrice: 15000000,
      sellingPrice: 20000000,
      status: "IN_STOCK" as const,
      barcode: "8901234567894",
    },
    {
      name: "Router Cisco ISR 4321",
      sku: "CISCO-ISR4321",
      model: "ISR 4321",
      brand: "Cisco",
      categoryId: netCat?.id,
      unit: "cái",
      warrantyMonths: 12,
      quantity: 3,
      minQuantity: 1,
      costPrice: 35000000,
      sellingPrice: 45000000,
      status: "IN_STOCK" as const,
      barcode: "8901234567895",
    },
    {
      name: "Server Dell PowerEdge R740",
      sku: "DELL-R740",
      model: "PowerEdge R740",
      brand: "Dell",
      categoryId: srvCat?.id,
      unit: "cái",
      warrantyMonths: 36,
      quantity: 2,
      minQuantity: 1,
      costPrice: 120000000,
      sellingPrice: 150000000,
      status: "IN_STOCK" as const,
      barcode: "8901234567896",
    },
    {
      name: "UPS APC Smart-UPS 1500VA",
      sku: "APC-SMT1500",
      model: "Smart-UPS 1500VA",
      brand: "APC",
      categoryId: upsCat?.id,
      unit: "cái",
      warrantyMonths: 24,
      quantity: 4,
      minQuantity: 1,
      costPrice: 8000000,
      sellingPrice: 11000000,
      status: "IN_STOCK" as const,
      barcode: "8901234567897",
    },
    {
      name: "PC Dell OptiPlex 7090",
      sku: "DELL-OPT7090",
      model: "OptiPlex 7090",
      brand: "Dell",
      categoryId: dskCat?.id,
      unit: "cái",
      warrantyMonths: 36,
      quantity: 7,
      minQuantity: 2,
      costPrice: 14000000,
      sellingPrice: 18000000,
      status: "IN_STOCK" as const,
      barcode: "8901234567898",
    },
    {
      name: "Laptop ASUS ExpertBook B9450",
      sku: "ASUS-B9450",
      model: "ExpertBook B9450",
      brand: "ASUS",
      categoryId: lapCat?.id,
      unit: "cái",
      warrantyMonths: 24,
      quantity: 0,
      minQuantity: 2,
      costPrice: 22000000,
      sellingPrice: 28000000,
      status: "OUT_OF_STOCK" as const,
      barcode: "8901234567899",
    },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: { quantity: prod.quantity },
      create: prod as any,
    });
  }
  console.log(`✅ Created ${products.length} products`);

  // ============================================================
  // SUPPLIERS
  // ============================================================
  const suppliers = [
    {
      name: "Dell Vietnam",
      code: "SUP-DELL",
      contactName: "Nguyễn Minh Đức",
      phone: "028-3821-2222",
      email: "sales@dell.com.vn",
      address: "Tòa nhà Bitexco, 2 Hải Triều, Quận 1, TP.HCM",
      taxCode: "0312345678",
    },
    {
      name: "HP Vietnam",
      code: "SUP-HP",
      contactName: "Trần Thị Lan",
      phone: "024-3825-1234",
      email: "sales@hp.com.vn",
      address: "Keangnam Hanoi Landmark Tower, Từ Liêm, Hà Nội",
      taxCode: "0112345678",
    },
    {
      name: "Cisco Systems Vietnam",
      code: "SUP-CISCO",
      contactName: "Lê Văn Hùng",
      phone: "028-3911-5678",
      email: "vietnam@cisco.com",
      address: "Tòa nhà Sailing Tower, 111A Pasteur, Quận 1, TP.HCM",
      taxCode: "0312345679",
    },
    {
      name: "Công ty TNHH Phân Phối Thiết Bị IT Phương Đông",
      code: "SUP-PHUONGDONG",
      contactName: "Phạm Văn Đông",
      phone: "028-3958-7777",
      email: "info@phuongdong.vn",
      address: "123 Cộng Hòa, Tân Bình, TP.HCM",
      taxCode: "0312399999",
    },
    {
      name: "Lenovo Vietnam Distribution",
      code: "SUP-LENOVO",
      contactName: "Hoàng Thị Mai",
      phone: "024-3555-6666",
      email: "vn.sales@lenovo.com",
      address: "25 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội",
      taxCode: "0112398765",
    },
  ];

  for (const sup of suppliers) {
    await prisma.supplier.upsert({
      where: { code: sup.code },
      update: {},
      create: sup,
    });
  }
  console.log(`✅ Created ${suppliers.length} suppliers`);

  // ============================================================
  // CUSTOMERS
  // ============================================================
  const customers = [
    {
      name: "Công ty CP Bảo Việt",
      code: "CUS-BAOVIET",
      contactName: "Trịnh Văn Bảo",
      phone: "024-3726-9988",
      email: "it@baoviet.com.vn",
      address: "8 Lê Thái Tổ, Hoàn Kiếm, Hà Nội",
      taxCode: "0100111222",
    },
    {
      name: "Ngân hàng TMCP Á Châu - ACB",
      code: "CUS-ACB",
      contactName: "Nguyễn Thị Hoa",
      phone: "028-3929-0909",
      email: "itprocure@acb.com.vn",
      address: "442 Nguyễn Thị Minh Khai, Quận 3, TP.HCM",
      taxCode: "0300100573",
    },
    {
      name: "Tập đoàn Điện lực Việt Nam - EVN",
      code: "CUS-EVN",
      contactName: "Bùi Văn Điện",
      phone: "024-3825-1415",
      email: "it.dept@evn.com.vn",
      address: "11 Cửa Bắc, Ba Đình, Hà Nội",
      taxCode: "0100107413",
    },
    {
      name: "Công ty TNHH Samsung Electronics Vietnam",
      code: "CUS-SAMSUNG",
      contactName: "Park Ji Young",
      phone: "024-3786-3000",
      email: "procurement@samsung.com.vn",
      address: "Khu Công nghiệp Yên Phong, Bắc Ninh",
      taxCode: "2300419437",
    },
    {
      name: "UBND Tỉnh Bình Dương",
      code: "CUS-BINHDUONG",
      contactName: "Lê Thị Thanh",
      phone: "0274-3822-345",
      email: "tttt@binhduong.gov.vn",
      address: "Quảng trường Hành chính, TP. Thủ Dầu Một, Bình Dương",
      taxCode: "3702088388",
    },
  ];

  for (const cus of customers) {
    await prisma.customer.upsert({
      where: { code: cus.code },
      update: {},
      create: cus,
    });
  }
  console.log(`✅ Created ${customers.length} customers`);

  // ============================================================
  // SAMPLE STOCK IN
  // ============================================================
  const adminUser = await prisma.user.findUnique({ where: { username: "admin" } });
  const dellSupplier = await prisma.supplier.findUnique({ where: { code: "SUP-DELL" } });
  const hpSupplier = await prisma.supplier.findUnique({ where: { code: "SUP-HP" } });
  const ciscoSupplier = await prisma.supplier.findUnique({ where: { code: "SUP-CISCO" } });

  const dellLaptop = await prisma.product.findUnique({ where: { sku: "DELL-LAT5420" } });
  const hpLaptop = await prisma.product.findUnique({ where: { sku: "HP-EB840G9" } });
  const dellMonitor = await prisma.product.findUnique({ where: { sku: "DELL-U2422H" } });
  const ciscoSwitch = await prisma.product.findUnique({ where: { sku: "CISCO-2960X24" } });
  const dellServer = await prisma.product.findUnique({ where: { sku: "DELL-R740" } });

  if (adminUser && dellSupplier && dellLaptop && dellMonitor && dellServer) {
    const stockIn1 = await prisma.stockIn.upsert({
      where: { code: "PN2024010001" },
      update: {},
      create: {
        code: "PN2024010001",
        supplierId: dellSupplier.id,
        importDate: new Date("2024-01-15"),
        poNumber: "PO-2024-0115",
        contractNumber: "HD-DELL-2024-001",
        totalAmount: 350000000,
        status: "CONFIRMED",
        createdById: adminUser.id,
        notes: "Nhập hàng đợt 1 năm 2024",
      },
    });

    await prisma.stockInItem.createMany({
      skipDuplicates: true,
      data: [
        {
          stockInId: stockIn1.id,
          productId: dellLaptop.id,
          serialNumber: "DELL-SN-001",
          quantity: 10,
          unitPrice: 18000000,
          totalPrice: 180000000,
          warrantyMonths: 36,
          warrantyExpiry: new Date("2027-01-15"),
        },
        {
          stockInId: stockIn1.id,
          productId: dellMonitor.id,
          quantity: 15,
          unitPrice: 4500000,
          totalPrice: 67500000,
          warrantyMonths: 36,
          warrantyExpiry: new Date("2027-01-15"),
        },
        {
          stockInId: stockIn1.id,
          productId: dellServer.id,
          serialNumber: "SRV-SN-001",
          quantity: 2,
          unitPrice: 120000000,
          totalPrice: 240000000,
          warrantyMonths: 36,
          warrantyExpiry: new Date("2027-01-15"),
        },
      ],
    });
    console.log("✅ Created stock-in PN2024010001");
  }

  if (adminUser && hpSupplier && hpLaptop) {
    const stockIn2 = await prisma.stockIn.upsert({
      where: { code: "PN2024020001" },
      update: {},
      create: {
        code: "PN2024020001",
        supplierId: hpSupplier.id,
        importDate: new Date("2024-02-20"),
        poNumber: "PO-2024-0220",
        contractNumber: "HD-HP-2024-001",
        totalAmount: 160000000,
        status: "CONFIRMED",
        createdById: adminUser.id,
        notes: "Nhập laptop HP cho dự án ACB",
      },
    });

    await prisma.stockInItem.createMany({
      skipDuplicates: true,
      data: [
        {
          stockInId: stockIn2.id,
          productId: hpLaptop.id,
          quantity: 8,
          unitPrice: 20000000,
          totalPrice: 160000000,
          warrantyMonths: 36,
          warrantyExpiry: new Date("2027-02-20"),
        },
      ],
    });
    console.log("✅ Created stock-in PN2024020001");
  }

  if (adminUser && ciscoSupplier && ciscoSwitch) {
    const stockIn3 = await prisma.stockIn.upsert({
      where: { code: "PN2024030001" },
      update: {},
      create: {
        code: "PN2024030001",
        supplierId: ciscoSupplier.id,
        importDate: new Date("2024-03-10"),
        poNumber: "PO-2024-0310-CISCO",
        totalAmount: 90000000,
        status: "CONFIRMED",
        createdById: adminUser.id,
        notes: "Nhập thiết bị mạng Cisco",
      },
    });

    await prisma.stockInItem.createMany({
      skipDuplicates: true,
      data: [
        {
          stockInId: stockIn3.id,
          productId: ciscoSwitch.id,
          quantity: 6,
          unitPrice: 15000000,
          totalPrice: 90000000,
          warrantyMonths: 12,
          warrantyExpiry: new Date("2025-03-10"),
        },
      ],
    });
    console.log("✅ Created stock-in PN2024030001");
  }

  // ============================================================
  // SAMPLE STOCK OUT
  // ============================================================
  const acbCustomer = await prisma.customer.findUnique({ where: { code: "CUS-ACB" } });
  const evnCustomer = await prisma.customer.findUnique({ where: { code: "CUS-EVN" } });

  const dellLaptopFresh = await prisma.product.findUnique({ where: { sku: "DELL-LAT5420" } });
  const hpLaptopFresh = await prisma.product.findUnique({ where: { sku: "HP-EB840G9" } });
  const dellMonitorFresh = await prisma.product.findUnique({ where: { sku: "DELL-U2422H" } });
  const ciscSwitchFresh = await prisma.product.findUnique({ where: { sku: "CISCO-2960X24" } });

  if (adminUser && acbCustomer && hpLaptopFresh && dellMonitorFresh) {
    const stockOut1 = await prisma.stockOut.upsert({
      where: { code: "PX2024030001" },
      update: {},
      create: {
        code: "PX2024030001",
        customerId: acbCustomer.id,
        exportDate: new Date("2024-03-01"),
        poNumber: "ACB-PO-2024-001",
        contractNumber: "HD-ACB-2024-003",
        totalAmount: 218000000,
        status: "CONFIRMED",
        createdById: adminUser.id,
        notes: "Bàn giao thiết bị cho dự án ACB Phase 1",
      },
    });

    const warrantyStart = new Date("2024-03-01");
    const warrantyEnd = new Date("2027-03-01");

    const soItem1 = await prisma.stockOutItem.create({
      data: {
        stockOutId: stockOut1.id,
        productId: hpLaptopFresh.id,
        quantity: 5,
        unitPrice: 25000000,
        totalPrice: 125000000,
        warrantyMonths: 36,
        warrantyStartDate: warrantyStart,
        warrantyEndDate: warrantyEnd,
      },
    });

    await prisma.warrantyRecord.create({
      data: {
        productId: hpLaptopFresh.id,
        customerId: acbCustomer.id,
        stockOutItemId: soItem1.id,
        warrantyMonths: 36,
        startDate: warrantyStart,
        endDate: warrantyEnd,
        status: "ACTIVE",
      },
    });

    const soItem2 = await prisma.stockOutItem.create({
      data: {
        stockOutId: stockOut1.id,
        productId: dellMonitorFresh.id,
        quantity: 5,
        unitPrice: 6000000,
        totalPrice: 30000000,
        warrantyMonths: 36,
        warrantyStartDate: warrantyStart,
        warrantyEndDate: warrantyEnd,
      },
    });

    await prisma.warrantyRecord.create({
      data: {
        productId: dellMonitorFresh.id,
        customerId: acbCustomer.id,
        stockOutItemId: soItem2.id,
        warrantyMonths: 36,
        startDate: warrantyStart,
        endDate: warrantyEnd,
        status: "ACTIVE",
      },
    });

    // Update product quantities
    await prisma.product.update({ where: { sku: "HP-EB840G9" }, data: { quantity: { decrement: 5 } } });
    await prisma.product.update({ where: { sku: "DELL-U2422H" }, data: { quantity: { decrement: 5 } } });
    console.log("✅ Created stock-out PX2024030001");
  }

  if (adminUser && evnCustomer && dellLaptopFresh && ciscSwitchFresh) {
    const stockOut2 = await prisma.stockOut.upsert({
      where: { code: "PX2024040001" },
      update: {},
      create: {
        code: "PX2024040001",
        customerId: evnCustomer.id,
        exportDate: new Date("2024-04-15"),
        poNumber: "EVN-PO-2024-005",
        contractNumber: "HD-EVN-2024-007",
        totalAmount: 175000000,
        status: "CONFIRMED",
        createdById: adminUser.id,
        notes: "Cung cấp thiết bị mạng và laptop EVN",
      },
    });

    const warrantyStart2 = new Date("2024-04-15");
    const warrantyEnd2 = new Date("2027-04-15");

    const soItem3 = await prisma.stockOutItem.create({
      data: {
        stockOutId: stockOut2.id,
        productId: dellLaptopFresh.id,
        quantity: 5,
        unitPrice: 22000000,
        totalPrice: 110000000,
        warrantyMonths: 36,
        warrantyStartDate: warrantyStart2,
        warrantyEndDate: warrantyEnd2,
      },
    });

    await prisma.warrantyRecord.create({
      data: {
        productId: dellLaptopFresh.id,
        customerId: evnCustomer.id,
        stockOutItemId: soItem3.id,
        warrantyMonths: 36,
        startDate: warrantyStart2,
        endDate: warrantyEnd2,
        status: "ACTIVE",
      },
    });

    const soItem4 = await prisma.stockOutItem.create({
      data: {
        stockOutId: stockOut2.id,
        productId: ciscSwitchFresh.id,
        quantity: 3,
        unitPrice: 20000000,
        totalPrice: 60000000,
        warrantyMonths: 12,
        warrantyStartDate: warrantyStart2,
        warrantyEndDate: new Date("2025-04-15"),
      },
    });

    await prisma.warrantyRecord.create({
      data: {
        productId: ciscSwitchFresh.id,
        customerId: evnCustomer.id,
        stockOutItemId: soItem4.id,
        warrantyMonths: 12,
        startDate: warrantyStart2,
        endDate: new Date("2025-04-15"),
        status: "EXPIRED",
      },
    });

    // Update product quantities
    await prisma.product.update({ where: { sku: "DELL-LAT5420" }, data: { quantity: { decrement: 5 } } });
    await prisma.product.update({ where: { sku: "CISCO-2960X24" }, data: { quantity: { decrement: 3 } } });
    console.log("✅ Created stock-out PX2024040001");
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("📋 Login accounts:");
  console.log("  - admin / Admin@123 (Admin)");
  console.log("  - manager / Admin@123 (Manager)");
  console.log("  - staff1 / Admin@123 (Staff)");
  console.log("  - viewer / Admin@123 (Viewer)");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
