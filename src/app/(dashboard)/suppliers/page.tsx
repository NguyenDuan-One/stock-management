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

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const limit = 10
  
  // Dialog state
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingSupplier, setEditingSupplier] = React.useState<any>(null)
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
  const [deletingSupplier, setDeletingSupplier] = React.useState<any>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    fetchSuppliers()
  }, [search, page])

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams({
        search,
        page: String(page),
        limit: String(limit),
      })
      const res = await fetch(`/api/suppliers?${queryParams}`)
      const json = await res.json()
      setSuppliers(Array.isArray(json) ? json : json.data || [])
      setTotal(json.pagination?.total || 0)
    } catch (error) {
      console.error(error)
      toast.error("Không thể tải danh sách nhà cung cấp")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingSupplier(null)
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

  const handleOpenEdit = (supplier: any) => {
    setEditingSupplier(supplier)
    setName(supplier.name || "")
    setCode(supplier.code || "")
    setContactName(supplier.contactName || "")
    setPhone(supplier.phone || "")
    setEmail(supplier.email || "")
    setAddress(supplier.address || "")
    setTaxCode(supplier.taxCode || "")
    setNotes(supplier.notes || "")
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) {
      toast.error("Tên NCC và Mã NCC là bắt buộc")
      return
    }

    setIsSubmitting(true)
    const isEdit = !!editingSupplier
    const url = isEdit ? `/api/suppliers/${editingSupplier.id}` : "/api/suppliers"
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

      toast.success(isEdit ? "Cập nhật nhà cung cấp thành công" : "Tạo nhà cung cấp thành công")
      setIsOpen(false)
      fetchSuppliers()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Không thể thực hiện tác vụ")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingSupplier) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/suppliers/${deletingSupplier.id}`, {
        method: "DELETE",
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Có lỗi xảy ra khi xóa")
      }

      toast.success(json.mode === "soft" ? "Đã ẩn nhà cung cấp vì có phiếu nhập liên quan" : "Xóa nhà cung cấp thành công")
      setDeletingSupplier(null)
      fetchSuppliers()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Không thể xóa nhà cung cấp")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhà cung cấp"
        subtitle="Quản lý thông tin đối tác cung cấp thiết bị"
      >
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm nhà cung cấp
        </Button>
      </PageHeader>

      <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo tên, mã, số điện thoại..."
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
                <TableHead className="w-[120px] min-w-[120px]">Mã NCC</TableHead>
                <TableHead className="min-w-[240px]">Tên NCC</TableHead>
                <TableHead className="min-w-[160px]">Liên hệ</TableHead>
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
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                    Chưa có đối tác nhà cung cấp nào.
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((sup, idx) => (
                  <TableRow key={sup.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium">{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell className="font-mono font-medium text-slate-900">{sup.code}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-800">{sup.name}</div>
                      {sup.address && (
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-sm">{sup.address}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-700 font-medium">{sup.contactName || "-"}</TableCell>
                    <TableCell className="text-slate-600 space-y-1">
                      {sup.phone && (
                        <div className="text-xs flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{sup.phone}</span>
                        </div>
                      )}
                      {sup.email && (
                        <div className="text-xs flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{sup.email}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{sup.taxCode || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleOpenEdit(sup)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeletingSupplier(sup)}
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
          ) : suppliers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Chưa có đối tác nhà cung cấp nào.
            </div>
          ) : (
            suppliers.map((sup) => (
              <div key={sup.id} className="p-4 space-y-2.5 bg-white hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-900 text-sm block truncate">{sup.name}</span>
                    <span className="font-mono text-xs text-blue-600 font-medium">Mã: {sup.code}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                      onClick={() => handleOpenEdit(sup)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                      onClick={() => setDeletingSupplier(sup)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  {sup.contactName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Liên hệ:</span>
                      <span className="font-medium text-slate-800">{sup.contactName}</span>
                    </div>
                  )}
                  {sup.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Điện thoại:</span>
                      <span className="font-medium text-slate-800">{sup.phone}</span>
                    </div>
                  )}
                  {sup.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="text-slate-700">{sup.email}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div className="pt-1 text-[11px] text-slate-500 flex items-start gap-1">
                      <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-slate-400" />
                      <span>{sup.address}</span>
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
          itemLabel="nhà cung cấp"
          onPageChange={setPage}
        />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Cập nhật thông tin NCC" : "Tạo mới nhà cung cấp"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="sup-code">Mã nhà cung cấp *</Label>
                <Input
                  id="sup-code"
                  placeholder="VD: NCC-DELL"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={!!editingSupplier}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sup-name">Tên nhà cung cấp *</Label>
                <Input
                  id="sup-name"
                  placeholder="VD: Dell Vietnam Co."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sup-contact">Người liên hệ</Label>
                <Input
                  id="sup-contact"
                  placeholder="VD: Nguyễn Văn A"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sup-phone">Số điện thoại</Label>
                <Input
                  id="sup-phone"
                  placeholder="VD: 0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sup-email">Email</Label>
                <Input
                  id="sup-email"
                  type="email"
                  placeholder="VD: info@supplier.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sup-tax">Mã số thuế</Label>
                <Input
                  id="sup-tax"
                  placeholder="VD: 0102030405"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="sup-address">Địa chỉ</Label>
                <Input
                  id="sup-address"
                  placeholder="VD: 123 Đường A, Quận B, TP. C"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="sup-notes">Ghi chú</Label>
                <Textarea
                  id="sup-notes"
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
        open={!!deletingSupplier}
        onClose={() => setDeletingSupplier(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa nhà cung cấp"
        description={`Bạn có chắc chắn muốn xóa đối tác "${deletingSupplier?.name}"?`}
        isLoading={isDeleting}
      />
    </div>
  )
}
