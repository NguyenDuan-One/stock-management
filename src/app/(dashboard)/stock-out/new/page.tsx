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

interface StockOutItem {
  id: string // temporary client-side ID
  productId: string
  name: string
  sku: string
  serialNumber: string
  quantity: number
  unitPrice: number
  warrantyMonths: number
  warrantyStartDate: string
}

interface CustomerOption {
  id: string
  name: string
  code?: string | null
}

interface ProductOption extends BarcodeSuggestion {
  id: string
  name: string
  sku: string
  quantity: number
  minQuantity?: number | null
  unit?: string | null
  sellingPrice?: number | string | null
  warrantyMonths?: number | null
}

export default function NewStockOutPage() {
  const router = useRouter()
  const [customers, setCustomers] = React.useState<CustomerOption[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Header form states
  const [customerId, setCustomerId] = React.useState("")
  const [exportDate, setExportDate] = React.useState(new Date().toISOString().split("T")[0])
  const [poNumber, setPoNumber] = React.useState("")
  const [contractNumber, setContractNumber] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = React.useState(false)
  const [isQuickCustomerSubmitting, setIsQuickCustomerSubmitting] = React.useState(false)
  const [quickCustomerName, setQuickCustomerName] = React.useState("")
  const [quickCustomerCode, setQuickCustomerCode] = React.useState("")
  const [quickCustomerContactName, setQuickCustomerContactName] = React.useState("")
  const [quickCustomerPhone, setQuickCustomerPhone] = React.useState("")
  const [quickCustomerEmail, setQuickCustomerEmail] = React.useState("")
  const [quickCustomerAddress, setQuickCustomerAddress] = React.useState("")

  // Product Scanner / Selection states
  const [scannedProduct, setScannedProduct] = React.useState<ProductOption | null>(null)
  const [searchLoading, setSearchLoading] = React.useState(false)
  const [productQuery, setProductQuery] = React.useState("")
  const [productSuggestions, setProductSuggestions] = React.useState<ProductOption[]>([])
  
  // Adding item states
  const [addSerialNumber, setAddSerialNumber] = React.useState("")
  const [addQuantity, setAddQuantity] = React.useState(1)
  const [addUnitPrice, setAddUnitPrice] = React.useState(0)
  const [addWarranty, setAddWarranty] = React.useState(12)
  const [addWarrantyStart, setAddWarrantyStart] = React.useState(new Date().toISOString().split("T")[0])
  const [serialLines, setSerialLines] = React.useState<string[]>([])
  const [isCheckingSerial, setIsCheckingSerial] = React.useState(false)

  // Table items list
  const [items, setItems] = React.useState<StockOutItem[]>([])
  const [itemPage, setItemPage] = React.useState(1)
  const itemLimit = 5

  // Input refs for keyboard navigation
  const qtyInputRef = React.useRef<HTMLInputElement>(null)
  const priceInputRef = React.useRef<HTMLInputElement>(null)
  const snInputRef = React.useRef<HTMLInputElement>(null)
  const warrantyInputRef = React.useRef<HTMLInputElement>(null)

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers")
      const json = await res.json()
      setCustomers(Array.isArray(json) ? json : json.data || [])
    } catch (error) {
      console.error(error)
      toast.error("Không thể tải danh sách khách hàng")
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchCustomers()
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

  const handleProductQueryChange = (value: string) => {
    setProductQuery(value)
    if (value.trim().length < 2) {
      setProductSuggestions([])
    }
  }

  const selectProductForStockOut = (product: ProductOption) => {
    setScannedProduct(product)
    setAddUnitPrice(Number(product.sellingPrice) || 0)
    setAddWarranty(Number(product.warrantyMonths) || 12)
    setAddQuantity(1)
    setAddSerialNumber("")
    setSerialLines([])
    setAddWarrantyStart(new Date().toISOString().split("T")[0])
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

      selectProductForStockOut(product)
    } catch (error) {
      console.error(error)
      toast.error("Lỗi khi tìm kiếm sản phẩm")
    } finally {
      setSearchLoading(false)
    }
  }

  // Compute warranty end date for display
  const computedWarrantyEnd = React.useMemo(() => {
    if (!addWarrantyStart || addWarranty <= 0) return null
    const d = new Date(addWarrantyStart)
    d.setMonth(d.getMonth() + addWarranty)
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
  }, [addWarrantyStart, addWarranty])

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback
  }

  const createQuickCustomerCode = () => {
    return `KH${Date.now().toString().slice(-6)}`
  }

  const openQuickCustomer = () => {
    setQuickCustomerName("")
    setQuickCustomerCode(createQuickCustomerCode())
    setQuickCustomerContactName("")
    setQuickCustomerPhone("")
    setQuickCustomerEmail("")
    setQuickCustomerAddress("")
    setIsQuickCustomerOpen(true)
  }

  const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = quickCustomerName.trim()
    const code = quickCustomerCode.trim()
    if (!name || !code) {
      toast.error("Vui lòng nhập tên khách hàng và mã KH")
      return
    }

    setIsQuickCustomerSubmitting(true)
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          contactName: quickCustomerContactName.trim() || undefined,
          phone: quickCustomerPhone.trim() || undefined,
          email: quickCustomerEmail.trim() || undefined,
          address: quickCustomerAddress.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Không thể tạo khách hàng")

      setCustomers((prev) => [json, ...prev.filter((customer) => customer.id !== json.id)])
      setCustomerId(json.id)
      setIsQuickCustomerOpen(false)
      toast.success("Đã thêm khách hàng và chọn vào phiếu")
    } catch (error: unknown) {
      console.error(error)
      toast.error(getErrorMessage(error, "Không thể thêm khách hàng"))
    } finally {
      setIsQuickCustomerSubmitting(false)
    }
  }

  const createClientItemId = () => {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scannedProduct) return
    const alreadySelectedQuantity = items
      .filter((item) => item.productId === scannedProduct.id)
      .reduce((sum, item) => sum + item.quantity, 0)
    const availableQuantity = Math.max(0, Number(scannedProduct.quantity || 0) - alreadySelectedQuantity)
    const normalizedSerials = serialLines.map((serial) => serial.trim()).filter(Boolean)

    if (normalizedSerials.length === 0) {
      toast.error("Vui lòng nhập serial để xuất kho và quản lý bảo hành")
      setTimeout(() => snInputRef.current?.focus(), 50)
      return
    }

    if (normalizedSerials.length > availableQuantity) {
      toast.error(`Số serial vượt quá tồn kho còn lại: ${availableQuantity}`)
      return
    }

    const newItems: StockOutItem[] = normalizedSerials.map((serialNumber) => ({
      id: createClientItemId(),
      productId: scannedProduct.id,
      name: scannedProduct.name,
      sku: scannedProduct.sku,
      serialNumber,
      quantity: 1,
      unitPrice: addUnitPrice,
      warrantyMonths: addWarranty,
      warrantyStartDate: addWarrantyStart,
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

  const handleAddSerialLine = async () => {
    if (!scannedProduct) return
    if (isCheckingSerial) return

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

    const alreadySelectedQuantity = items
      .filter((item) => item.productId === scannedProduct.id)
      .reduce((sum, item) => sum + item.quantity, 0)
    const availableQuantity = Math.max(0, Number(scannedProduct.quantity || 0) - alreadySelectedQuantity)

    if (serialLines.length + 1 > availableQuantity) {
      toast.error(`Số serial vượt quá tồn kho còn lại: ${availableQuantity}`)
      return
    }

    setIsCheckingSerial(true)
    try {
      const res = await fetch(
        `/api/products/serial-check?productId=${encodeURIComponent(scannedProduct.id)}&serial=${encodeURIComponent(serial)}`
      )
      const json = await res.json()
      if (!res.ok || !json.available) {
        toast.error(json.error || "Serial không hợp lệ hoặc đã xuất kho")
        return
      }

      setSerialLines((prev) => [...prev, serial])
      setAddSerialNumber("")
      setAddQuantity(serialLines.length + 1)
      setTimeout(() => snInputRef.current?.focus(), 50)
    } catch (error) {
      console.error(error)
      toast.error("Không thể kiểm tra serial")
    } finally {
      setIsCheckingSerial(false)
    }
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

  const handleSubmit = async (status: "CONFIRMED" | "DRAFT") => {
    if (!customerId) {
      toast.error("Vui lòng chọn khách hàng")
      return
    }
    if (items.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm")
      return
    }

    if (items.some((item) => !item.serialNumber.trim())) {
      toast.error("Mỗi dòng xuất kho phải có serial để quản lý bảo hành")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        customerId,
        exportDate: new Date(exportDate).toISOString(),
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
          warrantyStartDate: new Date(item.warrantyStartDate).toISOString(),
        })),
      }

      const res = await fetch("/api/stock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Lỗi tạo phiếu xuất")

      toast.success(status === "CONFIRMED" ? "Đã xuất kho thành công" : "Lưu bản nháp thành công")
      router.push("/stock-out")
    } catch (error: unknown) {
      console.error(error)
      toast.error(getErrorMessage(error, "Không thể lưu phiếu xuất kho"))
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
          onClick={() => router.push("/stock-out")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Tạo phiếu xuất kho" subtitle="Quét mã vạch và ghi nhận xuất kho bán hàng" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Header Form (40%) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-sm border">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-base text-slate-800">Thông tin phiếu xuất</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Khách hàng *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-fit gap-1.5 text-xs float-end"
                  onClick={openQuickCustomer}
                >
                  <Plus className=" h-3.5 w-3.5" />
                  Thêm khách hàng
                </Button>
                {isLoadingCustomers ? (
                  <Input disabled placeholder="Đang tải danh sách khách hàng..." />
                ) : (
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Chọn khách hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((cust) => (
                        <SelectItem key={cust.id} value={cust.id}>
                          {cust.name} ({cust.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="export-date">Ngày xuất kho *</Label>
                <Input
                  id="export-date"
                  type="date"
                  value={exportDate}
                  onChange={(e) => setExportDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="po-number">Số đơn hàng (PO)</Label>
                  <Input
                    id="po-number"
                    placeholder="VD: PO-2026-050"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract-number">Số hợp đồng</Label>
                  <Input
                    id="contract-number"
                    placeholder="VD: HĐ-BAN-2026"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  placeholder="Ghi chú thêm thông tin xuất kho..."
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
              <CardTitle className="text-base text-slate-800">Thêm sản phẩm xuất kho</CardTitle>
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
                  onSuggestionSelect={(item) => selectProductForStockOut(item as ProductOption)}
                  emptyText="Không có sản phẩm khớp"
                />
              </div>

              {/* Scanned product info card & options to add */}
              {scannedProduct && (
                <form
                  onSubmit={handleAddItem}
                  className="border border-blue-200 rounded-xl overflow-hidden animate-in fade-in duration-200"
                >
                  {/* Product header */}
                  <div className="bg-blue-600 px-4 py-3 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white text-sm">{scannedProduct.name}</h4>
                      <p className="text-blue-200 text-xs mt-0.5">SKU: {scannedProduct.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-blue-200 text-xs block">Tồn kho</span>
                      <span className={`font-bold text-base ${scannedProduct.quantity <= (scannedProduct.minQuantity ?? 0) ? "text-red-300" : "text-green-300"}`}>
                        {scannedProduct.quantity} {scannedProduct.unit || "cái"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-4 space-y-4">
                    {/* Row 1: S/N, Qty, Price */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="item-sn" className="text-xs font-semibold text-slate-600">
                          Quét serial (barcode/S/N) *
                        </Label>
                        <Input
                          id="item-sn"
                          ref={snInputRef}
                          placeholder="Quét/nhập serial rồi Enter"
                          value={addSerialNumber}
                          onChange={(e) => setAddSerialNumber(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddSerialLine()
                            }
                          }}
                          className="h-9 text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 w-full gap-1.5 text-xs"
                          onClick={handleAddSerialLine}
                          disabled={isCheckingSerial}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Thêm serial
                        </Button>
                        <p className="text-[10px] text-slate-500">
                          Máy quét barcode sẽ tự thêm serial khi gửi phím Enter.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="item-qty" className="text-xs font-semibold text-slate-600">
                          SL theo serial
                        </Label>
                        <Input
                          id="item-qty"
                          type="number"
                          min="1"
                          max={scannedProduct.quantity}
                          ref={qtyInputRef}
                          value={serialLines.length || addQuantity}
                          readOnly
                          disabled
                          className="h-9 text-sm font-semibold"
                          required
                        />
                        <p className="text-[10px] text-slate-500">Mỗi serial được tính SL 1.</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="item-price" className="text-xs font-semibold text-slate-600">
                          Đơn giá bán (₫)
                        </Label>
                        <Input
                          id="item-price"
                          type="number"
                          min="0"
                          ref={priceInputRef}
                          value={addUnitPrice}
                          onChange={(e) => setAddUnitPrice(parseFloat(e.target.value) || 0)}
                          className="h-9 text-sm"
                          required
                        />
                      </div>
                    </div>

                    {serialLines.length > 0 && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
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

                    {/* Row 2: WARRANTY — highlighted section */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-amber-800">Thông tin bảo hành sản phẩm</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="item-warranty" className="text-xs font-semibold text-amber-700">
                            Thời hạn bảo hành (tháng) *
                          </Label>
                          <Input
                            id="item-warranty"
                            type="number"
                            min="0"
                            ref={warrantyInputRef}
                            value={addWarranty}
                            onChange={(e) => setAddWarranty(parseInt(e.target.value) || 0)}
                            className="h-9 text-sm bg-white border-amber-300 focus:border-amber-500"
                            placeholder="VD: 12"
                          />
                          <p className="text-[10px] text-amber-600">
                            Nhập 0 nếu không bảo hành
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="item-warranty-start" className="text-xs font-semibold text-amber-700">
                            Ngày bắt đầu bảo hành *
                          </Label>
                          <Input
                            id="item-warranty-start"
                            type="date"
                            value={addWarrantyStart}
                            onChange={(e) => setAddWarrantyStart(e.target.value)}
                            className="h-9 text-sm bg-white border-amber-300 focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Computed warranty end date */}
                      {addWarranty > 0 && computedWarrantyEnd && (
                        <div className="flex items-center gap-2 bg-amber-100 rounded-md px-3 py-2">
                          <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          <span className="text-xs text-amber-700">
                            Bảo hành đến:{" "}
                            <span className="font-bold text-amber-900">{computedWarrantyEnd}</span>
                            {" "}({addWarranty} tháng)
                          </span>
                        </div>
                      )}
                      {addWarranty === 0 && (
                        <div className="flex items-center gap-2 bg-slate-100 rounded-md px-3 py-2">
                          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          <span className="text-xs text-slate-500">Sản phẩm này không có bảo hành</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-between items-center pt-1">
                      <div className="text-sm text-slate-600">
                        Thành tiền:{" "}
                        <span className="font-bold text-blue-700">
                          {formatCurrency((serialLines.length || addQuantity) * addUnitPrice)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setScannedProduct(null)
                            setAddSerialNumber("")
                            setSerialLines([])
                            setAddQuantity(1)
                          }}
                          className="text-slate-500 hover:text-slate-700 h-9 px-3 text-sm"
                        >
                          Hủy
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-9 px-4 text-sm text-white">
                          <Plus className="mr-1.5 h-4 w-4" /> Thêm vào danh sách
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* Items List Table */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800 text-sm">Danh sách sản phẩm xuất</h4>
                <div className="rounded-md border overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-xs py-2">Sản phẩm</TableHead>
                        <TableHead className="text-xs py-2">S/N</TableHead>
                        <TableHead className="text-right text-xs py-2">SL</TableHead>
                        <TableHead className="text-right text-xs py-2">Đơn giá</TableHead>
                        <TableHead className="text-right text-xs py-2">Thành tiền</TableHead>
                        <TableHead className="text-xs py-2 min-w-[120px]">Bảo hành</TableHead>
                        <TableHead className="w-[50px] py-2"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-slate-400 text-xs">
                            Chưa có sản phẩm nào. Vui lòng quét mã vạch hoặc nhập SKU để xuất.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedItems.map((item) => {
                          const warrantyEnd = (() => {
                            if (!item.warrantyStartDate || item.warrantyMonths <= 0) return null
                            const d = new Date(item.warrantyStartDate)
                            d.setMonth(d.getMonth() + item.warrantyMonths)
                            return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
                          })()
                          return (
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
                              <TableCell className="py-2">
                                {item.warrantyMonths > 0 ? (
                                  <div>
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                      {item.warrantyMonths} tháng
                                    </span>
                                    {warrantyEnd && (
                                      <span className="block text-[10px] text-slate-400 mt-0.5">
                                        đến {warrantyEnd}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">Không BH</span>
                                )}
                              </TableCell>
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
                          )
                        })
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
                  <span className="font-semibold text-slate-700">Tổng doanh thu xuất:</span>
                  <span className="font-bold text-xl text-blue-700">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" disabled={isSubmitting} onClick={() => router.push("/stock-out")}>
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
          onClick={() => handleSubmit("CONFIRMED")}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Xác nhận xuất kho
        </Button>
      </div>

      <Dialog open={isQuickCustomerOpen} onOpenChange={setIsQuickCustomerOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Thêm nhanh khách hàng</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickCustomerSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick-customer-name">Tên khách hàng *</Label>
                <Input
                  id="quick-customer-name"
                  value={quickCustomerName}
                  onChange={(e) => setQuickCustomerName(e.target.value)}
                  placeholder="Nhập tên khách hàng"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-customer-code">Mã KH *</Label>
                <Input
                  id="quick-customer-code"
                  value={quickCustomerCode}
                  onChange={(e) => setQuickCustomerCode(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick-customer-contact">Người liên hệ</Label>
                <Input
                  id="quick-customer-contact"
                  value={quickCustomerContactName}
                  onChange={(e) => setQuickCustomerContactName(e.target.value)}
                  placeholder="Tên người liên hệ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-customer-phone">Số điện thoại</Label>
                <Input
                  id="quick-customer-phone"
                  value={quickCustomerPhone}
                  onChange={(e) => setQuickCustomerPhone(e.target.value)}
                  placeholder="Số điện thoại"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-customer-email">Email</Label>
              <Input
                id="quick-customer-email"
                type="email"
                value={quickCustomerEmail}
                onChange={(e) => setQuickCustomerEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-customer-address">Địa chỉ</Label>
              <Textarea
                id="quick-customer-address"
                value={quickCustomerAddress}
                onChange={(e) => setQuickCustomerAddress(e.target.value)}
                rows={2}
                placeholder="Địa chỉ khách hàng"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsQuickCustomerOpen(false)} disabled={isQuickCustomerSubmitting}>
                Hủy
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isQuickCustomerSubmitting}>
                {isQuickCustomerSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Thêm và chọn
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
