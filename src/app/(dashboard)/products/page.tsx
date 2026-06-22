"use client"

import * as React from "react"
import { Plus, Search, MoreHorizontal, Edit, Trash, Loader2, Printer, ScanBarcode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { TablePagination } from "@/components/ui/table-pagination"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { BarcodeScannerInput } from "@/components/barcode/barcode-scanner-input"
import { formatCurrency } from "@/lib/utils"
import { isAverageCostMethod } from "@/lib/inventory-cost"
import { toast } from "sonner"

type PrintMode = "sku" | "serial"

export default function ProductsPage() {
  const [products, setProducts] = React.useState<any[]>([])
  const [categories, setCategories] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [filterCategoryId, setFilterCategoryId] = React.useState("ALL")
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const limit = 10
  
  // Dialog state
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<any>(null)
  const [deletingProduct, setDeletingProduct] = React.useState<any>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [printingProduct, setPrintingProduct] = React.useState<any>(null)
  const [printMode, setPrintMode] = React.useState<PrintMode>("sku")

  // Form state
  const [name, setName] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [barcode, setBarcode] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [unit, setUnit] = React.useState("cái")
  const [costPrice, setCostPrice] = React.useState("")
  const [sellingPrice, setSellingPrice] = React.useState("")
  const [minQuantity, setMinQuantity] = React.useState("5")
  const [trackingMethod, setTrackingMethod] = React.useState("AverageCost")
  const usesAverageCost = isAverageCostMethod(trackingMethod)
  const [isActive, setIsActive] = React.useState(true)

  const trackingOptions = [
    { value: "None", label: "Không quản lý tồn", hint: "Không tính giá vốn tự động, chỉ dùng giá nhập/bán thủ công." },
    { value: "AverageCost", label: "Bình quân gia quyền", hint: "Giá vốn = tổng giá trị tồn và nhập mới / tổng số lượng." },
    { value: "FIFO", label: "FIFO", hint: "Xuất trước theo lô nhập trước, giá vốn lấy theo thứ tự nhập kho." },
    { value: "SerialNumber", label: "Theo serial", hint: "Mỗi serial là một đơn vị tồn, phù hợp bảo hành và thiết bị." },
    { value: "LotNumber", label: "Theo lot/lô", hint: "Quản lý tồn theo lô, hạn dùng hoặc lô sản xuất." },
  ]

  const getTrackingOption = (value: string) => {
    return trackingOptions.find((option) => option.value === value) || trackingOptions[1]
  }

  React.useEffect(() => {
    if (!usesAverageCost) setCostPrice("")
  }, [usesAverageCost])

  const hasProductTransactions = (product: any) => {
    return (
      Number(product?._count?.stockInItems || 0) > 0 ||
      Number(product?._count?.stockOutItems || 0) > 0 ||
      Number(product?._count?.inventoryTransactions || 0) > 0
    )
  }

  React.useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [search, filterCategoryId, page])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams({
        search,
        page: String(page),
        limit: String(limit),
      })
      if (filterCategoryId !== "ALL") {
        queryParams.set("categoryId", filterCategoryId)
      }
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
    setEditingProduct(null)
    setName("")
    setSku("")
    setBarcode("")
    setCategoryId("")
    setUnit("cái")
    setCostPrice("")
    setSellingPrice("")
    setMinQuantity("5")
    setTrackingMethod("AverageCost")
    setIsActive(true)
    setIsOpen(true)
  }

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product)
    setName(product.name || "")
    setSku(product.sku || "")
    setBarcode(product.barcode || "")
    setCategoryId(product.categoryId || "")
    setUnit(product.unit || "cái")
    setCostPrice(product.costPrice ? String(product.costPrice) : "")
    setSellingPrice(product.sellingPrice ? String(product.sellingPrice) : "")
    setMinQuantity(String(product.minQuantity ?? 5))
    setTrackingMethod(product.trackingMethod || "AverageCost")
    setIsActive(product.isActive !== false)
    setIsOpen(true)
  }

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback
  }

  const getBarcodeBars = (value: string) => {
    const source = value || "SKU"
    let seed = 0
    for (let i = 0; i < source.length; i += 1) seed += source.charCodeAt(i) * (i + 1)
    return Array.from({ length: 64 }, (_, idx) => ((seed + idx * 17 + source.charCodeAt(idx % source.length)) % 5) + 1)
  }

  const getPrintCode = (product: any, mode: PrintMode) => {
    console.log("Generating print code for product:", product, "mode:", mode)
    return mode === "serial" ? String(product?.barcode || "").trim() : String(product?.sku || "").trim()
  }

  const openPrintPreview = (product: any, mode: PrintMode) => {
    const code = getPrintCode(product, mode)
    if (!code) {
      toast.error(mode === "serial" ? "Sản phẩm chưa có số serial để in!" : "Sản phẩm chưa có SKU để in!")
      return
    }

    setPrintingProduct(product)
    setPrintMode(mode)
  }

  const getPdfUrl = () => {
    if (!printingProduct) return
    const code = getPrintCode(printingProduct, printMode)
    if (!code) return

    const params = new URLSearchParams({
      mode: printMode,
      code,
      productName: printingProduct.name || "",
      sku: printingProduct.sku || "",
      widthMm: "60",
      heightMm: "40",
    })

    return `/api/print/label/pdf?${params.toString()}`
  }

  const handleOpenPdf = () => {
    const url = getPdfUrl()
    if (!url) return
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !sku) {
      toast.error("Vui lòng nhập tên và mã SKU")
      return
    }
    if (!trackingMethod) {
      toast.error("Vui lòng chọn phương pháp tính giá tồn")
      return
    }
    if (editingProduct && isActive === false && Number(editingProduct.quantity || 0) > 0) {
      const ok = window.confirm(
        `Sản phẩm "${editingProduct.name}" vẫn còn tồn kho ${editingProduct.quantity} ${editingProduct.unit || ""}. Bạn vẫn muốn chuyển sang không active? Sản phẩm sẽ không hiện trong nhập/xuất kho.`
      )
      if (!ok) return
    }

    setIsSubmitting(true)
    const isEdit = !!editingProduct
    try {
      const payload = {
        name,
        sku,
        barcode,
        categoryId: categoryId || undefined,
        unit,
        costPrice,
        sellingPrice,
        minQuantity,
        trackingMethod,
        isActive
      }

      const res = await fetch(isEdit ? `/api/products/${editingProduct.id}` : "/api/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Lỗi tạo sản phẩm")

      toast.success(isEdit ? "Cập nhật sản phẩm thành công" : "Thêm sản phẩm thành công")
      setIsOpen(false)
      fetchProducts()
    } catch (error: unknown) {
      console.error(error)
      toast.error(getErrorMessage(error, "Không thể lưu sản phẩm"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Không thể xóa sản phẩm")

      toast.success(json.mode === "soft" ? "Đã ẩn sản phẩm vì có dữ liệu liên quan" : "Xóa sản phẩm thành công")
      setDeletingProduct(null)
      fetchProducts()
    } catch (error: unknown) {
      console.error(error)
      toast.error(getErrorMessage(error, "Không thể xóa sản phẩm"))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sản phẩm" 
        subtitle="Quản lý danh sách sản phẩm và tồn kho"
      >
        <div className="flex items-center gap-2">
          <Select
            value={filterCategoryId}
            onValueChange={(value) => {
              setFilterCategoryId(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-10 w-[190px] bg-white">
              <SelectValue placeholder="Lọc danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả danh mục</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                <TableHead>Phương pháp tính</TableHead>
                <TableHead className="text-right">Tồn kho</TableHead>
                <TableHead className="text-right">Giá nhập (₫)</TableHead>
                <TableHead className="text-right">Giá bán (₫)</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[80px]"></TableHead>
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
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500">
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
                    <TableCell>
                      <div className="font-medium text-slate-800">{getTrackingOption(product.trackingMethod).label}</div>
                      <div className="mt-1 max-w-[220px] text-xs leading-4 text-slate-500">
                        {getTrackingOption(product.trackingMethod).hint}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${product.quantity <= product.minQuantity ? 'text-red-600' : 'text-slate-900'}`}>
                        {product.quantity}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">{product.unit}</span>
                    </TableCell>
                     <TableCell className="text-right font-medium text-slate-900">
                      {product.costPrice ? formatCurrency(product.costPrice) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-900">
                      {product.sellingPrice ? formatCurrency(product.sellingPrice) : "-"}
                    </TableCell>
                    <TableCell>
                      {product.isActive === false ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          Không active
                        </span>
                      ) : product.quantity > product.minQuantity ? (
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleOpenEdit(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPrintPreview(product, "serial")}>
                            <ScanBarcode className="mr-2 h-4 w-4" />
                            In theo serial
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPrintPreview(product, "sku")}>
                            <Printer className="mr-2 h-4 w-4" />
                            In theo SKU
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700"
                            onClick={() => setDeletingProduct(product)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            <DialogTitle>{editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
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
            <div className="space-y-2">
              <Label htmlFor="prod-tracking">Phương pháp tính giá tồn *</Label>
              <Select value={trackingMethod} onValueChange={setTrackingMethod}>
                <SelectTrigger id="prod-tracking" className="bg-white" disabled={!!editingProduct && hasProductTransactions(editingProduct)}>
                  <SelectValue placeholder="Chọn phương pháp tính" />
                </SelectTrigger>
                <SelectContent>
                  {trackingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-slate-500">{getTrackingOption(trackingMethod).hint}</p>
              {editingProduct && hasProductTransactions(editingProduct) && (
                <p className="text-xs font-medium text-amber-600">
                  Sản phẩm đã phát sinh giao dịch nên không thể đổi phương pháp tính giá.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-slate-50 p-3">
              <div>
                <Label htmlFor="prod-active">Active sản phẩm</Label>
                <p className="mt-1 text-xs text-slate-500">
                  Tắt active để ẩn sản phẩm khỏi tìm kiếm nhập/xuất kho.
                </p>
              </div>
              <Switch id="prod-active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prod-cost">Giá nhập(đ)</Label>
                <Input
                  id="prod-cost"
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder={"Giá nhập (VND)"}
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
                  placeholder={"Giá xuất (VND)"}
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
                {editingProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!printingProduct} onOpenChange={(open) => !open && setPrintingProduct(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              Preview tem {printMode === "serial" ? "serial" : "SKU"} - 6x4 cm
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-lg border bg-slate-50 p-4">
              <div
                className="grid grid-rows-[8mm_16mm_10mm] items-center overflow-hidden border border-slate-300 bg-white p-[3mm] text-center shadow-sm"
                style={{ width: "6cm", height: "4cm" }}
              >
                <div className="w-full overflow-hidden">
                  <div className="text-[8px] font-bold uppercase text-slate-600">
                    {printMode === "serial" ? "Serial" : "SKU"}
                  </div>
                  <div className="truncate text-[9px] font-bold leading-tight text-slate-900">
                    {printingProduct?.name}
                  </div>
                </div>
                <div className="flex h-[16mm] w-full items-center justify-center overflow-hidden">
                  {getBarcodeBars(getPrintCode(printingProduct, printMode)).map((width, idx) => (
                    <span
                      key={`${idx}-${width}`}
                      className={idx % 2 === 0 ? "bg-slate-900" : "bg-transparent"}
                      style={{ display: "inline-block", width: `${width}px`, height: "13mm" }}
                    />
                  ))}
                </div>
                <div className="w-full overflow-hidden">
                  <div className="break-words font-mono text-[10px] font-bold leading-tight text-slate-900">
                    {getPrintCode(printingProduct, printMode)}
                  </div>
                  <div className="truncate text-[7px] text-slate-600">
                    SKU: {printingProduct?.sku || ""}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-slate-500">
              Label PDF size 6x4 cm. Bấm Xem PDF để mở file PDF.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPrintingProduct(null)}>
              Hủy
            </Button>
            <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenPdf}>
              <Printer className="mr-2 h-4 w-4" />
              Xem PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa sản phẩm"
        description={`Bạn có chắc chắn muốn xóa sản phẩm "${deletingProduct?.name}"? Nếu sản phẩm đã phát sinh nhập/xuất, hệ thống sẽ ẩn sản phẩm để giữ lịch sử dữ liệu.`}
        isLoading={isDeleting}
      />
    </div>
  )
}
