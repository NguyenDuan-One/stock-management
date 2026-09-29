# Stock Management - Datatech

Hệ thống quản lý nhập / xuất / tồn kho và bảo hành thiết bị dành cho doanh nghiệp.

---

## 🛠 Công nghệ sử dụng

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Database & ORM**: MySQL, Prisma ORM
- **Authentication**: NextAuth.js v5 (Beta)
- **Form & Validation**: React Hook Form, Zod

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Cấu hình biến môi trường (`.env`)

Sao chép `.env.example` thành `.env` (nếu chưa có) và cập nhật thông tin kết nối MySQL:

```env
DATABASE_URL="mysql://root:@localhost:3306/stockmanagement"
AUTH_SECRET="stock-management-secret-key-2026-datatech-vn"
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_NAME="Stock Management"
```

> **Lưu ý**: Đảm bảo MySQL (qua **XAMPP**, **Laragon**, hoặc Docker) đang chạy ở cổng `3306`.

### 3. Đồng bộ cơ sở dữ liệu & Khởi tạo tài khoản (Seed Data)

Chạy các lệnh sau để khởi tạo bảng và dữ liệu mẫu (quyền hạn, vai trò, tài khoản, danh mục...):

```bash
# 1. Đồng bộ cấu trúc bảng vào database
npm run db:push

# 2. Khởi tạo tài khoản Admin và dữ liệu mẫu
npm run db:seed
```

---

## 👥 Danh sách tài khoản mặc định

Sau khi chạy `npm run db:seed`, bạn có thể đăng nhập bằng các tài khoản sau:

| Vai trò | Username / Email | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin` *(hoặc `admin@datatech.vn`)* | `Admin@123` | **Toàn quyền hệ thống** |
| **Quản lý (Manager)** | `manager` *(hoặc `manager@datatech.vn`)* | `Admin@123` | Quản lý kho, duyệt phiếu, xuất báo cáo |
| **Nhân viên (Staff)** | `staff1` *(hoặc `staff1@datatech.vn`)* | `Admin@123` | Tạo phiếu nhập / xuất kho |
| **Người xem (Viewer)** | `viewer` *(hoặc `viewer@datatech.vn`)* | `Admin@123` | Chỉ xem thông tin |

---

## 💻 Các lệnh chạy hệ thống (Scripts)

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run dev` | **Khởi động dev server với Webpack** (đã cấu hình mặc định để chống crash trên Windows) |
| `npm run dev:turbo` | Khởi động dev server với Turbopack |
| `npm run build` | Build ứng dụng cho môi trường Production |
| `npm run start` | Chạy ứng dụng Production sau khi đã build |
| `npm run db:push` | Đẩy schema Prisma lên MySQL mà không cần tạo file migration |
| `npm run db:seed` | Chạy file `prisma/seed.ts` để nạp dữ liệu mẫu ban đầu |

> **💡 Lưu ý cho người dùng Windows**: Nếu gặp lỗi `FATAL: An unexpected Turbopack error occurred (panic: Next.js package not found)`, hãy sử dụng lệnh `npm run dev:webpack` để dev server chạy mượt mà và ổn định nhất.
