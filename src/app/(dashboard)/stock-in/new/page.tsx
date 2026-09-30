"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { TablePagination } from "@/components/ui/table-pagination"
import { BarcodeScannerInput, type BarcodeSuggestion } from "@/components/barcode/barcode-scanner-input"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { isAverageCostMethod } from "@/lib/inventory-cost"

interface StockInItem {
  id: string // temporary client-side ID
  productId: string
  name: string
  sku: string
  serialNumber: string
  quantity: number
  unitPrice: number
  warrantyMonths: number
}

interface SupplierOption {
  id: string
  name: string
  code?: string | null
}

interface CategoryOption {
  id: string
  name: string
}

interface ProductOption extends BarcodeSuggestion {
  costPrice?: number | string | null
  warrantyMonths?: number | null
}

export default function NewStockInPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = React.useState<SupplierOption[]>([])
  const [categories, setCategories] = React.useState<CategoryOption[]>([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isQuickSupplierOpen, setIsQuickSupplierOpen] = React.useState(false)
  const [isQuickProductOpen, setIsQuickProductOpen] = React.useState(false)
  const [isQuickSupplierSaving, setIsQuickSupplierSaving] = React.useState(false)
  const [isQuickProductSaving, setIsQuickProductSaving] = React.useState(false)

  // Header form states
  const [supplierId, setSupplierId] = React.useState("")
  const [importDate, setImportDate] = React.useState(new Date().toISOString().split("T")[0])
  const [poNumber, setPoNumber] = React.useState("")
  const [contractNumber, setContractNumber] = React.useState("")
  const [notes, setNotes] = React.useState("")

  // Product Scanner / Selection states
  const [scannedProduct, setScannedProduct] = React.useState<ProductOption | null>(null)
  const [searchLoading, setSearchLoading] = React.useState(false)
  const [productQuery, setProductQuery] = React.useState("")
  const [productSuggestions, setProductSuggestions] = React.useState<ProductOption[]>([])

  // Quick supplier form states
  const [quickSupplierName, setQuickSupplierName] = React.useState("")
  const [quickSupplierCode, setQuickSupplierCode] = React.useState("")
  const [quickSupplierPhone, setQuickSupplierPhone] = React.useState("")
  const [quickSupplierEmail, setQuickSupplierEmail] = React.useState("")

  // Quick product form states
  const [quickProductName, setQuickProductName] = React.useState("")
  const [quickProductSku, setQuickProductSku] = React.useState("")
  const [quickProductBarcode, setQuickProductBarcode] = React.useState("")
  const [quickProductCategoryId, setQuickProductCategoryId] = React.useState("")
  const [quickProductUnit, setQuickProductUnit] = React.useState("cái")
  const [quickProductCostPrice, setQuickProductCostPrice] = React.useState("")
  const [quickProductSellingPrice, setQuickProductSellingPrice] = React.useState("")
  const [quickProductMinQuantity, setQuickProductMinQuantity] = React.useState("0")
  const [quickProductTrackingMethod, setQuickProductTrackingMethod] = React.useState("AverageCost")
  const quickProductUsesAverageCost = isAverageCostMethod(quickProductTrackingMethod)

   const trackingOptions = [
    { value: "None", label: "Không quản lý tồn", hint: "Không tính giá vốn tự động, chỉ dùng giá nhập/bán thủ công." },
    { value: "AverageCost", label: "Bình quân gia quyền", hint: "Giá vốn = tổng giá trị tồn và nhập mới / tổng số lượng." },
    { value: "FIFO", label: "FIFO", hint: "Xuất trước theo lô nhập trước, giá vốn lấy theo thứ tự nhập kho." },
    { value: "SerialNumber", label: "Theo serial", hint: "Mỗi serial là một đơn vị tồn, phù hợp bảo hành và thiết bị." },
    { value: "LotNumber", label: "Theo lot/lô", hint: "Quản lý tồn theo lô, hạn dùng hoặc lô sản xuất." },
  ]

  const getTrackingOption = (value: string) => trackingOptions.find((option) => option.value === value) || trackingOptions[1]

  React.useEffect(() => {
    if (!quickProductUsesAverageCost) setQuickProductCostPrice("")
  }, [quickProductUsesAverageCost])
  
  // Adding item states
  const [addSerialNumber, setAddSerialNumber] = React.useState("")
  const [addQuantity, setAddQuantity] = React.useState(1)
  const [addUnitPrice, setAddUnitPrice] = React.useState(0)
  const [addWarranty, setAddWarranty] = React.useState(12)
  const [serialLines, setSerialLines] = React.useState<string[]>([])

  // Table items list
  const [items, setItems] = React.useState<StockInItem[]>([])
  const [itemPage, setItemPage] = React.useState(1)
  const itemLimit = 5

  // Input refs for keyboard navigation
  const qtyInputRef = React.useRef<HTMLInputElement>(null)
  const priceInputRef = React.useRef<HTMLInputElement>(null)
  const snInputRef = React.useRef<HTMLInputElement>(null)
  const warrantyInputRef = React.useRef<HTMLInputElement>(null)

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers")
      const json = await res.json()
      setSuppliers(Array.isArray(json) ? json : json.data || [])
    } catch (error) {
      console.error(error)
      toast.error("Không thể tải danh sách nhà cung cấp")
    } finally {
      setIsLoadingSuppliers(false)
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

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchSuppliers()
      fetchCategories()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  React.useEffect(() => {
    const query = productQuery.trim()
    if (query.length < 2) {
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&suggest=1`)
        const json = await res.json()
        setProductSuggestions(json.data || [])
      } catch (error) {
        console.error(error)
        setProductSuggestions([])
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [productQuery])

  const buildSupplierCode = (name?: string) => {
    const normalized = (name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase()
      .slice(0, 16)

    return `SUP-${normalized || Date.now().toString().slice(-6)}`
  }

  const openQuickSupplier = () => {
    setQuickSupplierName("")
    setQuickSupplierCode("")
    setQuickSupplierPhone("")
    setQuickSupplierEmail("")
    setIsQuickSupplierOpen(true)
  }

  const openQuickProduct = (rawValue = "") => {
    const value = rawValue.trim()
    const looksLikeBarcode = /^\d{8,}$/.test(value)

    setQuickProductName("")
    setQuickProductSku(looksLikeBarcode ? "" : value)
    setQuickProductBarcode(looksLikeBarcode ? value : "")
    setQuickProductCategoryId("")
    setQuickProductUnit("cái")
    setQuickProductCostPrice("")
    setQuickProductSellingPrice("")
    setQuickProductMinQuantity("0")
    setQuickProductTrackingMethod("AverageCost")
    setIsQuickProductOpen(true)
  }

  const handleProductQueryChange = (value: string) => {
    setProductQuery(value)
    if (value.trim().length < 2) {
      setProductSuggestions([])
    }
  }

  const selectProductForStockIn = (product: ProductOption) => {
    setScannedProduct(product)
    setAddUnitPrice(Number(product.costPrice) || 0)
    setAddWarranty(Number(product.warrantyMonths) || 12)
    setAddQuantity(1)
    setAddSerialNumber("")
    setSerialLines([])
    setProductSuggestions([])
    setProductQuery("")
    setTimeout(() => snInputRef.current?.focus(), 100)
  }

  // Handle barcode scanner input
  const handleBarcodeScan = async (value: string) => {
    if (!value) return
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(value)}`)
      if (!res.ok) {
        toast.error("Không tìm thấy sản phẩm với mã này")
        setScannedProduct(null)
        return
      }
      const product = await res.json()
      if (!product) {
        toast.error("Không tìm thấy sản phẩm")
        setScannedProduct(null)
        return
      }

      selectProductForStockIn(product)
    } catch (error) {
      console.error(error)
      toast.error("Lỗi khi tìm kiếm sản phẩm")
    } finally {
      setSearchLoading(false)
    }
  }

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback
  }

  const handleQuickSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickSupplierName.trim() || !quickSupplierCode.trim()) {
      toast.error("Vui lòng nhập tên và mã nhà cung cấp")
      return
    }

    setIsQuickSupplierSaving(true)
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickSupplierName.trim(),
          code: quickSupplierCode.trim(),
          phone: quickSupplierPhone.trim(),
          email: quickSupplierEmail.trim(),
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Không thể tạo nhà cung cấp")

      setSuppliers((prev) => [json, ...prev])
      setSupplierId(json.id)
      setIsQuickSupplierOpen(false)
      toast.success("Đã thêm nhanh nhà cung cấp")
    } catch (error: unknown) {
      console.error(error)
      toast.error(getErrorMessage(error, "Không thể tạo nhà cung cấp"))
    } finally {
      setIsQuickSupplierSaving(false)
    }
  }

  const handleQuickProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickProductName.trim() || !quickProductSku.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm và SKU")
      return
    }

    setIsQuickProductSaving(true)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickProductName.trim(),
          sku: quickProductSku.trim(),
          barcode: quickProductBarcode.trim(),
          categoryId: quickProductCategoryId || undefined,
          unit: quickProductUnit.trim() || "cái",
          costPrice: quickProductUsesAverageCost ? quickProductCostPrice : "",
          sellingPrice: quickProductSellingPrice,
          minQuantity: quickProductMinQuantity,
          trackingMethod: quickProductTrackingMethod,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Không thể tạo sản phẩm")

      setIsQuickProductOpen(false)
      selectProductForStockIn(json)
      toast.success("Đã thêm nhanh sản phẩm")
    } catch (error: unknown) {
      console.error(error)
      toast.error(getErrorMessage(error, "Không thể tạo sản phẩm"))
    } finally {
      setIsQuickProductSaving(false)
    }
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scannedProduct) return
    const normalizedSerials = serialLines.map((serial) => serial.trim()).filter(Boolean)

    if (normalizedSerials.length > 0) {
      const newItems: StockInItem[] = normalizedSerials.map((serialNumber) => ({
        id: Math.random().toString(36).substring(7),
        productId: scannedProduct.id,
        name: scannedProduct.name,
        sku: scannedProduct.sku,
        serialNumber,
        quantity: 1,
        unitPrice: addUnitPrice,
        warrantyMonths: addWarranty,
      }))

      setItems((prev) => [...prev, ...newItems])
      toast.success(`Đã thêm ${newItems.length} serial`)
      setScannedProduct(null)
      setAddSerialNumber("")
      setSerialLines([])
      setAddQuantity(1)
      setAddUnitPrice(0)
      return
    }
    if (addQuantity <= 0) {
      toast.error("Số lượng phải lớn hơn 0")
      return
    }

    const newItem: StockInItem = {
      id: Math.random().toString(36).substring(7),
      productId: scannedProduct.id,
      name: scannedProduct.name,
      sku: scannedProduct.sku,
      serialNumber: addSerialNumber,
      quantity: addQuantity,
      unitPrice: addUnitPrice,
      warrantyMonths: addWarranty,
    }

    setItems((prev) => [...prev, newItem])
    toast.success(`Đã thêm ${scannedProduct.name}`)
    
    // Reset scanner state
    setScannedProduct(null)
    setAddSerialNumber("")
    setSerialLines([])
    setAddQuantity(1)
    setAddUnitPrice(0)
  }

  const handleAddSerialLine = () => {
    const serial = addSerialNumber.trim()
    if (!serial) {
      toast.error("Vui lòng nhập số serial")
      return
    }
    if (serialLines.some((item) => item.toLowerCase() === serial.toLowerCase())) {
      toast.error("Serial này đã có trong danh sách")
      return
    }
    if (items.some((item) => item.serialNumber?.toLowerCase() === serial.toLowerCase())) {
      toast.error("Serial này đã có trong phiếu")
      return
    }

    setSerialLines((prev) => [...prev, serial])
    setAddSerialNumber("")
    setAddQuantity(serialLines.length + 1)
    setTimeout(() => snInputRef.current?.focus(), 50)
  }

  const handleRemoveSerialLine = (serial: string) => {
    setSerialLines((prev) => prev.filter((item) => item !== serial))
    setAddQuantity((prev) => Math.max(1, prev - 1))
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const paginatedItems = items.slice((itemPage - 1) * itemLimit, itemPage * itemLimit)

  React.useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(items.length / itemLimit))
    if (itemPage <= maxPage) return

    const timer = window.setTimeout(() => setItemPage(maxPage), 0)
    return () => window.clearTimeout(timer)
  }, [items.length, itemPage])

  const handleSubmit = async (status: "COMPLETED" | "DRAFT") => {
    if (!supplierId) {
      toast.error("Vui lòng chọn nhà cung cấp")
      return
    }
    if (items.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        supplierId,
        importDate: new Date(importDate).toISOString(),
        poNumber,
        contractNumber,
        notes,
        status,
        items: items.map((item) => ({
          productId: item.productId,
          serialNumber: item.serialNumber || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          warrantyMonths: item.warrantyMonths,
        })),
      }

      const res = await fetch("/api/stock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Lỗi tạo phiếu nhập")

      toast.success(status === "COMPLETED" ? "Đã nhập kho thành công" : "Lưu bản nháp thành công")
      router.push("/stock-in")
    } catch (error: unknown) {
      console.error(error)
      toast.error(getErrorMessage(error, "Không thể lưu phiếu nhập kho"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push("/stock-in")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Tạo phiếu nhập kho" subtitle="Quét mã vạch và ghi nhận nhập kho" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Header Form (40%) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-sm border">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-base text-slate-800">Thông tin phiếu nhập</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                <Label>Nhà cung cấp *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={openQuickSupplier}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm nhanh
                  </Button>
                </div>
                {isLoadingSuppliers ? (
                  <Input disabled placeholder="Đang tải danh sách nhà cung cấp..." />
                ) : (
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Chọn nhà cung cấp" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((sup) => (
                        <SelectItem key={sup.id} value={sup.id}>
                          {sup.name} ({sup.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="import-date">Ngày nhập kho *</Label>
                <Input
                  id="import-date"
                  type="date"
                  value={importDate}
                  onChange={(e) => setImportDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="po-number">Số đơn hàng (PO)</Label>
                  <Input
                    id="po-number"
                    placeholder="VD: PO-2026-001"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract-number">Số hợp đồng</Label>
                  <Input
                    id="contract-number"
                    placeholder="VD: HĐ-DELL-2026"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  placeholder="Ghi chú thêm thông tin..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Scanner and Item list (60%) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-sm border">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-base text-slate-800">Thêm sản phẩm nhập kho</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Barcode scanner */}
              <div className="space-y-2">
                <Label>Quét mã vạch hoặc nhập mã SKU sản phẩm</Label>
                <BarcodeScannerInput
                  onScan={handleBarcodeScan}
                  isLoading={searchLoading}
                  suggestions={productSuggestions}
                  onQueryChange={handleProductQueryChange}
                  onSuggestionSelect={selectProductForStockIn}
                  onAddNew={openQuickProduct}
                  addNewLabel="Thêm SKU mới"
                  emptyText="Không có sản phẩm khớp"
                />
              </div>

              {/* Scanned product info card & options to add */}
              {scannedProduct && (
                <form
                  onSubmit={handleAddItem}
                  className="bg-blue-50/50 p-4 border border-blue-200 rounded-lg space-y-4 animate-in fade-in duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-blue-900 text-base">{scannedProduct.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Mã SKU: {scannedProduct.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Tồn hiện tại:</span>
                      <span className="font-semibold text-slate-700 block text-sm">
                        {scannedProduct.quantity} {scannedProduct.unit || "cái"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="item-sn" className="text-xs">
                        Số Serial (S/N)
                      </Label>
                      <Input
                        id="item-sn"
                        ref={snInputRef}
                        placeholder="Không bắt buộc"
                        value={addSerialNumber}
                        onChange={(e) => setAddSerialNumber(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddSerialLine()
                          }
                        }}
                        className="bg-white h-9 text-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 w-full gap-1.5 text-xs"
                        onClick={handleAddSerialLine}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Thêm serial
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="item-qty" className="text-xs">
                        Số lượng *
                      </Label>
                      <Input
                        id="item-qty"
                        type="number"
                        min="1"
                        ref={qtyInputRef}
                        value={serialLines.length > 0 ? serialLines.length : addQuantity}
                        onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                        disabled={serialLines.length > 0}
                        className="bg-white h-9 text-xs font-semibold"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="item-price" className="text-xs">
                        Đơn giá nhập (VND)
                      </Label>
                      <Input
                        id="item-price"
                        type="number"
                        min="0"
                        ref={priceInputRef}
                        value={addUnitPrice}
                        onChange={(e) => setAddUnitPrice(parseFloat(e.target.value) || 0)}
                        className="bg-white h-9 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="item-warranty" className="text-xs">
                        Bảo hành (tháng)
                      </Label>
                      <Input
                        id="item-warranty"
                        type="number"
                        min="0"
                        ref={warrantyInputRef}
                        value={addWarranty}
                        onChange={(e) => setAddWarranty(parseInt(e.target.value) || 0)}
                        className="bg-white h-9 text-xs"
                        required
                      />
                    </div>
                  </div>

                  {serialLines.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-700">
                          Serial đã nhập ({serialLines.length})
                        </span>
                        <span className="text-xs text-slate-500">Mỗi serial = SL 1</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {serialLines.map((serial) => (
                          <span
                            key={serial}
                            className="inline-flex min-h-8 items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-mono text-blue-800"
                          >
                            {serial}
                            <button
                              type="button"
                              className="rounded text-blue-500 hover:text-red-600 focus:outline-none"
                              onClick={() => handleRemoveSerialLine(serial)}
                              aria-label={`Xóa serial ${serial}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setScannedProduct(null)
                        setAddSerialNumber("")
                        setSerialLines([])
                        setAddQuantity(1)
                      }}
                      className="text-slate-500 hover:text-slate-700 h-9 px-3 text-xs"
                    >
                      Hủy
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-9 px-4 text-xs text-white">
                      <Plus className="mr-1.5 h-4 w-4" /> Thêm vào danh sách
                    </Button>
                  </div>
                </form>
              )}

              {/* Items List Table */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800 text-sm">Danh sách sản phẩm nhập</h4>
                <div className="rounded-md border overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-xs py-2">Sản phẩm</TableHead>
                        <TableHead className="text-xs py-2">S/N</TableHead>
                        <TableHead className="text-right text-xs py-2">SL</TableHead>
                        <TableHead className="text-right text-xs py-2">Đơn giá</TableHead>
                        <TableHead className="text-right text-xs py-2">Thành tiền</TableHead>
                        <TableHead className="text-xs py-2">BH</TableHead>
                        <TableHead className="w-[50px] py-2"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-slate-400 text-xs">
                            Chưa có sản phẩm nào. Vui lòng quét mã vạch hoặc nhập SKU để thêm.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedItems.map((item) => (
                          <TableRow key={item.id} className="text-xs">
                            <TableCell className="py-2">
                              <span className="font-medium text-slate-800 block">{item.name}</span>
                              <span className="text-[10px] text-slate-400">SKU: {item.sku}</span>
                            </TableCell>
                            <TableCell className="font-mono py-2">{item.serialNumber || "-"}</TableCell>
                            <TableCell className="text-right py-2 font-medium">{item.quantity}</TableCell>
                            <TableCell className="text-right py-2">
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right py-2 font-bold text-slate-700">
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </TableCell>
                            <TableCell className="py-2">{item.warrantyMonths} T</TableCell>
                            <TableCell className="py-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-600 hover:text-red-700"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  page={itemPage}
                  limit={itemLimit}
                  total={items.length}
                  itemLabel="sản phẩm"
                  onPageChange={setItemPage}
                />

                <div className="flex justify-between items-center bg-slate-100/50 p-4 rounded-lg border">
                  <span className="font-semibold text-slate-700">Tổng giá trị đơn nhập:</span>
                  <span className="font-bold text-xl text-blue-700">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" disabled={isSubmitting} onClick={() => router.push("/stock-in")}>
          Hủy
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSubmit("DRAFT")}
          disabled={isSubmitting}
          className="bg-slate-200 text-slate-800 hover:bg-slate-300"
        >
          Lưu bản nháp
        </Button>
        <Button
          onClick={() => handleSubmit("COMPLETED")}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Hoàn thành nhập kho
        </Button>
      </div>

      <Dialog open={isQuickSupplierOpen} onOpenChange={setIsQuickSupplierOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Thêm nhanh nhà cung cấp</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickSupplierSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="quick-supplier-name">Tên nhà cung cấp *</Label>
              <Input
                id="quick-supplier-name"
                value={quickSupplierName}
                onChange={(e) => {
                  setQuickSupplierName(e.target.value)
                  setQuickSupplierCode((current) => current || buildSupplierCode(e.target.value))
                }}
                placeholder="VD: Công ty TNHH ABC"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-supplier-code">Mã nhà cung cấp *</Label>
              <Input
                id="quick-supplier-code"
                value={quickSupplierCode}
                onChange={(e) => setQuickSupplierCode(e.target.value.toUpperCase())}
                placeholder="VD: SUP-ABC"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick-supplier-phone">Số điện thoại</Label>
                <Input
                  id="quick-supplier-phone"
                  value={quickSupplierPhone}
                  onChange={(e) => setQuickSupplierPhone(e.target.value)}
                  placeholder="090..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-supplier-email">Email</Label>
                <Input
                  id="quick-supplier-email"
                  type="email"
                  value={quickSupplierEmail}
                  onChange={(e) => setQuickSupplierEmail(e.target.value)}
                  placeholder="ncc@example.com"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsQuickSupplierOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isQuickSupplierSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isQuickSupplierSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Thêm nhà cung cấp
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuickProductOpen} onOpenChange={setIsQuickProductOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Thêm nhanh sản phẩm</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickProductSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="quick-product-name">Tên sản phẩm *</Label>
              <Input
                id="quick-product-name"
                value={quickProductName}
                onChange={(e) => setQuickProductName(e.target.value)}
                placeholder="Nhập tên sản phẩm"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick-product-sku">Mã SKU *</Label>
                <Input
                  id="quick-product-sku"
                  value={quickProductSku}
                  onChange={(e) => setQuickProductSku(e.target.value)}
                  placeholder="VD: SKU-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-product-barcode">Barcode</Label>
                <Input
                  id="quick-product-barcode"
                  value={quickProductBarcode}
                  onChange={(e) => setQuickProductBarcode(e.target.value)}
                  placeholder="Quét hoặc nhập mã vạch"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select value={quickProductCategoryId} onValueChange={setQuickProductCategoryId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-product-unit">Đơn vị tính</Label>
                <Input
                  id="quick-product-unit"
                  value={quickProductUnit}
                  onChange={(e) => setQuickProductUnit(e.target.value)}
                  placeholder="VD: cái, chiếc, hộp"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-product-tracking">Phương pháp tính giá tồn *</Label>
              <Select value={quickProductTrackingMethod} onValueChange={setQuickProductTrackingMethod}>
                <SelectTrigger id="quick-product-tracking" className="bg-white">
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
              <p className="text-xs leading-5 text-slate-500">{getTrackingOption(quickProductTrackingMethod).hint}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick-product-cost">Giá vốn bình quân</Label>
                <Input
                  id="quick-product-cost"
                  type="number"
                  min="0"
                  value={quickProductCostPrice}
                  onChange={(e) => setQuickProductCostPrice(e.target.value)}
                  disabled={!quickProductUsesAverageCost}
                  placeholder={quickProductUsesAverageCost ? "Nhập giá vốn bình quân" : "Để trống"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-product-sell">Giá bán</Label>
                <Input
                  id="quick-product-sell"
                  type="number"
                  min="0"
                  value={quickProductSellingPrice}
                  onChange={(e) => setQuickProductSellingPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-product-min">Tồn tối thiểu</Label>
                <Input
                  id="quick-product-min"
                  type="number"
                  min="0"
                  value={quickProductMinQuantity}
                  onChange={(e) => setQuickProductMinQuantity(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsQuickProductOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isQuickProductSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isQuickProductSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Thêm sản phẩm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
