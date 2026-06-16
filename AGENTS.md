# AGENTS.md — Tài liệu Logic Hệ thống Quản lý Kho

> **Dự án:** Stock Management System — Datatech
> **Công nghệ:** Next.js 15 (App Router) · TypeScript · MySQL · Prisma ORM · NextAuth.js v5 · Tailwind CSS · Shadcn UI
> **Phiên bản tài liệu:** 1.0 — 2026-06-13

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Cơ sở dữ liệu (Database Schema)](#3-cơ-sở-dữ-liệu-database-schema)
4. [Xác thực và Phân quyền](#4-xác-thực-và-phân-quyền)
5. [API Routes — Logic chi tiết](#5-api-routes--logic-chi-tiết)
6. [Module Nhập kho (Stock-In)](#6-module-nhập-kho-stock-in)
7. [Module Xuất kho (Stock-Out) và Bảo hành](#7-module-xuất-kho-stock-out-và-bảo-hành)
8. [Module Tồn kho (Inventory)](#8-module-tồn-kho-inventory)
9. [Module Bảo hành (Warranty)](#9-module-bảo-hành-warranty)
10. [Module Sản phẩm & Danh mục](#10-module-sản-phẩm--danh-mục)
11. [Module Nhà cung cấp & Khách hàng](#11-module-nhà-cung-cấp--khách-hàng)
12. [Module Báo cáo (Reports)](#12-module-báo-cáo-reports)
13. [Module Người dùng & Vai trò](#13-module-người-dùng--vai-trò)
14. [Dashboard](#14-dashboard)
15. [Quét mã vạch (Barcode Scanner)](#15-quét-mã-vạch-barcode-scanner)
16. [Audit Log](#16-audit-log)
17. [Luồng dữ liệu tổng thể](#17-luồng-dữ-liệu-tổng-thể)
18. [Biến môi trường](#18-biến-môi-trường)
19. [Phụ lục A — Utility Functions](#phụ-lục-a--utility-functions)
20. [Phụ lục B — UI Component Library](#phụ-lục-b--ui-component-library)
21. [Phụ lục C — Layout System](#phụ-lục-c--layout-system)

---

## 1. Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                      │
│  Next.js App Router (React Server Components + Client)       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Dashboard│  │ Stock-In │  │ Stock-Out│  │  Warranty  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / fetch()
┌────────────────────────▼────────────────────────────────────┐
│                   Next.js API Routes                         │
│  /api/products  /api/stock-in  /api/stock-out  /api/...      │
│  — Auth guard (NextAuth session check)                       │
│  — Permission check (permissions array from JWT)             │
└────────────────────────┬────────────────────────────────────┘
                         │ Prisma Client
┌────────────────────────▼────────────────────────────────────┐
│                    MySQL Database                            │
│  users · roles · permissions · products · categories         │
│  suppliers · customers · stock_in · stock_out                │
│  stock_in_items · stock_out_items · warranty_records          │
│  inventory_transactions · audit_logs · attachments            │
└─────────────────────────────────────────────────────────────┘
```

### Luồng request cơ bản

1. **Browser** gửi request tới Next.js App Router.
2. **Middleware** (`src/middleware.ts`) kiểm tra JWT session; nếu chưa đăng nhập → redirect `/login`.
3. **API Route Handler** gọi `auth()` xác minh session; kiểm tra `permissions` từ token.
4. **Prisma ORM** thực thi SQL trên **MySQL**.
5. Kết quả trả về `NextResponse.json()`.

---

## 2. Cấu trúc thư mục

```
stock-management/
├── prisma/
│   └── schema.prisma              # Định nghĩa toàn bộ database model
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx     # Trang đăng nhập
│   │   ├── (dashboard)/           # Protected routes (yêu cầu session)
│   │   │   ├── layout.tsx         # DashboardLayout wrapper
│   │   │   ├── page.tsx           # Dashboard tổng quan
│   │   │   ├── products/          # Quản lý sản phẩm
│   │   │   ├── categories/        # Quản lý danh mục
│   │   │   ├── suppliers/         # Nhà cung cấp
│   │   │   ├── customers/         # Khách hàng
│   │   │   ├── stock-in/          # Nhập kho
│   │   │   ├── stock-out/         # Xuất kho
│   │   │   ├── inventory/         # Tồn kho
│   │   │   ├── warranty/          # Bảo hành
│   │   │   ├── reports/           # Báo cáo
│   │   │   ├── users/             # Quản lý người dùng
│   │   │   └── settings/          # Cài đặt hệ thống
│   │   └── api/
│   │       ├── auth/[...nextauth]/ # NextAuth handler
│   │       ├── products/           # CRUD sản phẩm
│   │       ├── categories/         # CRUD danh mục
│   │       ├── suppliers/          # CRUD nhà cung cấp
│   │       ├── customers/          # CRUD khách hàng
│   │       ├── stock-in/           # Tạo/xem phiếu nhập
│   │       ├── stock-out/          # Tạo/xem phiếu xuất
│   │       ├── warranty/           # Tra cứu bảo hành
│   │       ├── dashboard/          # Thống kê dashboard
│   │       ├── reports/            # Các loại báo cáo
│   │       │   ├── inventory/
│   │       │   ├── profit/
│   │       │   ├── stock-in/
│   │       │   ├── stock-out/
│   │       │   └── warranty/
│   │       ├── users/              # Quản lý user
│   │       └── roles/              # Quản lý role
│   ├── components/
│   │   ├── ui/                     # 24 Shadcn-style components
│   │   ├── layout/                 # Sidebar, Header, DashboardLayout
│   │   ├── dashboard/              # Stats cards, Charts, Recent transactions
│   │   └── barcode/                # BarcodeScannerInput component
│   ├── hooks/
│   │   └── use-permissions.ts      # RBAC hook cho client
│   ├── lib/
│   │   ├── auth.ts                 # NextAuth v5 config
│   │   ├── prisma.ts               # Prisma client singleton
│   │   └── utils.ts                # cn(), formatCurrency(), formatDate(),...
│   └── middleware.ts               # Route protection
```

---

## 3. Cơ sở dữ liệu (Database Schema)

> File: `prisma/schema.prisma` · Provider: **MySQL**

### 3.1 Nhóm Auth & RBAC

```
User ─┬── UserRole ──── Role ──── RolePermission ──── Permission
      │
      ├── StockIn[]        (người tạo phiếu nhập)
      ├── StockOut[]       (người tạo phiếu xuất)
      └── AuditLog[]       (lịch sử hành động)
```

| Model | Mô tả |
|-------|-------|
| `User` | Người dùng hệ thống. Fields: `username`, `email`, `password`(bcrypt), `fullName`, `phone`, `avatar`, `isActive` |
| `Role` | Vai trò: ADMIN, MANAGER, STAFF, VIEWER |
| `Permission` | Quyền hành động, ví dụ: `products.create`, `stock_in.create` |
| `UserRole` | Bảng nối User–Role (nhiều-nhiều) |
| `RolePermission` | Bảng nối Role–Permission (nhiều-nhiều) |

### 3.2 Nhóm Danh mục & Sản phẩm

```
ProductCategory ──── Product ─┬── StockInItem
                               ├── StockOutItem
                               ├── InventoryTransaction
                               └── WarrantyRecord
```

| Model | Mô tả |
|-------|-------|
| `ProductCategory` | Danh mục sản phẩm: `name`, `code`(unique), `description` |
| `Product` | Sản phẩm: `name`, `sku`(unique), `barcode`, `serialNumber`(unique), `brand`, `model`, `unit`, `quantity`(tồn kho thực), `minQuantity`(cảnh báo), `costPrice`, `sellingPrice`, `warrantyMonths`, `status`(enum), `isActive` |

**ProductStatus enum:** `IN_STOCK` · `OUT_OF_STOCK` · `SOLD` · `WARRANTY` · `BROKEN` · `DISCONTINUED`

### 3.3 Nhóm Nhà cung cấp & Khách hàng

| Model | Fields chính |
|-------|-------------|
| `Supplier` | `name`, `code`(unique), `contactName`, `phone`, `email`, `address`, `taxCode`, `isActive` |
| `Customer` | `name`, `code`(unique), `contactName`, `phone`, `email`, `address`, `taxCode`, `isActive` |

### 3.4 Nhóm Giao dịch Kho

```
StockIn ──── StockInItem ──── Product
   │
   └── Supplier

StockOut ──── StockOutItem ──── Product
   │              └── WarrantyRecord
   └── Customer
```

| Model | Mô tả |
|-------|-------|
| `StockIn` | Phiếu nhập kho. Code format: `PNYYYYMMNNNN`. Fields: `supplierId`, `importDate`, `poNumber`, `contractNumber`, `totalAmount`, `status`(DRAFT/CONFIRMED/CANCELLED) |
| `StockInItem` | Dòng chi tiết phiếu nhập: `productId`, `serialNumber`, `quantity`, `unitPrice`, `totalPrice`, `warrantyMonths`, `warrantyExpiry` |
| `StockOut` | Phiếu xuất kho. Code format: `PXYYYYMMNNNN`. Fields: `customerId`, `exportDate`, `poNumber`, `contractNumber`, `totalAmount`, `status` |
| `StockOutItem` | Dòng chi tiết phiếu xuất: `productId`, `serialNumber`, `quantity`, `unitPrice`, `totalPrice`, `warrantyMonths`, `warrantyStartDate`, `warrantyEndDate` |

### 3.5 Nhóm Bảo hành & Lịch sử

| Model | Mô tả |
|-------|-------|
| `WarrantyRecord` | Phiếu bảo hành: `productId`, `customerId`, `stockOutItemId`, `serialNumber`, `warrantyMonths`, `startDate`, `endDate`, `status`(ACTIVE/EXPIRED/VOIDED) |
| `InventoryTransaction` | Lịch sử biến động tồn kho: `type`(STOCK_IN/STOCK_OUT/ADJUSTMENT/RETURN), `quantity`, `balanceBefore`, `balanceAfter`, `referenceId`, `referenceCode` |
| `AuditLog` | Nhật ký hành động: `userId`, `action`(CREATE/UPDATE/DELETE), `module`, `targetId`, `targetName`, `oldValues`, `newValues`, `ipAddress` |
| `Attachment` | File đính kèm cho phiếu nhập/xuất |

---

## 4. Xác thực và Phân quyền

### 4.1 NextAuth v5 — JWT Strategy

**File:** `src/lib/auth.ts`

```
[Login Form] → POST /api/auth/signin
     │
     ▼
authorize() {
  1. Validate input với Zod schema
  2. Tìm user theo username hoặc email (isActive: true)
  3. So sánh password với bcrypt.compare()
  4. Load toàn bộ roles → permissions từ DB
  5. Return user object với { id, username, fullName, roles[], permissions[] }
}
     │
     ▼
jwt() callback → Ghi roles[], permissions[] vào JWT token
     │
     ▼
session() callback → Expose ra session.user.roles, session.user.permissions
```

**Session config:** Strategy JWT, maxAge = 24h, secret từ `AUTH_SECRET` env.

### 4.2 Middleware bảo vệ route

**File:** `src/middleware.ts`

```
Request tới bất kỳ route nào
     │
     ├── /api/auth/* → Cho qua (NextAuth handler)
     │
     ├── /login → Nếu đã login: redirect về "/" · Nếu chưa: cho qua
     │
     └── Mọi route khác → Kiểm tra session
           ├── Chưa login → redirect /login?callbackUrl=<current_path>
           └── Đã login → Cho qua
```

**Matcher:** `/((?!_next/static|_next/image|favicon.ico|public).*)`

### 4.3 Permission System (RBAC)

| Module | Permissions |
|--------|-------------|
| Products | `products.create` · `products.update` · `products.delete` |
| Categories | `categories.create` · `categories.update` · `categories.delete` |
| Suppliers | `suppliers.create` · `suppliers.update` · `suppliers.delete` |
| Customers | `customers.create` · `customers.update` · `customers.delete` |
| Stock-In | `stock_in.create` · `stock_in.update` |
| Stock-Out | `stock_out.create` · `stock_out.update` |
| Warranty | `warranty.view` · `warranty.update` |
| Users | `users.create` · `users.update` · `users.delete` |
| Reports | `reports.view` |

**Kiểm tra permission trong API Routes:**
```typescript
const session = await auth()
if (!session?.user) return 401
const permissions = (session.user as any).permissions as string[]
if (!permissions.includes("products.create")) return 403
```

**Kiểm tra permission trong Client Components:**
```typescript
const { hasPermission, isAdmin } = usePermissions()
// Hook đọc từ useSession() → permissions[]
if (!hasPermission("stock_in.create")) return null // ẩn nút
```

**Vai trò mặc định:**

| Role | Mô tả |
|------|-------|
| ADMIN | Toàn quyền, quản lý user và hệ thống |
| MANAGER | Xem/tạo/sửa tất cả, không xóa user |
| STAFF | Nhập xuất kho, xem sản phẩm, không quản lý user |
| VIEWER | Chỉ xem, không tạo/sửa/xóa |

---

## 5. API Routes — Logic chi tiết

### Cấu trúc chung của mọi API Route

```typescript
export async function GET/POST/PUT/DELETE(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await auth()
    if (!session?.user) return 401

    // 2. Parse request (body / searchParams)
    // 3. Permission check (nếu cần)
    // 4. Validate input
    // 5. Prisma query / transaction
    // 6. Return NextResponse.json()
  } catch (error) {
    console.error(...)
    return 500
  }
}
```

### Pagination chuẩn cho GET list

```typescript
// Query params: ?page=1&limit=10&search=keyword
const skip = (page - 1) * limit
const [total, data] = await Promise.all([
  prisma.model.count({ where }),
  prisma.model.findMany({ where, skip, take: limit, orderBy })
])
return { data, pagination: { total, page, limit, totalPages } }
```

---

## 6. Module Nhập kho (Stock-In)

### 6.1 Luồng tạo phiếu nhập

```
User (Staff/Manager/Admin)
  │
  ▼
[Trang /stock-in/new]
  ├── Chọn nhà cung cấp (dropdown từ /api/suppliers)
  ├── Chọn ngày nhập, PO Number, số hợp đồng
  ├── Quét mã vạch / nhập SKU sản phẩm
  │     └── Gọi GET /api/products/search?q={sku}
  │           └── Tìm theo: sku, barcode, serialNumber, name
  ├── Nhập: số serial, số lượng, đơn giá, số tháng bảo hành
  └── Thêm vào danh sách items

  → Nhấn "Xác nhận nhập kho" → POST /api/stock-in
```

### 6.2 API POST /api/stock-in — Transaction Logic

```
prisma.$transaction(async (tx) => {
  1. VALIDATE: supplierId và items[] không được rỗng
  2. GENERATE CODE: Đếm số phiếu trong tháng → "PN{YYYY}{MM}{NNNN}"
     ví dụ: PN2026060001
  3. CALCULATE: totalAmount = Σ(unitPrice × quantity)
  4. CREATE StockIn record
  5. CREATE StockInItem[] (nested create) với:
     - productId, serialNumber, quantity
     - unitPrice, totalPrice
     - warrantyMonths (mặc định 12)
     - warrantyExpiry = importDate + warrantyMonths
  6. Nếu status = "CONFIRMED" (không phải DRAFT/CANCELLED):
     FOR EACH item:
       a. UPDATE product.quantity += item.quantity
       b. CREATE InventoryTransaction {
            type: "STOCK_IN",
            balanceBefore: product.quantity (trước khi cộng),
            balanceAfter: product.quantity + item.quantity
          }
  7. CREATE AuditLog { action: "CREATE", module: "STOCK_IN" }
  8. RETURN stockIn object
})
```

### 6.3 Mã phiếu nhập

- Format: **`PNYYYYMMNNNN`**
- Ví dụ: `PN2026060001`, `PN2026060042`
- Đếm số phiếu có `code LIKE 'PN{currentYear}{currentMonth}%'` để xác định sequence tiếp theo

### 6.4 API GET /api/stock-in — Tìm kiếm

Tìm kiếm theo: `code` · `poNumber` · `contractNumber` · `supplier.name`

### 6.5 Trang danh sách phiếu nhập `/stock-in`

- Hiển thị bảng: Mã phiếu, Nhà cung cấp, Ngày nhập, PO, Tổng tiền, Trạng thái
- Filter theo trạng thái: DRAFT / CONFIRMED / CANCELLED
- Tìm kiếm real-time
- Pagination

---

## 7. Module Xuất kho (Stock-Out) và Bảo hành

### 7.1 Luồng tạo phiếu xuất

```
User
  │
  ▼
[Trang /stock-out/new]
  ├── Chọn khách hàng (dropdown từ /api/customers)
  ├── Chọn ngày xuất, PO Number, số hợp đồng, ghi chú
  ├── Quét mã vạch / nhập SKU sản phẩm
  │     └── Hiển thị tồn kho hiện tại của sản phẩm
  ├── Nhập cho từng sản phẩm:
  │     ├── Số Serial (S/N)
  │     ├── Số lượng xuất (không vượt quá tồn kho)
  │     ├── Đơn giá bán
  │     ├── Số tháng bảo hành (warrantyMonths)    [quan trọng]
  │     └── Ngày bắt đầu bảo hành (warrantyStartDate)  [quan trọng]
  └── Thêm vào danh sách items

  → Nhấn "Xác nhận xuất kho" → POST /api/stock-out
```

### 7.2 API POST /api/stock-out — Transaction Logic

```
prisma.$transaction(async (tx) => {
  1. VALIDATE INVENTORY: FOR EACH item
     - Tìm product trong DB
     - Kiểm tra: product.quantity >= item.quantity
     - Nếu không đủ → throw Error (transaction rollback)

  2. GENERATE CODE: "PX{YYYY}{MM}{NNNN}"
     ví dụ: PX2026060001

  3. CALCULATE: totalAmount = Σ(unitPrice × quantity)

  4. CREATE StockOut record

  5. CREATE StockOutItem[] với:
     - warrantyStartDate = item.warrantyStartDate || exportDate
     - warrantyEndDate = warrantyStartDate + warrantyMonths (tháng)
       (Dùng Date.setMonth() để tính ngày kết thúc BH)
     - Lưu: warrantyMonths, warrantyStartDate, warrantyEndDate

  6. Nếu status = "CONFIRMED":
     FOR EACH stockOutItem:
       a. UPDATE product.quantity -= item.quantity  (trừ tồn kho)
       b. CREATE InventoryTransaction {
            type: "STOCK_OUT",
            balanceBefore: product.quantity (trước khi trừ),
            balanceAfter: product.quantity - item.quantity
          }
       c. Nếu warrantyMonths > 0 AND warrantyStartDate AND warrantyEndDate:
          CREATE WarrantyRecord {
            productId, customerId, stockOutItemId,
            serialNumber, warrantyMonths,
            startDate, endDate,
            status: "ACTIVE"
          }

  7. CREATE AuditLog { action: "CREATE", module: "STOCK_OUT" }

  8. RETURN stockOut object
})
```

**Tính năng bảo vệ:** Transaction wrap trong `prisma.$transaction()` —
nếu bất kỳ bước nào thất bại (ví dụ: thiếu hàng), toàn bộ transaction bị rollback.

### 7.3 Mã phiếu xuất

- Format: **`PXYYYYMMNNNN`**
- Ví dụ: `PX2026060001`, `PX2026060015`

### 7.4 Tính toán ngày bảo hành

```
warrantyEndDate = warrantyStartDate + warrantyMonths (tháng)
```
- Nếu ngày bắt đầu BH không được nhập → mặc định là ngày xuất kho (`exportDate`)
- Dùng `Date.prototype.setMonth()` để cộng tháng, xử lý đúng năm tiếp theo

---

## 8. Module Tồn kho (Inventory)

### 8.1 Nguồn dữ liệu tồn kho

Trường `product.quantity` (INT) là **số lượng thực tế hiện tại** trong kho:
- **Tăng** khi có phiếu STOCK_IN được CONFIRMED
- **Giảm** khi có phiếu STOCK_OUT được CONFIRMED

### 8.2 Trang /inventory

**API sử dụng:** `GET /api/products?limit=100`

**Hiển thị:**
- Tên sản phẩm, SKU, Danh mục, Tồn kho hiện tại, Tồn tối thiểu
- Đơn giá nhập, Đơn giá bán, Giá trị tồn (quantity × costPrice)
- Badge trạng thái: Hết hàng / Sắp hết / Còn hàng
- Filter: Chỉ hiện sản phẩm sắp hết hàng (quantity <= minQuantity)
- Summary cards: Tổng sản phẩm, Tổng số lượng tồn, Tổng giá trị tồn

### 8.3 Lịch sử biến động (InventoryTransaction)

Mỗi lần nhập/xuất tạo 1 record:
```
{
  productId, type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "RETURN",
  quantity: số lượng thay đổi,
  balanceBefore: tồn kho trước khi thay đổi,
  balanceAfter: tồn kho sau khi thay đổi,
  referenceId: id phiếu,
  referenceCode: mã phiếu (PNxxxx / PXxxxx)
}
```

---

## 9. Module Bảo hành (Warranty)

### 9.1 Cách tạo record bảo hành

Bảo hành được tạo **tự động** khi tạo phiếu xuất kho (POST /api/stock-out), điều kiện:
- `warrantyMonths > 0`
- `warrantyStartDate` khác null
- `warrantyEndDate` khác null
- Status phiếu xuất là `CONFIRMED`

### 9.2 Tra cứu bảo hành

**API:** `GET /api/warranty?page=&limit=&search=&status=`

- Tìm theo: `serialNumber` · `product.name` · `customer.name`
- Filter theo status: `ACTIVE` / `EXPIRED` / `VOIDED` / `ALL`
- Tích hợp **quét mã vạch** để tra cứu theo serial number

### 9.3 Trạng thái bảo hành

Hàm `getWarrantyStatus()` trong `src/lib/utils.ts`:
```
endDate so với ngày hôm nay:
  - Quá ngày → "expired" (Hết bảo hành)
  - Còn <= 30 ngày → "expiring" (Còn {n} ngày) [màu vàng]
  - Còn > 30 ngày → "active" (Còn {n} ngày) [màu xanh]
```

### 9.4 Trang /warranty

- Tabs: Tất cả / Đang bảo hành / Sắp hết / Đã hết
- Quét mã barcode → tìm theo serial number
- Hiển thị tên phiếu xuất, ngày bán, thời hạn bảo hành còn lại

---

## 10. Module Sản phẩm & Danh mục

### 10.1 Sản phẩm

**API:** `GET/POST /api/products` · `GET/PUT/DELETE /api/products/[id]`

**Tìm kiếm sản phẩm (dùng cho barcode scanner):**
`GET /api/products/search?q={keyword}`
→ Tìm theo: `name` · `sku` · `barcode` · `serialNumber`
→ Trả về **object đơn** (không phải array)

**Tạo sản phẩm (POST):**
- Validate: `name` và `sku` là bắt buộc
- Kiểm tra trùng SKU
- Tạo record, ghi AuditLog

**Cập nhật/Xóa (mềm):**
- PUT: cập nhật thông tin, không thay đổi quantity trực tiếp
- DELETE: set `isActive = false` (soft delete)

### 10.2 Danh mục (Categories)

**API:** `GET/POST /api/categories` · `GET/PUT/DELETE /api/categories/[id]`

- Bao gồm `_count.products` để biết số sản phẩm trong mỗi danh mục
- Code là unique, dùng để tra cứu nhanh

---

## 11. Module Nhà cung cấp & Khách hàng

### 11.1 Nhà cung cấp (Suppliers)

**API:** `GET/POST /api/suppliers` · `GET/PUT/DELETE /api/suppliers/[id]`

- Tìm kiếm theo: `name` · `code` · `email` · `phone`
- GET single: kèm 10 phiếu nhập gần đây (include stockIns)
- DELETE: Soft delete (`isActive = false`)

### 11.2 Khách hàng (Customers)

**API:** `GET/POST /api/customers` · `GET/PUT/DELETE /api/customers/[id]`

- Tìm kiếm theo: `name` · `code` · `email` · `phone`
- GET single: kèm phiếu xuất và hồ sơ bảo hành
- DELETE: Soft delete

---

## 12. Module Báo cáo (Reports)

**Các sub-API:**

| Route | Nội dung |
|-------|----------|
| `GET /api/reports/inventory` | Báo cáo tồn kho: tất cả sản phẩm + quantity + giá trị |
| `GET /api/reports/stock-in` | Báo cáo nhập kho theo khoảng thời gian |
| `GET /api/reports/stock-out` | Báo cáo xuất kho theo khoảng thời gian |
| `GET /api/reports/profit` | Báo cáo lợi nhuận: doanh thu (stockOut) - chi phí (stockIn) |
| `GET /api/reports/warranty` | Báo cáo bảo hành: sắp hết, đã hết |

**Query params chung:** `?from=YYYY-MM-DD&to=YYYY-MM-DD`

**Tính lợi nhuận:**
```
Doanh thu = Σ(StockOutItem.totalPrice) trong kỳ
Chi phí   = Σ(StockInItem.totalPrice) trong kỳ
Lợi nhuận = Doanh thu - Chi phí
```

---

## 13. Module Người dùng & Vai trò

### 13.1 Quản lý User

**API:** `GET/POST /api/users` · `GET/PUT/DELETE /api/users/[id]`

- Chỉ ADMIN mới có quyền quản lý user
- Tạo user: hash password với `bcryptjs` (salt rounds = 10)
- Gán Role khi tạo/sửa: thông qua bảng `UserRole`
- Kích hoạt/Vô hiệu hóa: set `isActive`

**Trang /users:**
- Hiển thị bảng users với role badges
- Dialog tạo/sửa user ngay trên trang (không redirect)
- Nếu không phải Admin → hiển thị thông báo "Không có quyền"

### 13.2 Quản lý Role & Permission

**API:** `GET /api/roles`

- Seed data tạo sẵn 4 roles với permissions tương ứng
- Không có UI tạo role mới (quản lý qua seed/migration)

---

## 14. Dashboard

**API:** `GET /api/dashboard`

**Dữ liệu trả về:**

```typescript
{
  totalProducts: number,          // Tổng sản phẩm active
  totalStock: number,             // Tổng số lượng tồn kho
  totalStockValue: number,        // Σ(quantity × costPrice)
  monthlyRevenue: number,         // Doanh thu tháng này
  monthlyCost: number,            // Chi phí tháng này
  monthlyProfit: number,          // = revenue - cost
  lowStockProducts: number,       // Số sản phẩm quantity <= minQuantity
  expiringWarranties: number,     // BH hết hạn trong 30 ngày
  monthlyData: [                  // 6 tháng gần nhất
    { month: "Tháng 1", import: ..., export: ... }
  ],
  recentStockIn: StockIn[],       // 5 phiếu nhập gần nhất
  recentStockOut: StockOut[],     // 5 phiếu xuất gần nhất
  lowStockList: Product[],        // 10 sản phẩm sắp hết hàng
}
```

**Components Dashboard:**
- `StatsCards`: 6 thẻ số liệu tổng quan
- `Charts` (Recharts): Biểu đồ Bar nhập/xuất theo tháng + Line doanh thu/chi phí
- `RecentTransactions`: 2 bảng phiếu nhập/xuất gần đây
- `LowStockAlert`: Cảnh báo sản phẩm sắp hết hàng

---

## 15. Quét mã vạch (Barcode Scanner)

**Component:** `src/components/barcode/barcode-scanner-input.tsx`

### 15.1 Nguyên lý hoạt động

Máy quét barcode hoạt động như một **bàn phím ảo** — gửi ký tự rất nhanh rồi kết thúc bằng phím `Enter`.

```
Barcode Scanner Hardware
  → Gửi ký tự liên tục (interval < 50ms/char)
  → Kết thúc bằng Enter

BarcodeScannerInput Component:
  1. Lắng nghe onKeyDown
  2. Theo dõi thời gian giữa các phím (timeDiff = Date.now() - lastKeyTime)
  3. Nếu Enter được nhấn → gọi handleScan(currentValue)
  4. handleScan():
     a. playBeep("success") — âm thanh xác nhận qua AudioContext
     b. Gọi onScan(value) callback → fetch API tìm sản phẩm
     c. Clear input, refocus
```

### 15.2 Phân biệt nhập tay vs barcode scanner

```
Barcode scanner: timeDiff < 50ms → đánh dấu là scan
Nhập tay:        timeDiff > 50ms → nhập bình thường
Cả hai:          Nhấn Enter → trigger onScan()
```

### 15.3 Âm thanh phản hồi

```typescript
playBeep("success") → 1000Hz, 0.1s  (xanh: tìm thấy)
playBeep("error")   → 300Hz, 0.25s  (đỏ: không tìm thấy)
```
Dùng `AudioContext` API — không cần file âm thanh bên ngoài.

### 15.4 Nơi sử dụng

- `/stock-in/new` — quét mã khi nhập kho
- `/stock-out/new` — quét mã khi xuất kho
- `/warranty` — tra cứu bảo hành theo serial

---

## 16. Audit Log

Mỗi hành động quan trọng đều ghi `AuditLog`:

```typescript
await prisma.auditLog.create({
  data: {
    userId: session.user.id,
    action: "CREATE" | "UPDATE" | "DELETE",
    module: "PRODUCTS" | "STOCK_IN" | "STOCK_OUT" | "...",
    targetId: record.id,
    targetName: record.name || record.code,
    oldValues: JSON,   // Giá trị trước khi sửa (optional)
    newValues: JSON,   // Giá trị sau khi sửa (optional)
  }
})
```

**Modules được audit:** PRODUCTS · STOCK_IN · STOCK_OUT · SUPPLIERS · CUSTOMERS · USERS · CATEGORIES

---

## 17. Luồng dữ liệu tổng thể

### Luồng Nhập kho → Tồn kho

```
[Tạo phiếu nhập CONFIRMED]
        │
        ▼
StockIn + StockInItem[] tạo trong DB
        │
        ▼
FOR EACH item:
  product.quantity += item.quantity  (UPDATE)
  InventoryTransaction {type: STOCK_IN} tạo  (INSERT)
        │
        ▼
Trang /inventory hiển thị quantity mới
Dashboard cập nhật totalStock
```

### Luồng Xuất kho → Tồn kho → Bảo hành

```
[Tạo phiếu xuất CONFIRMED]
        │
        ▼
Validate: product.quantity >= item.quantity (mỗi sản phẩm)
        │
        ▼  (Transaction)
StockOut + StockOutItem[] tạo
        │
        ├── FOR EACH item:
        │     product.quantity -= item.quantity  (UPDATE)
        │     InventoryTransaction {type: STOCK_OUT}  (INSERT)
        │     IF warrantyMonths > 0:
        │       WarrantyRecord {status: ACTIVE}  (INSERT)
        │
        ▼
Trang /inventory: quantity giảm
Trang /warranty: xuất hiện record bảo hành mới
Dashboard: cập nhật monthlyRevenue, lowStockProducts
```

### Luồng Tra cứu bảo hành theo mã serial

```
User quét barcode serial number
        │
        ▼
BarcodeScannerInput.onScan(serialNumber)
        │
        ▼
GET /api/warranty?search={serialNumber}
WHERE serialNumber LIKE '%{serialNumber}%'
        │
        ▼
Hiển thị: Sản phẩm, Khách hàng, Ngày BH, Ngày hết BH, Trạng thái
```

---

## 18. Biến môi trường

File `.env` (root project):

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/stockmanagement"

# NextAuth
AUTH_SECRET="your-secret-key-minimum-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# App
NODE_ENV="development"
```

**Lưu ý:**
- `AUTH_SECRET` phải là chuỗi ngẫu nhiên ít nhất 32 ký tự
- Dùng `openssl rand -base64 32` để tạo secret an toàn
- Không commit file `.env` lên Git (thêm vào `.gitignore`)

---

## Phụ lục A — Utility Functions (`src/lib/utils.ts`)

| Hàm | Mô tả |
|-----|-------|
| `cn(...classes)` | Merge Tailwind classes (clsx + tailwind-merge) |
| `formatCurrency(amount)` | Format số thành tiền VND: `1.500.000 đ` |
| `formatDate(date)` | Format ngày: `dd/MM/yyyy` theo locale vi |
| `formatDateTime(date)` | Format ngày giờ: `dd/MM/yyyy HH:mm` |
| `formatRelativeTime(date)` | Thời gian tương đối: "3 giờ trước" |
| `getWarrantyStatus(endDate)` | Trả về `{status, label, daysLeft}` |
| `generateCode(prefix, seq)` | Tạo mã: `PN2026060001` |

---

## Phụ lục B — UI Component Library (`src/components/ui/`)

24 components Shadcn-style được implement thủ công:

| Component | Radix UI primitive |
|-----------|-------------------|
| `Button` | — |
| `Input`, `Textarea`, `Label` | — |
| `Card`, `CardHeader`, `CardContent`... | — |
| `Badge` (variants: default, secondary, destructive, outline, success, warning) | — |
| `Dialog` | `@radix-ui/react-dialog` |
| `AlertDialog` | `@radix-ui/react-alert-dialog` |
| `Select` | `@radix-ui/react-select` |
| `DropdownMenu` | `@radix-ui/react-dropdown-menu` |
| `Table`, `TableHeader`, `TableBody`... | — |
| `Tabs` | `@radix-ui/react-tabs` |
| `Checkbox` | `@radix-ui/react-checkbox` |
| `Switch` | `@radix-ui/react-switch` |
| `Avatar` | `@radix-ui/react-avatar` |
| `ScrollArea` | `@radix-ui/react-scroll-area` |
| `Separator` | `@radix-ui/react-separator` |
| `Skeleton` | — |
| `Popover` | `@radix-ui/react-popover` |
| `Command` | `cmdk` |
| `PageHeader` | — (dùng trong mọi trang) |
| `SearchInput` | — (debounced search input) |
| `DataTable` | — (bảng chuẩn có sort, pagination) |
| `ConfirmDialog` | Wrap AlertDialog, dùng xác nhận xóa |

---

## Phụ lục C — Layout System

```
DashboardLayout (client component)
├── Sidebar (256px, dark theme: bg-slate-900)
│   ├── Logo: Boxes icon + "Stock Manager" + "Datatech"
│   ├── Navigation groups:
│   │   ├── TỔNG QUAN: Dashboard
│   │   ├── KHO HÀNG: Nhập kho, Xuất kho, Tồn kho
│   │   ├── DANH MỤC: Sản phẩm, Danh mục, Nhà cung cấp, Khách hàng
│   │   ├── BẢO HÀNH: Quản lý BH
│   │   ├── BÁO CÁO: Báo cáo
│   │   └── HỆ THỐNG: Người dùng, Cài đặt
│   └── Bottom: Avatar + Tên + Logout
└── Main area
    ├── Header (64px, bg-white)
    │   ├── Left: Hamburger (mobile) + Breadcrumb
    │   └── Right: Bell notification + User dropdown
    └── Content (scrollable, padding 24px)
```

**Responsive:**
- Desktop >= 1024px: Sidebar cố định 256px bên trái
- Mobile < 1024px: Sidebar overlay, toggle bằng hamburger menu

---

*Tài liệu này mô tả toàn bộ logic kinh doanh và kỹ thuật của hệ thống Stock Management — Datatech.*
*Cập nhật lần cuối: 2026-06-13*
