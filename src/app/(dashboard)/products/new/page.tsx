"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/ui/page-header"
import { toast } from "sonner"

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [unit, setUnit] = useState("cái")
  const [description, setDescription] = useState("")
  const [minQuantity, setMinQuantity] = useState("0")
  const [costPrice, setCostPrice] = useState("")
  const [sellingPrice, setSellingPrice] = useState("")
  const [barcode, setBarcode] = useState("")
  const [serialNumber, setSerialNumber] = useState("")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const json = await res.json()
      // Categories API returns { data: [...] } or list directly
      setCategories(Array.isArray(json) ? json : json.data || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      toast.error("Không thể tải danh mục sản phẩm")
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !sku.trim()) {
      toast.error("Tên sản phẩm và SKU là bắt buộc")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku,
          categoryId: categoryId || (categoryIds.length > 0 ? categoryIds[0] : undefined),
          categoryIds,
          unit,
          description,
          minQuantity: minQuantity || "0",
          costPrice: costPrice || undefined,
          sellingPrice: sellingPrice || undefined,
          barcode,
          serialNumber,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "Có lỗi xảy ra khi tạo sản phẩm")
      }

      toast.success("Tạo sản phẩm thành công")
      router.push("/products")
    } catch (error: any) {
      console.error("Failed to create product:", error)
      toast.error(error.message || "Không thể tạo sản phẩm")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push("/products")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Thêm sản phẩm"
          subtitle="Tạo mới một sản phẩm trong hệ thống kho"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border shadow-sm">
          {/* Tên sản phẩm */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên sản phẩm *</Label>
            <Input
              id="name"
              placeholder="VD: Laptop Dell XPS 13"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">Mã SKU *</Label>
            <Input
              id="sku"
              placeholder="VD: DELL-XPS13-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
          </div>

          {/* Danh mục */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="category">Danh mục ({categoryIds.length} đã chọn)</Label>
              {categoryIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setCategoryIds([]); setCategoryId(""); }}
                  className="text-xs text-slate-500 hover:text-red-600 transition-colors"
                >
                  Xóa tất cả
                </button>
              )}
            </div>
            {isLoadingCategories ? (
              <Input disabled placeholder="Đang tải danh mục..." />
            ) : (
              <>
                <Select
                  value=""
                  onValueChange={(val) => {
                    if (val && !categoryIds.includes(val)) {
                      const next = [...categoryIds, val]
                      setCategoryIds(next)
                      if (!categoryId) setCategoryId(val)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="+ Chọn thêm danh mục..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} disabled={categoryIds.includes(cat.id)}>
                        {cat.name} {categoryIds.includes(cat.id) ? "✓" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categoryIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {categoryIds.map((cId) => {
                      const cat = categories.find((c) => c.id === cId)
                      if (!cat) return null
                      const isPrimary = cId === categoryId || (!categoryId && cId === categoryIds[0])
                      return (
                        <Badge
                          key={cId}
                          variant="secondary"
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 py-0.5 px-2 text-xs"
                        >
                          <span>{cat.name}</span>
                          {isPrimary && (
                            <span className="text-[10px] bg-blue-200 text-blue-800 rounded px-1 font-medium">Chính</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const next = categoryIds.filter((id) => id !== cId)
                              setCategoryIds(next)
                              if (categoryId === cId) setCategoryId(next[0] || "")
                            }}
                            className="ml-0.5 rounded-full hover:bg-blue-200 p-0.5 text-blue-600 hover:text-blue-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Sản phẩm có thể gán cho 1 hoặc nhiều danh mục</p>
                )}
              </>
            )}
          </div>

          {/* Đơn vị tính */}
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

          {/* Giá mua */}
          <div className="space-y-2">
            <Label htmlFor="costPrice">Giá vốn (VND)</Label>
            <Input
              id="costPrice"
              type="number"
              placeholder="VD: 25000000"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
          </div>

          {/* Giá bán */}
          <div className="space-y-2">
            <Label htmlFor="sellingPrice">Giá bán (VND)</Label>
            <Input
              id="sellingPrice"
              type="number"
              placeholder="VD: 28000000"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
            />
          </div>

          {/* Barcode */}
          <div className="space-y-2">
            <Label htmlFor="barcode">Mã vạch (Barcode)</Label>
            <Input
              id="barcode"
              placeholder="VD: 8931234567890"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          </div>

          {/* Serial Number */}
          <div className="space-y-2">
            <Label htmlFor="serialNumber">Số Serial (S/N)</Label>
            <Input
              id="serialNumber"
              placeholder="VD: SN12345678"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
            />
          </div>

          {/* Tồn tối thiểu */}
          <div className="space-y-2">
            <Label htmlFor="minQuantity">Cảnh báo tồn tối thiểu</Label>
            <Input
              id="minQuantity"
              type="number"
              placeholder="VD: 5"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
            />
          </div>

          {/* Mô tả */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Mô tả sản phẩm</Label>
            <Textarea
              id="description"
              placeholder="Mô tả chi tiết cấu hình hoặc thông tin sản phẩm..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => router.push("/products")}
          >
            Hủy
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu sản phẩm
          </Button>
        </div>
      </form>
    </div>
  )
}
