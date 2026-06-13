"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Plus, Trash2, Search, Barcode } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { BarcodeScannerInput } from "@/components/barcode/barcode-scanner-input"
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

export default function NewStockOutPage() {
  const router = useRouter()
  const [customers, setCustomers] = React.useState<any[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Header form states
  const [customerId, setCustomerId] = React.useState("")
  const [exportDate, setExportDate] = React.useState(new Date().toISOString().split("T")[0])
  const [poNumber, setPoNumber] = React.useState("")
  const [contractNumber, setContractNumber] = React.useState("")
  const [notes, setNotes] = React.useState("")

  // Product Scanner / Selection states
  const [scannedProduct, setScannedProduct] = React.useState<any>(null)
  const [searchLoading, setSearchLoading] = React.useState(false)
  
  // Adding item states
  const [addSerialNumber, setAddSerialNumber] = React.useState("")
  const [addQuantity, setAddQuantity] = React.useState(1)
  const [addUnitPrice, setAddUnitPrice] = React.useState(0)
  const [addWarranty, setAddWarranty] = React.useState(12)
  const [addWarrantyStart, setAddWarrantyStart] = React.useState(new Date().toISOString().split("T")[0])

  // Table items list
  const [items, setItems] = React.useState<StockOutItem[]>([])

  // Input refs for keyboard navigation
  const qtyInputRef = React.useRef<HTMLInputElement>(null)
  const priceInputRef = React.useRef<HTMLInputElement>(null)
  const snInputRef = React.useRef<HTMLInputElement>(null)
  const warrantyInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    fetchCustomers()
  }, [])

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

      setScannedProduct(product)
      setAddUnitPrice(product.sellingPrice || 0)
      setAddWarranty(product.warrantyMonths || 12)
      setAddQuantity(1)
      setAddSerialNumber("")
      setAddWarrantyStart(new Date().toISOString().split("T")[0])
      
      // Auto-focus serial number input
      setTimeout(() => snInputRef.current?.focus(), 100)
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

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scannedProduct) return
    if (addQuantity <= 0) {
      toast.error("Số lượng phải lớn hơn 0")
      return
    }

    // Check available stock
    if (addQuantity > scannedProduct.quantity) {
      toast.error(`Số lượng xuất vượt quá tồn kho. Còn lại: ${scannedProduct.quantity}`)
      return
    }

    const newItem: StockOutItem = {
      id: Math.random().toString(36).substring(7),
      productId: scannedProduct.id,
      name: scannedProduct.name,
      sku: scannedProduct.sku,
      serialNumber: addSerialNumber,
      quantity: addQuantity,
      unitPrice: addUnitPrice,
      warrantyMonths: addWarranty,
      warrantyStartDate: addWarrantyStart,
    }

    setItems((prev) => [...prev, newItem])
    toast.success(`Đã thêm ${scannedProduct.name}`)
    
    // Reset scanner state
    setScannedProduct(null)
    setAddSerialNumber("")
    setAddQuantity(1)
    setAddUnitPrice(0)
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  const handleSubmit = async (status: "CONFIRMED" | "DRAFT") => {
    if (!customerId) {
      toast.error("Vui lòng chọn khách hàng")
      return
    }
    if (items.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm")
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
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Không thể lưu phiếu xuất kho")
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
                <BarcodeScannerInput onScan={handleBarcodeScan} isLoading={searchLoading} />
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
                      <span className={`font-bold text-base ${scannedProduct.quantity <= scannedProduct.minQuantity ? "text-red-300" : "text-green-300"}`}>
                        {scannedProduct.quantity} {scannedProduct.unit || "cái"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-4 space-y-4">
                    {/* Row 1: S/N, Qty, Price */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="item-sn" className="text-xs font-semibold text-slate-600">
                          Số Serial (S/N)
                        </Label>
                        <Input
                          id="item-sn"
                          ref={snInputRef}
                          placeholder="Không bắt buộc"
                          value={addSerialNumber}
                          onChange={(e) => setAddSerialNumber(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="item-qty" className="text-xs font-semibold text-slate-600">
                          Số lượng xuất *
                        </Label>
                        <Input
                          id="item-qty"
                          type="number"
                          min="1"
                          max={scannedProduct.quantity}
                          ref={qtyInputRef}
                          value={addQuantity}
                          onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                          className="h-9 text-sm font-semibold"
                          required
                        />
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
                          {formatCurrency(addQuantity * addUnitPrice)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setScannedProduct(null)}
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
                        items.map((item) => {
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
    </div>
  )
}
