"use client"

import * as React from "react"
import { Plus, Edit, Trash, Loader2, ShieldAlert, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { TablePagination } from "@/components/ui/table-pagination"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

export default function UsersPage() {
  const { isAdmin } = usePermissions()
  const [users, setUsers] = React.useState<any[]>([])
  const [roles, setRoles] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const limit = 10

  // Dialogs
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<any>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form states
  const [fullName, setFullName] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [roleId, setRoleId] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)

  React.useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [page])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/users?page=${page}&limit=${limit}`)
      const json = await res.json()
      setUsers(Array.isArray(json) ? json : json.data || [])
      setTotal(json.pagination?.total || 0)
    } catch (error) {
      console.error(error)
      toast.error("Không thể tải danh sách người dùng")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles")
      const json = await res.json()
      setRoles(json)
    } catch (error) {
      console.error(error)
    }
  }

  const handleOpenAdd = () => {
    setEditingUser(null)
    setFullName("")
    setUsername("")
    setEmail("")
    setPassword("")
    setPhone("")
    setRoleId(roles[0]?.id || "")
    setIsActive(true)
    setIsOpen(true)
  }

  const handleOpenEdit = (u: any) => {
    setEditingUser(u)
    setFullName(u.fullName || "")
    setUsername(u.username || "")
    setEmail(u.email || "")
    setPassword("") // Clear password fields during edit
    setPhone(u.phone || "")
    setRoleId(u.userRoles?.[0]?.role?.id || "")
    setIsActive(u.isActive)
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !username.trim() || !email.trim()) {
      toast.error("Vui lòng nhập đầy đủ họ tên, username và email")
      return
    }

    if (!editingUser && !password.trim()) {
      toast.error("Mật khẩu là bắt buộc khi tạo mới người dùng")
      return
    }

    setIsSubmitting(true)
    const isEdit = !!editingUser
    const url = isEdit ? `/api/users/${editingUser.id}` : "/api/users"
    const method = isEdit ? "PUT" : "POST"

    try {
      const payload = {
        fullName,
        username,
        email,
        phone,
        roleId, // For edit single relation
        roleIds: [roleId], // For API POST expects array of roleIds
        isActive,
        ...(password.trim() && { password }),
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Có lỗi xảy ra")

      toast.success(isEdit ? "Cập nhật người dùng thành công" : "Tạo người dùng thành công")
      setIsOpen(false)
      fetchUsers()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Lỗi thao tác")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case "ADMIN":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">Admin</Badge>
      case "MANAGER":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">Manager</Badge>
      case "STAFF":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Staff</Badge>
      case "VIEWER":
        return <Badge className="bg-slate-100 text-slate-850 hover:bg-slate-100 border-none">Viewer</Badge>
      default:
        return <Badge variant="secondary">{roleName}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Người dùng"
        subtitle="Quản lý tài khoản truy cập và vai trò phân quyền của nhân viên"
      >
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm người dùng
        </Button>
      </PageHeader>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead>Họ và tên</TableHead>
              <TableHead>Tên tài khoản</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-[100px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                  <span className="mt-2 block text-xs">Đang tải dữ liệu...</span>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                  Chưa có tài khoản nào được tạo.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const roleName = u.userRoles?.[0]?.role?.name || "VIEWER"
                return (
                  <TableRow key={u.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-slate-800">{u.fullName}</TableCell>
                    <TableCell className="font-mono text-slate-900 font-medium">{u.username}</TableCell>
                    <TableCell className="text-slate-600">{u.email}</TableCell>
                    <TableCell className="text-slate-600">{u.phone || "-"}</TableCell>
                    <TableCell>{getRoleBadge(roleName)}</TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                          <UserCheck className="h-3 w-3" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          <UserX className="h-3 w-3" /> Tạm khóa
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700"
                        onClick={() => handleOpenEdit(u)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          limit={limit}
          total={total}
          itemLabel="người dùng"
          onPageChange={setPage}
        />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Cập nhật người dùng" : "Tạo mới người dùng"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="usr-fullname">Họ và tên *</Label>
              <Input
                id="usr-fullname"
                placeholder="VD: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usr-username">Username *</Label>
                <Input
                  id="usr-username"
                  placeholder="VD: admin, nhanvien"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!!editingUser}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usr-phone">Số điện thoại</Label>
                <Input
                  id="usr-phone"
                  placeholder="0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="usr-email">Email *</Label>
              <Input
                id="usr-email"
                type="email"
                placeholder="email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usr-password">Mật khẩu {editingUser && "(Để trống nếu không đổi)"}</Label>
              <Input
                id="usr-password"
                type="password"
                placeholder={editingUser ? "••••••••" : "Nhập mật khẩu tài khoản..."}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editingUser}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vai trò *</Label>
                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingUser && (
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select value={String(isActive)} onValueChange={(val) => setIsActive(val === "true")}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Hoạt động</SelectItem>
                      <SelectItem value="false">Khóa tài khoản</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
