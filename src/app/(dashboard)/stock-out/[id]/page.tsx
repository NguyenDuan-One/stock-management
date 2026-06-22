"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2, Printer, Calendar, User, FileText, CheckCircle2, AlertTriangle, AlertCircle, Trash, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/ui/page-header"
import { TablePagination } from "@/components/ui/table-pagination"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PrintCompanyHeader } from "@/components/stock/print-company-header"

export default function StockOutDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [stockOut, setStockOut] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [itemPage, setItemPage] = React.useState(1)
  const [companySettings, setCompanySettings] = React.useState<any>(null)
  const itemLimit = 10

  React.useEffect(() => {
    fetchStockOutDetails()
    fetchCompanySettings()
  }, [id])

  const fetchCompanySettings = async () => {
    try {
      const res = await fetch("/api/settings/company")
      if (res.ok) setCompanySettings(await res.json())
    } catch (error) {
      console.error("Company settings load error:", error)
    }
  }

  const fetchStockOutDetails = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/stock-out/${id}`)
      if (!res.ok) throw new Error("Không thể tải thông tin phiếu xuất kho")
      const json = await res.json()
      setStockOut(json)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Lỗi khi tải thông tin phiếu xuất")
      router.push("/stock-out")
    } finally {
      setIsLoading(false)
    }
  }

  const [isCancelling, setIsCancelling] = React.useState(false)
  const [isApproving, setIsApproving] = React.useState(false)
  
  const [isEditing, setIsEditing] = React.useState(false)
  const [editData, setEditData] = React.useState({ poNumber: "", contractNumber: "", notes: "" })
  const [isSaving, setIsSaving] = React.useState(false)


  React.useEffect(() => {
    const totalItems = stockOut?.items?.length || 0
    const maxPage = Math.max(1, Math.ceil(totalItems / itemLimit))
    if (itemPage > maxPage) setItemPage(maxPage)
  }, [stockOut?.items?.length, itemPage])

    const handlePrint = () => {
      window.print()
    }

  const openEdit = () => {
    if (stockOut?.status === "CANCELLED") {
      toast.error("Không thể sửa phiếu đã hủy")
      return
    }
    setEditData({
      poNumber: stockOut?.poNumber || "",
      contractNumber: stockOut?.contractNumber || "",
      notes: stockOut?.notes || ""
    })
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true)
      const res = await fetch(`/api/stock-out/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Không thể lưu")
      
      toast.success("Đã cập nhật thông tin thành công")
      setIsEditing(false)
      fetchStockOutDetails()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy phiếu này? Hệ thống sẽ tự động hoàn lại số lượng tồn kho.")) return
    
    try {
      setIsCancelling(true)
      const res = await fetch(`/api/stock-out/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Không thể hủy phiếu")
      
      toast.success("Hủy phiếu thành công")
      fetchStockOutDetails()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message)
    } finally {
      setIsCancelling(false)
    }
  }

  const handleApprove = async () => {
    if (!window.confirm("Duyệt bản nháp này và ghi nhận xuất kho? Hệ thống sẽ trừ tồn kho và tạo bảo hành theo serial.")) return

    try {
      setIsApproving(true)
      const res = await fetch(`/api/stock-out/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Không thể duyệt phiếu")

      toast.success("Đã duyệt phiếu và ghi nhận xuất kho")
      fetchStockOutDetails()
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Không thể duyệt phiếu")
    } finally {
      setIsApproving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
      case "DRAFT":
        return <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
      case "CANCELLED":
        return <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "COMPLETED":
        return "Đã xuất kho"
      case "DRAFT":
        return "Bản nháp"
      case "CANCELLED":
        return "Đã hủy"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "COMPLETED":
        return "bg-green-50 border-green-200 text-green-800"
      case "DRAFT":
        return "bg-amber-50 border-amber-200 text-amber-800"
      case "CANCELLED":
        return "bg-red-50 border-red-200 text-red-800"
      default:
        return "bg-slate-50 border-slate-200"
    }
  }

  const detailItems = stockOut?.items || []
  const paginatedItems = detailItems.slice((itemPage - 1) * itemLimit, itemPage * itemLimit)

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:block print:max-w-none print:p-0 print:border-none print:shadow-none">
      <div className="flex items-center gap-2 print:hidden">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push("/stock-out")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Chi tiết phiếu xuất kho" subtitle={`Mã phiếu: ${stockOut.code}`} />
        <div className="ml-auto flex items-center gap-2">
          {stockOut.status === "DRAFT" && (
            <Button
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={handleApprove}
              disabled={isApproving || isCancelling}
            >
              {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Duyệt phiếu
            </Button>
          )}
          {stockOut.status !== "CANCELLED" && (
            <Button variant="destructive" onClick={handleCancel} disabled={isCancelling || isApproving}>
              {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
              Hủy phiếu
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4 text-blue-600" />
            In phiếu
          </Button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="print-slip space-y-6 bg-white p-6 md:p-8 rounded-xl border shadow-sm print:p-0 print:shadow-none print:border-none">
        <div className="print-page-code hidden print:block">Phiếu xuất kho: {stockOut.code}</div>
        <PrintCompanyHeader settings={companySettings} title="Phieu xuat kho" code={stockOut.code} />

        {/* Status Alert Banner */}
        <div className={`p-4 border rounded-lg flex items-center gap-3 print:hidden ${getStatusColor(stockOut.status)}`}>
          {getStatusIcon(stockOut.status)}
          <span className="font-semibold text-sm">Trạng thái phiếu: {getStatusText(stockOut.status)}</span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b print:grid-cols-2 print:gap-4 print:pb-4">
          <div className="space-y-3 rounded-lg border bg-slate-50/60 p-4 print:rounded-none print:bg-white print:p-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase">Thông tin xuất kho</h3>
              {stockOut.status !== "CANCELLED" && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 print:hidden" onClick={openEdit} title="Sửa thông tin">
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã phiếu xuất:</span>
                <span className="font-mono font-bold text-slate-800">{stockOut.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày xuất kho:</span>
                <span className="font-semibold text-slate-700">{formatDate(stockOut.exportDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số đơn hàng (PO):</span>
                <span className="font-medium text-slate-800">{stockOut.poNumber || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số hợp đồng:</span>
                <span className="font-medium text-slate-800">{stockOut.contractNumber || "-"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border bg-slate-50/60 p-4 print:rounded-none print:bg-white print:p-3">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase">Khách hàng</h3>
            <div className="space-y-2 text-sm">
              <div className="font-bold text-slate-800">{stockOut.customer?.name || "Khách lẻ"}</div>
              {stockOut.customer?.code && (
                <div className="text-xs text-slate-500">Mã khách hàng: {stockOut.customer.code}</div>
              )}
              {stockOut.customer?.phone && (
                <div className="text-xs text-slate-600">SĐT: {stockOut.customer.phone}</div>
              )}
              {stockOut.customer?.email && (
                <div className="text-xs text-slate-600">Email: {stockOut.customer.email}</div>
              )}
              {stockOut.customer?.address && (
                <div className="text-xs text-slate-600">Địa chỉ: {stockOut.customer.address}</div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-4 print:space-y-2">
          <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase print:text-xs">Danh sách sản phẩm xuất</h3>
          <div className="rounded-md border overflow-hidden print:hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[80px]">STT</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Mã SKU</TableHead>
                  <TableHead>Số Serial (S/N)</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Đơn giá bán</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                  <TableHead className="text-center w-[120px]">Thời hạn BH</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item: any, idx: number) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium">{(itemPage - 1) * itemLimit + idx + 1}</TableCell>
                    <TableCell className="font-semibold text-slate-800">{item.product?.name}</TableCell>
                    <TableCell className="font-mono text-xs">{item.product?.sku}</TableCell>
                    <TableCell className="font-mono font-medium text-slate-600">{item.serialNumber || "-"}</TableCell>
                    <TableCell className="text-right font-medium">{item.quantity} {item.product?.unit || "cái"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-bold text-slate-800">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {item.warrantyMonths ? `${item.warrantyMonths} tháng` : "Không bảo hành"}
                      {item.warrantyStartDate && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          từ {formatDate(item.warrantyStartDate)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="hidden print:block">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[80px]">STT</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Mã SKU</TableHead>
                  <TableHead>Số Serial (S/N)</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Đơn giá bán</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                  <TableHead className="text-center w-[120px]">Thời hạn BH</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailItems.map((item: any, idx: number) => (
                  <TableRow key={`print-${item.id || idx}`}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-semibold text-slate-800">{item.product?.name}</TableCell>
                    <TableCell className="font-mono text-xs">{item.product?.sku}</TableCell>
                    <TableCell className="font-mono font-medium text-slate-600">{item.serialNumber || "-"}</TableCell>
                    <TableCell className="text-right font-medium">{item.quantity} {item.product?.unit || "cái"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-bold text-slate-800">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {item.warrantyMonths ? `${item.warrantyMonths} tháng` : "Không bảo hành"}
                      {item.warrantyStartDate && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          từ {formatDate(item.warrantyStartDate)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="print:hidden">
            <TablePagination
              page={itemPage}
              limit={itemLimit}
              total={detailItems.length}
              itemLabel="sản phẩm"
              onPageChange={setItemPage}
            />
          </div>
        </div>

        {/* Cost Summary & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 print:grid-cols-2 print:gap-4 print:pt-4">
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs tracking-wider uppercase">Ghi chú</h4>
            <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-600 min-h-24 whitespace-pre-line print:min-h-16 print:rounded-none print:bg-white print:p-3">
              {stockOut.notes || "Không có ghi chú thêm."}
            </div>
          </div>

          <div className="space-y-4 flex flex-col justify-between items-end">
            <div className="w-full space-y-2 text-sm border-t pt-4 md:border-none md:pt-0">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Tổng doanh thu xuất:</span>
                <span className="font-bold text-2xl text-blue-700 print:text-lg print:text-slate-900">{formatCurrency(stockOut.totalAmount)}</span>
              </div>
            </div>

            <div className="text-right text-xs text-slate-400 space-y-1 print:mt-12">
              <div>Được ghi nhận bởi: <span className="font-semibold text-slate-600">{stockOut.createdBy?.fullName || stockOut.createdBy?.username}</span></div>
              <div>Vào lúc: {formatDate(stockOut.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Print Signatures (hidden in screen) */}
        <div className="hidden print:grid grid-cols-3 gap-6 text-center text-sm pt-10 mt-10 border-t">
          <div>
            <div className="font-bold">Người lập phiếu</div>
            <div className="text-xs text-slate-400 mt-1">(Ký, họ tên)</div>
            <div className="mt-16 border-t border-dotted border-slate-400 pt-1 text-xs text-slate-500">&nbsp;</div>
          </div>
          <div>
            <div className="font-bold">Người nhận hàng</div>
            <div className="text-xs text-slate-400 mt-1">(Ký, họ tên)</div>
            <div className="mt-16 border-t border-dotted border-slate-400 pt-1 text-xs text-slate-500">&nbsp;</div>
          </div>
          <div>
            <div className="font-bold">Thủ kho</div>
            <div className="text-xs text-slate-400 mt-1">(Ký, họ tên)</div>
            <div className="mt-16 border-t border-dotted border-slate-400 pt-1 text-xs text-slate-500">&nbsp;</div>
          </div>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa thông tin xuất kho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Số PO (Đơn đặt hàng)</Label>
              <Input 
                value={editData.poNumber} 
                onChange={(e) => setEditData({...editData, poNumber: e.target.value})}
                placeholder="Nhập số PO..."
              />
            </div>
            <div className="space-y-2">
              <Label>Số hợp đồng / Hóa đơn</Label>
              <Input 
                value={editData.contractNumber} 
                onChange={(e) => setEditData({...editData, contractNumber: e.target.value})}
                placeholder="Nhập số hợp đồng hoặc hóa đơn..."
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea 
                value={editData.notes} 
                onChange={(e) => setEditData({...editData, notes: e.target.value})}
                placeholder="Ghi chú thêm..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
