"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2, Edit, Save, Trash, Clock, ShieldCheck, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/ui/page-header"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = React.useState<any>(null)
  const [categories, setCategories] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Edit form states
  const [name, setName] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [unit, setUnit] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [minQuantity, setMinQuantity] = React.useState("0")
  const [costPrice, setCostPrice] = React.useState("")
  const [sellingPrice, setSellingPrice] = React.useState("")
  const [barcode, setBarcode] = React.useState("")
  const [serialNumber, setSerialNumber] = React.useState("")

  React.useEffect(() => {
    fetchProductDetails()
    fetchCategories()
  }, [productId])

  const fetchProductDetails = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/products/${productId}`)
      if (!res.ok) throw new Error("Không thể tải thông tin sản phẩm")
      const json = await res.json()
      setProduct(json)

      // Initialize form states
      setName(json.name || "")
      setSku(json.sku || "")
      setCategoryId(json.categoryId || "")
      setUnit(json.unit || "cái")
      setDescription(json.description || "")
      setMinQuantity(String(json.minQuantity || 0))
      setCostPrice(json.costPrice ? String(json.costPrice) : "")
      setSellingPrice(json.sellingPrice ? String(json.sellingPrice) : "")
      setBarcode(json.barcode || "")
      setSerialNumber(json.serialNumber || "")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Lỗi khi tải thông tin sản phẩm")
      router.push("/products")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const json = await res.json()
      setCategories(Array.isArray(json) ? json : json.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !sku.trim()) {
      toast.error("Tên sản phẩm và SKU là bắt buộc")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku,
          categoryId: categoryId || null,
          unit,
          description,
          minQuantity: minQuantity || "0",
          costPrice: costPrice || null,
          sellingPrice: sellingPrice || null,
          barcode,
          serialNumber,
          isActive: true,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Lỗi cập nhật sản phẩm")

      toast.success("Cập nhật sản phẩm thành công")
      setIsEditing(false)
      fetchProductDetails()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Không thể cập nhật sản phẩm")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Lỗi khi xóa sản phẩm")
      }

      toast.success("Xóa sản phẩm thành công")
      router.push("/products")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Không thể xóa sản phẩm")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push("/products")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={product.name} subtitle={`SKU: ${product.sku}`} />
        <div className="ml-auto flex gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="mr-2 h-4 w-4 text-blue-600" />
                Chỉnh sửa
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Xóa
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Hủy
              </Button>
              <Button onClick={handleUpdate} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Lưu
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Overview stats card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 text-lg border-b pb-2">Tóm tắt sản phẩm</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Tồn kho hiện tại:</span>
                <span className={`font-bold text-base ${product.quantity <= product.minQuantity ? 'text-red-600' : 'text-green-600'}`}>
                  {product.quantity} {product.unit}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Mức tối thiểu:</span>
                <span className="font-medium text-slate-800">{product.minQuantity} {product.unit}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Giá vốn:</span>
                <span className="font-semibold text-slate-800">
                  {product.costPrice ? formatCurrency(product.costPrice) : "Chưa có"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Giá bán:</span>
                <span className="font-semibold text-slate-800">
                  {product.sellingPrice ? formatCurrency(product.sellingPrice) : "Chưa có"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Mã vạch (Barcode):</span>
                <span className="font-mono text-slate-700">{product.barcode || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Số Serial:</span>
                <span className="font-mono text-slate-700">{product.serialNumber || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Tabs details / Edit forms */}
        <div className="lg:col-span-2">
          {!isEditing ? (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="bg-slate-100 p-1 w-full flex border rounded-lg justify-start">
                <TabsTrigger value="details">Thông tin chi tiết</TabsTrigger>
                <TabsTrigger value="history">Lịch sử giao dịch</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="bg-white p-6 rounded-xl border shadow-sm mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Tên sản phẩm</h4>
                  <p className="text-slate-800 font-semibold text-lg mt-1">{product.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Mã SKU</h4>
                    <p className="text-slate-800 font-medium mt-1">{product.sku}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Danh mục</h4>
                    <p className="text-slate-800 font-medium mt-1">{product.category?.name || "Khác"}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Mô tả</h4>
                  <p className="text-slate-700 mt-1 whitespace-pre-line bg-slate-50 p-3 rounded-md border text-sm">
                    {product.description || "Không có mô tả sản phẩm."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Ngày tạo</h4>
                    <p className="text-slate-600 text-sm mt-1">{formatDate(product.createdAt)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Cập nhật lúc</h4>
                    <p className="text-slate-600 text-sm mt-1">{formatDate(product.updatedAt)}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="bg-white p-6 rounded-xl border shadow-sm mt-4">
                <h3 className="font-semibold text-slate-800 mb-4">10 Giao dịch kho gần nhất</h3>
                {product.inventoryTransactions && product.inventoryTransactions.length > 0 ? (
                  <div className="relative border-l border-slate-200 pl-4 space-y-4">
                    {product.inventoryTransactions.map((tx: any) => (
                      <div key={tx.id} className="relative">
                        <span className={`absolute -left-[22px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-white
                          ${tx.type === "STOCK_IN" ? "bg-green-500" : "bg-red-500"}`}
                        />
                        <div className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-semibold text-slate-800">
                              {tx.type === "STOCK_IN" ? "Nhập kho" : "Xuất kho"}
                            </span>{" "}
                            <span className={tx.type === "STOCK_IN" ? "text-green-600" : "text-red-600"}>
                              {tx.type === "STOCK_IN" ? "+" : "-"}
                              {tx.quantity} {product.unit}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">{formatDate(tx.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Mã SN: {tx.serialNumber || "Không có"}</p>
                        {tx.notes && <p className="text-xs text-slate-600 italic bg-slate-50 p-1.5 rounded mt-1">{tx.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm text-center py-6">Chưa có giao dịch kho nào.</p>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handleUpdate} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h3 className="font-semibold text-slate-800 text-lg border-b pb-2">Chỉnh sửa thông tin</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên sản phẩm *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Đơn vị tính</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Đơn vị tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cái">Cái</SelectItem>
                      <SelectItem value="bộ">Bộ</SelectItem>
                      <SelectItem value="chiếc">Chiếc</SelectItem>
                      <SelectItem value="hộp">Hộp</SelectItem>
                      <SelectItem value="thùng">Thùng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Giá vốn (VND)</Label>
                  <Input id="costPrice" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Giá bán (VND)</Label>
                  <Input id="sellingPrice" type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Số Serial</Label>
                  <Input id="serialNumber" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minQuantity">Tồn tối thiểu</Label>
                  <Input id="minQuantity" type="number" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Xác nhận xóa sản phẩm"
        description={`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"? Hành động này sẽ chuyển trạng thái của sản phẩm sang không hoạt động.`}
        isLoading={isDeleting}
      />
    </div>
  )
}
