"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Eye, Trash, Loader2, Calendar, FileText } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { TablePagination } from "@/components/ui/table-pagination"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function StockInListPage() {
  const router = useRouter()
  const [stockIns, setStockIns] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  
  // Search & filter states
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState("ALL")
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const limit = 10

  React.useEffect(() => {
    fetchStockIns()
  }, [search, status, page])

  const fetchStockIns = async () => {
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        ...(status !== "ALL" && { status }),
      })
      
      const res = await fetch(`/api/stock-in?${queryParams.toString()}`)
      const json = await res.json()
      
      setStockIns(json.data || [])
      setTotal(json.pagination?.total || 0)
    } catch (error) {
      console.error(error)
      toast.error("Không thể tải danh sách phiếu nhập kho")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Hoàn thành</Badge>
      case "DRAFT":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none">Bản nháp</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">Đã hủy</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Nhập kho"
        subtitle="Quản lý các phiếu nhập hàng từ nhà cung cấp"
      >
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => router.push("/stock-in/new")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tạo phiếu nhập
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo Mã phiếu, Số serial (S/N), Số PO, Hợp đồng, Nhà cung cấp..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9 bg-white"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={status}
            onValueChange={(val) => {
              setStatus(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="DRAFT">Bản nháp</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-[120px] min-w-[120px]">Mã phiếu</TableHead>
                <TableHead className="min-w-[200px]">Nhà cung cấp</TableHead>
                <TableHead className="min-w-[180px]">Số Serial (S/N)</TableHead>
                <TableHead className="min-w-[130px]">Ngày nhập</TableHead>
                <TableHead className="min-w-[160px]">Thông tin PO/HĐ</TableHead>
                <TableHead className="min-w-[140px] text-right">Tổng tiền</TableHead>
                <TableHead className="min-w-[130px]">Trạng thái</TableHead>
                <TableHead className="min-w-[130px]">Người tạo</TableHead>
                <TableHead className="w-[110px] min-w-[110px] text-right">Thao tác</TableHead>
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
              ) : stockIns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                    Không tìm thấy phiếu nhập kho nào.
                  </TableCell>
                </TableRow>
              ) : (
                stockIns.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono font-bold text-blue-600">
                      {item.code}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800">
                      {item.supplier?.name || "Khác"}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const serials = (item.items || [])
                          .map((i: any) => i.serialNumber)
                          .filter(Boolean)
                        if (serials.length === 0) return <span className="text-slate-400 text-xs">-</span>
                        if (serials.length === 1) {
                          return (
                            <Badge variant="outline" className="font-mono text-xs text-slate-700 bg-slate-50 border-slate-200">
                              {serials[0]}
                            </Badge>
                          )
                        }
                        return (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            <Badge variant="outline" className="font-mono text-xs text-slate-700 bg-slate-50 border-slate-200">
                              {serials[0]}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] text-blue-700 bg-blue-50 border-blue-200">
                              +{serials.length - 1} khác
                            </Badge>
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(item.importDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs space-y-0.5">
                      {item.poNumber && (
                        <div>
                          <span className="text-slate-400">PO:</span> {item.poNumber}
                        </div>
                      )}
                      {item.contractNumber && (
                        <div>
                          <span className="text-slate-400">HĐ:</span> {item.contractNumber}
                        </div>
                      )}
                      {!item.poNumber && !item.contractNumber && "-"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      {formatCurrency(item.totalAmount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-slate-700 text-sm">
                      {item.createdBy?.fullName || item.createdBy?.username || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700"
                        onClick={() => router.push(`/stock-in/${item.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
          ) : stockIns.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Không tìm thấy phiếu nhập kho nào.
            </div>
          ) : (
            stockIns.map((item) => {
              const serials = (item.items || [])
                .map((i: any) => i.serialNumber)
                .filter(Boolean)
              return (
                <div key={item.id} className="p-4 space-y-2.5 bg-white hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-600 text-sm">{item.code}</span>
                    {getStatusBadge(item.status)}
                  </div>
                  
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Nhà cung cấp:</span>
                      <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">
                        {item.supplier?.name || "Khác"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Ngày nhập:</span>
                      <span className="text-slate-700 font-medium">{formatDate(item.importDate)}</span>
                    </div>

                    {item.poNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Số PO:</span>
                        <span className="font-mono font-medium text-slate-800 text-right">{item.poNumber}</span>
                      </div>
                    )}

                    {item.contractNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Số HĐ:</span>
                        <span className="font-mono font-medium text-slate-800 text-right">{item.contractNumber}</span>
                      </div>
                    )}

                    {serials.length > 0 && (
                      <div className="pt-0.5">
                        <span className="text-slate-400 block mb-1">Số Serial (S/N):</span>
                        <div className="flex flex-wrap gap-1">
                          {serials.slice(0, 3).map((s: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="font-mono text-[11px] text-slate-700 bg-slate-50 border-slate-200">
                              {s}
                            </Badge>
                          ))}
                          {serials.length > 3 && (
                            <Badge variant="secondary" className="text-[10px] text-blue-700 bg-blue-50 border-blue-200">
                              +{serials.length - 3} khác
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-tight">Tổng tiền</span>
                      <span className="font-bold text-sm text-slate-900">{formatCurrency(item.totalAmount)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => router.push(`/stock-in/${item.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Chi tiết
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <TablePagination
          page={page}
          limit={limit}
          total={total}
          itemLabel="phiếu"
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
