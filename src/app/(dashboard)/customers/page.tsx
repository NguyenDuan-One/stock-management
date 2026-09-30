"use client"

import * as React from "react"
import { Plus, Edit, Trash, Loader2, Search, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { PageHeader } from "@/components/ui/page-header"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { TablePagination } from "@/components/ui/table-pagination"
import { toast } from "sonner"

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const limit = 10
  
  // Dialog state
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingCustomer, setEditingCustomer] = React.useState<any>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form states
  const [name, setName] = React.useState("")
  const [code, setCode] = React.useState("")
  const [contactName, setContactName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [taxCode, setTaxCode] = React.useState("")
  const [notes, setNotes] = React.useState("")

  // Delete state
  const [deletingCustomer, setDeletingCustomer] = React.useState<any>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    fetchCustomers()
  }, [search, page])

  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams({
        search,
        page: String(page),
        limit: String(limit),
      })
      const res = await fetch(`/api/customers?${queryParams}`)
      const json = await res.json()
      setCustomers(Array.isArray(json) ? json : json.data || [])
      setTotal(json.pagination?.total || 0)
    } catch (error) {
      console.error(error)
      toast.error("Không thể tải danh sách khách hàng")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingCustomer(null)
    setName("")
    setCode("")
    setContactName("")
    setPhone("")
    setEmail("")
    setAddress("")
    setTaxCode("")
    setNotes("")
    setIsOpen(true)
  }

  const handleOpenEdit = (customer: any) => {
    setEditingCustomer(customer)
    setName(customer.name || "")
    setCode(customer.code || "")
    setContactName(customer.contactName || "")
    setPhone(customer.phone || "")
    setEmail(customer.email || "")
    setAddress(customer.address || "")
    setTaxCode(customer.taxCode || "")
    setNotes(customer.notes || "")
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) {
      toast.error("Tên khách hàng và Mã KH là bắt buộc")
      return
    }

    setIsSubmitting(true)
    const isEdit = !!editingCustomer
    const url = isEdit ? `/api/customers/${editingCustomer.id}` : "/api/customers"
    const method = isEdit ? "PUT" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          contactName,
          phone,
          email,
          address,
          taxCode,
          notes,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Có lỗi xảy ra")

      toast.success(isEdit ? "Cập nhật khách hàng thành công" : "Tạo khách hàng thành công")
      setIsOpen(false)
      fetchCustomers()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Không thể thực hiện tác vụ")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCustomer) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/customers/${deletingCustomer.id}`, {
        method: "DELETE",
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Có lỗi xảy ra khi xóa")
      }

      toast.success(json.message || "Xóa khách hàng thành công")
      setDeletingCustomer(null)
      fetchCustomers()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Không thể xóa khách hàng")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Khách hàng"
        subtitle="Quản lý danh sách khách hàng doanh nghiệp và cá nhân"
      >
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm khách hàng
        </Button>
      </PageHeader>

      <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo tên, mã, điện thoại..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9 bg-white"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-[70px] min-w-[70px]">STT</TableHead>
                <TableHead className="w-[120px] min-w-[120px]">Mã KH</TableHead>
                <TableHead className="min-w-[240px]">Tên khách hàng</TableHead>
                <TableHead className="min-w-[160px]">Người liên hệ</TableHead>
                <TableHead className="min-w-[200px]">Thông tin liên lạc</TableHead>
                <TableHead className="min-w-[130px]">Mã số thuế</TableHead>
                <TableHead className="w-[110px] min-w-[110px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                    <span className="mt-2 block text-xs">Đang tải dữ liệu...</span>
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                    Chưa có thông tin khách hàng nào.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((cust, idx) => (
                  <TableRow key={cust.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium">{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell className="font-mono font-medium text-slate-900">{cust.code}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-800">{cust.name}</div>
                      {cust.address && (
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-sm">{cust.address}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-700 font-medium">{cust.contactName || "-"}</TableCell>
                    <TableCell className="text-slate-600 space-y-1">
                      {cust.phone && (
                        <div className="text-xs flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{cust.phone}</span>
                        </div>
                      )}
                      {cust.email && (
                        <div className="text-xs flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{cust.email}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{cust.taxCode || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleOpenEdit(cust)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeletingCustomer(cust)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card List View */}
        <div className="divide-y divide-slate-100 md:hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
              <span className="mt-2 block text-xs">Đang tải dữ liệu...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Chưa có thông tin khách hàng nào.
            </div>
          ) : (
            customers.map((cust) => (
              <div key={cust.id} className="p-4 space-y-2.5 bg-white hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-900 text-sm block truncate">{cust.name}</span>
                    <span className="font-mono text-xs text-blue-600 font-medium">Mã: {cust.code}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                      onClick={() => handleOpenEdit(cust)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                      onClick={() => setDeletingCustomer(cust)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  {cust.contactName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Người liên hệ:</span>
                      <span className="font-medium text-slate-800">{cust.contactName}</span>
                    </div>
                  )}
                  {cust.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Điện thoại:</span>
                      <span className="font-medium text-slate-800">{cust.phone}</span>
                    </div>
                  )}
                  {cust.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="text-slate-700">{cust.email}</span>
                    </div>
                  )}
                  {cust.address && (
                    <div className="pt-1 text-[11px] text-slate-500 flex items-start gap-1">
                      <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-slate-400" />
                      <span>{cust.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <TablePagination
          page={page}
          limit={limit}
          total={total}
          itemLabel="khách hàng"
          onPageChange={setPage}
        />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Cập nhật thông tin khách hàng" : "Tạo mới khách hàng"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="cust-code">Mã khách hàng *</Label>
                <Input
                  id="cust-code"
                  placeholder="VD: KH-DATATECH"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={!!editingCustomer}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-name">Tên khách hàng *</Label>
                <Input
                  id="cust-name"
                  placeholder="VD: Công ty TNHH Datatech"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-contact">Người liên hệ</Label>
                <Input
                  id="cust-contact"
                  placeholder="VD: Nguyễn Thị B"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-phone">Số điện thoại</Label>
                <Input
                  id="cust-phone"
                  placeholder="VD: 0987654321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-email">Email</Label>
                <Input
                  id="cust-email"
                  type="email"
                  placeholder="VD: contact@client.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-tax">Mã số thuế</Label>
                <Input
                  id="cust-tax"
                  placeholder="VD: 0312345678"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cust-address">Địa chỉ</Label>
                <Input
                  id="cust-address"
                  placeholder="VD: 456 Đường X, Quận Y, TP. Z"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cust-notes">Ghi chú</Label>
                <Textarea
                  id="cust-notes"
                  placeholder="Thông tin thêm..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
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

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa khách hàng"
        description={`Bạn có chắc chắn muốn xóa khách hàng "${deletingCustomer?.name}"?`}
        isLoading={isDeleting}
      />
    </div>
  )
}
