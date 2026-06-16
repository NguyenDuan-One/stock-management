"use client"

import * as React from "react"
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash, Barcode, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { TablePagination } from "@/components/ui/table-pagination"
import { BarcodeScannerInput } from "@/components/barcode/barcode-scanner-input"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

export default function ProductsPage() {
  const [products, setProducts] = React.useState<any[]>([])
  const [categories, setCategories] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const limit = 10
  
  // Dialog state
  const [isOpen, setIsOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form state
  const [name, setName] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [barcode, setBarcode] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [unit, setUnit] = React.useState("cái")
  const [costPrice, setCostPrice] = React.useState("")
  const [sellingPrice, setSellingPrice] = React.useState("")
  const [minQuantity, setMinQuantity] = React.useState("5")

  React.useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [search, page])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams({
        search,
        page: String(page),
        limit: String(limit),
      })
      const res = await fetch(`/api/products?${queryParams}`)
      const json = await res.json()
      setProducts(json.data || [])
      setTotal(json.pagination?.total || 0)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast.error("Không thể tải danh sách sản phẩm")
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
      console.error("Failed to fetch categories:", error)
    }
  }

  const handleOpenAdd = () => {
    setName("")
    setSku("")
    setBarcode("")
    setCategoryId("")
    setUnit("cái")
    setCostPrice("")
    setSellingPrice("")
    setMinQuantity("5")
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !sku) {
      toast.error("Vui lòng nhập tên và mã SKU")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name,
        sku,
        barcode,
        categoryId: categoryId || undefined,
        unit,
        costPrice,
        sellingPrice,
        minQuantity
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Lỗi tạo sản phẩm")

      toast.success("Thêm sản phẩm thành công")
      setIsOpen(false)
      fetchProducts()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sản phẩm" 
        subtitle="Quản lý danh sách sản phẩm và tồn kho"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Lọc
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm sản phẩm
          </Button>
        </div>
      </PageHeader>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Tìm kiếm theo Tên, SKU, Barcode..." 
              className="pl-9 h-10 w-full bg-white"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="w-full sm:w-auto shrink-0 relative">
             <BarcodeScannerInput 
               onScan={(val) => {
                 setSearch(val)
                 setPage(1)
               }} 
               placeholder="Quét mã vạch tìm kiếm..." 
             />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead className="text-right">Tồn kho</TableHead>
                <TableHead className="text-right">Giá bán (₫)</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[80px]"></TableHead>
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
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    Không tìm thấy sản phẩm nào.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{product.name}</div>
                      <div className="text-xs text-slate-500 mt-1">SKU: {product.sku} {product.barcode && `| Mã vạch: ${product.barcode}`}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-700 border-none">
                        {product.category?.name || "Khác"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${product.quantity <= product.minQuantity ? 'text-red-600' : 'text-slate-900'}`}>
                        {product.quantity}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">{product.unit}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-900">
                      {product.sellingPrice ? formatCurrency(product.sellingPrice) : "-"}
                    </TableCell>
                    <TableCell>
                      {product.quantity > product.minQuantity ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                          Còn hàng
                        </span>
                      ) : product.quantity > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Sắp hết
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          Hết hàng
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          page={page}
          limit={limit}
          total={total}
          itemLabel="sản phẩm"
          onPageChange={setPage}
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm sản phẩm mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="prod-name">Tên sản phẩm *</Label>
              <Input
                id="prod-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên sản phẩm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prod-sku">Mã SKU *</Label>
                <Input
                  id="prod-sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="VD: SP001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-barcode">Mã vạch (Barcode)</Label>
                <Input
                  id="prod-barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Quét hoặc nhập mã"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-unit">Đơn vị tính</Label>
                <Input
                  id="prod-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="VD: cái, chiếc, hộp"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prod-cost">Giá nhập (₫)</Label>
                <Input
                  id="prod-cost"
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-sell">Giá bán (₫)</Label>
                <Input
                  id="prod-sell"
                  type="number"
                  min="0"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-min">Tồn kho tối thiểu (Cảnh báo hết hàng)</Label>
              <Input
                id="prod-min"
                type="number"
                min="0"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Thêm sản phẩm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
