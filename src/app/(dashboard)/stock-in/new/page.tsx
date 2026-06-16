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
import { TablePagination } from "@/components/ui/table-pagination"
import { BarcodeScannerInput } from "@/components/barcode/barcode-scanner-input"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

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

export default function NewStockInPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = React.useState<any[]>([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Header form states
  const [supplierId, setSupplierId] = React.useState("")
  const [importDate, setImportDate] = React.useState(new Date().toISOString().split("T")[0])
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

  // Table items list
  const [items, setItems] = React.useState<StockInItem[]>([])
  const [itemPage, setItemPage] = React.useState(1)
  const itemLimit = 5

  // Input refs for keyboard navigation
  const qtyInputRef = React.useRef<HTMLInputElement>(null)
  const priceInputRef = React.useRef<HTMLInputElement>(null)
  const snInputRef = React.useRef<HTMLInputElement>(null)
  const warrantyInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    fetchSuppliers()
  }, [])

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
      setAddUnitPrice(product.costPrice || 0)
      setAddQuantity(1)
      setAddSerialNumber("")
      
      // Auto-focus quantity input after short timeout
      setTimeout(() => qtyInputRef.current?.focus(), 100)
    } catch (error) {
      console.error(error)
      toast.error("Lỗi khi tìm kiếm sản phẩm")
    } finally {
      setSearchLoading(false)
    }
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scannedProduct) return
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
    setAddQuantity(1)
    setAddUnitPrice(0)
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const paginatedItems = items.slice((itemPage - 1) * itemLimit, itemPage * itemLimit)

  React.useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(items.length / itemLimit))
    if (itemPage > maxPage) setItemPage(maxPage)
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
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Không thể lưu phiếu nhập kho")
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
                <Label>Nhà cung cấp *</Label>
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

              <div className="grid grid-cols-2 gap-4">
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
                <BarcodeScannerInput onScan={handleBarcodeScan} isLoading={searchLoading} />
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
                        className="bg-white h-9 text-xs"
                      />
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
                        value={addQuantity}
                        onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
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

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setScannedProduct(null)}
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
    </div>
  )
}
