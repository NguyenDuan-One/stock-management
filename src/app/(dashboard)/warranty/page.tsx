"use client"

import * as React from "react"
import { Search, Loader2, Calendar, Shield, ShieldAlert, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PageHeader } from "@/components/ui/page-header"
import { TablePagination } from "@/components/ui/table-pagination"
import { BarcodeScannerInput } from "@/components/barcode/barcode-scanner-input"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

export default function WarrantyPage() {
  const [warranties, setWarranties] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState("ALL")
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const limit = 10

  React.useEffect(() => {
    fetchWarranties()
  }, [search, status, page])

  const fetchWarranties = async () => {
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        ...(status !== "ALL" && { status }),
      })

      const res = await fetch(`/api/warranty?${queryParams.toString()}`)
      const json = await res.json()
      setWarranties(json.data || [])
      setTotal(json.pagination?.total || 0)
    } catch (error) {
      console.error(error)
      toast.error("Không thể tải danh sách bảo hành")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBarcodeScan = (scannedValue: string) => {
    setSearch(scannedValue)
    setPage(1)
    toast.success(`Đang tra cứu Serial/Mã: ${scannedValue}`)
  }

  const getWarrantyStatusBadge = (endDateStr: string, status: string) => {
    const endDate = new Date(endDateStr)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0 || status === "EXPIRED") {
      return <Badge className="bg-red-50 text-red-700 border-red-200 border hover:bg-red-50">Hết bảo hành</Badge>
    } else if (diffDays <= 30) {
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 border hover:bg-amber-50 animate-pulse">
          Sắp hết hạn ({diffDays} ngày)
        </Badge>
      )
    } else {
      return <Badge className="bg-green-50 text-green-700 border-green-200 border hover:bg-green-50">Đang bảo hành</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Bảo hành"
        subtitle="Tra cứu và kiểm tra tình trạng bảo hành thiết bị của khách hàng"
      />

      {/* Barcode scanner widget */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-3">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          Tra cứu nhanh bằng Barcode hoặc Số Serial (S/N)
        </h3>
        <BarcodeScannerInput
          onScan={handleBarcodeScan}
          placeholder="Quét mã vạch hoặc nhập số Serial (S/N) của thiết bị..."
        />
      </div>

      <Tabs
        defaultValue="ALL"
        onValueChange={(val) => {
          setStatus(val)
          setPage(1)
        }}
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <TabsList className="bg-slate-100 p-1 border rounded-lg justify-start">
            <TabsTrigger value="ALL">Tất cả hồ sơ</TabsTrigger>
            <TabsTrigger value="ACTIVE">Đang bảo hành</TabsTrigger>
            <TabsTrigger value="EXPIRED">Hết hạn bảo hành</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm theo sản phẩm, S/N, khách hàng..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        <TabsContent value={status} className="mt-4">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="min-w-[220px]">Sản phẩm</TableHead>
                    <TableHead className="min-w-[170px]">Số Serial (S/N)</TableHead>
                    <TableHead className="min-w-[200px]">Khách hàng</TableHead>
                    <TableHead className="min-w-[140px]">Số PO</TableHead>
                    <TableHead className="min-w-[140px]">Số Hợp đồng</TableHead>
                    <TableHead className="min-w-[130px]">Ngày xuất bán</TableHead>
                    <TableHead className="min-w-[130px]">Hạn bảo hành</TableHead>
                    <TableHead className="min-w-[130px]">Ngày hết hạn</TableHead>
                    <TableHead className="min-w-[130px]">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                        <span className="mt-2 block text-xs">Đang tải dữ liệu...</span>
                      </TableCell>
                    </TableRow>
                  ) : warranties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                        Không tìm thấy hồ sơ bảo hành nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    warranties.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div className="font-semibold text-slate-900">{item.product?.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">SKU: {item.product?.sku}</div>
                        </TableCell>
                        <TableCell className="font-mono font-medium text-slate-800">
                          {item.serialNumber || "-"}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {item.customer?.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-700">
                          {item.stockOutItem?.stockOut?.poNumber || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-700">
                          {item.stockOutItem?.stockOut?.contractNumber || "-"}
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {formatDate(item.startDate)}
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm font-semibold">
                          {item.warrantyMonths} tháng
                        </TableCell>
                        <TableCell className="text-slate-800 text-sm font-medium">
                          {formatDate(item.endDate)}
                        </TableCell>
                        <TableCell>
                          {getWarrantyStatusBadge(item.endDate, item.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List View */}
            <div className="divide-y divide-slate-100 md:hidden">
              {isLoading ? (
                <div className="p-8 text-center text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                  <span className="mt-2 block text-xs">Đang tải dữ liệu...</span>
                </div>
              ) : warranties.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Không tìm thấy hồ sơ bảo hành nào.
                </div>
              ) : (
                warranties.map((item) => (
                  <div key={item.id} className="p-4 space-y-2.5 bg-white hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-slate-900 text-sm block leading-tight">{item.product?.name}</span>
                        <span className="text-[11px] text-slate-400">SKU: {item.product?.sku}</span>
                      </div>
                      {getWarrantyStatusBadge(item.endDate, item.status)}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Số Serial (S/N):</span>
                        <span className="font-mono font-medium text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {item.serialNumber || "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Khách hàng:</span>
                        <span className="font-medium text-slate-700 text-right max-w-[200px] truncate">
                          {item.customer?.name || "-"}
                        </span>
                      </div>

                      {item.stockOutItem?.stockOut?.poNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Số PO:</span>
                          <span className="font-mono font-medium text-slate-800 text-right">{item.stockOutItem.stockOut.poNumber}</span>
                        </div>
                      )}

                      {item.stockOutItem?.stockOut?.contractNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Số HĐ:</span>
                          <span className="font-mono font-medium text-slate-800 text-right">{item.stockOutItem.stockOut.contractNumber}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-slate-500">
                        <span>Thời hạn: <strong className="text-slate-700">{item.warrantyMonths} tháng</strong></span>
                        <span>Hết hạn: <strong className="text-slate-900">{formatDate(item.endDate)}</strong></span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <TablePagination
              page={page}
              limit={limit}
              total={total}
              itemLabel="hồ sơ"
              onPageChange={setPage}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
