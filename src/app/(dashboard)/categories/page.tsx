"use client"

import * as React from "react"
import { Plus, Edit, Trash, Loader2 } from "lucide-react"
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

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const limit = 10
  
  // Dialog state
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<any>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form state
  const [name, setName] = React.useState("")
  const [code, setCode] = React.useState("")
  const [description, setDescription] = React.useState("")

  // Delete state
  const [deletingCategory, setDeletingCategory] = React.useState<any>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    fetchCategories()
  }, [page])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/categories?page=${page}&limit=${limit}`)
      const json = await res.json()
      setCategories(Array.isArray(json) ? json : json.data || [])
      setTotal(json.pagination?.total || 0)
    } catch (error) {
      console.error(error)
      toast.error("Không thể tải danh sách danh mục")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingCategory(null)
    setName("")
    setCode("")
    setDescription("")
    setIsOpen(true)
  }

  const handleOpenEdit = (category: any) => {
    setEditingCategory(category)
    setName(category.name || "")
    setCode(category.code || "")
    setDescription(category.description || "")
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) {
      toast.error("Tên danh mục và Mã danh mục là bắt buộc")
      return
    }

    setIsSubmitting(true)
    const isEdit = !!editingCategory
    const url = isEdit ? `/api/categories/${editingCategory.id}` : "/api/categories"
    const method = isEdit ? "PUT" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, description }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Có lỗi xảy ra")

      toast.success(isEdit ? "Cập nhật danh mục thành công" : "Tạo danh mục thành công")
      setIsOpen(false)
      fetchCategories()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Không thể thực hiện tác vụ")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: "DELETE",
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Có lỗi xảy ra khi xóa danh mục")
      }

      toast.success(json.mode === "soft" ? "Đã ẩn danh mục vì có sản phẩm liên quan" : "Xóa danh mục thành công")
      setDeletingCategory(null)
      fetchCategories()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Không thể xóa danh mục")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh mục sản phẩm"
        subtitle="Quản lý các loại danh mục sản phẩm công nghệ"
      >
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm danh mục
        </Button>
      </PageHeader>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-[80px]">STT</TableHead>
              <TableHead>Mã danh mục</TableHead>
              <TableHead>Tên danh mục</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="text-right">Số sản phẩm</TableHead>
              <TableHead className="w-[120px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                  <span className="mt-2 block text-xs">Đang tải dữ liệu...</span>
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  Chưa có danh mục nào được tạo.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat, idx) => (
                <TableRow key={cat.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium">{(page - 1) * limit + idx + 1}</TableCell>
                  <TableCell className="font-mono font-medium text-slate-900">{cat.code}</TableCell>
                  <TableCell className="font-semibold text-slate-800">{cat.name}</TableCell>
                  <TableCell className="text-slate-500 max-w-xs truncate">{cat.description || "-"}</TableCell>
                  <TableCell className="text-right font-medium text-blue-600">{cat._count?.products ?? 0}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-600 hover:text-blue-700"
                      onClick={() => handleOpenEdit(cat)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => setDeletingCategory(cat)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          limit={limit}
          total={total}
          itemLabel="danh mục"
          onPageChange={setPage}
        />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Cập nhật danh mục" : "Tạo mới danh mục"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dlg-code">Mã danh mục *</Label>
              <Input
                id="dlg-code"
                placeholder="VD: LAPTOP, PHONE"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={!!editingCategory}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dlg-name">Tên danh mục *</Label>
              <Input
                id="dlg-name"
                placeholder="VD: Máy tính xách tay"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dlg-description">Mô tả</Label>
              <Textarea
                id="dlg-description"
                placeholder="Mô tả ngắn về danh mục sản phẩm này"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
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
        open={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa danh mục"
        description={`Bạn có chắc chắn muốn xóa danh mục "${deletingCategory?.name}"? Tác vụ này sẽ không xóa các sản phẩm bên trong mà chỉ gỡ liên kết danh mục.`}
        isLoading={isDeleting}
      />
    </div>
  )
}
