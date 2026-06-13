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
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Số Serial (S/N)</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Ngày xuất bán</TableHead>
                  <TableHead>Hạn bảo hành</TableHead>
                  <TableHead>Ngày hết hạn</TableHead>
                  <TableHead>Trạng thái</TableHead>
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
                ) : warranties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-slate-500">
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

          {total > limit && (
            <div className="flex items-center justify-between py-2 mt-4">
              <div className="text-sm text-slate-500">
                Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)} trong {total} hồ sơ
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
