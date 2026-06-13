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
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Đã hoàn thành</Badge>
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
            placeholder="Tìm theo Mã phiếu, Số PO, Số hợp đồng, Nhà cung cấp..."
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
              <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead>Mã phiếu</TableHead>
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead>Ngày nhập</TableHead>
              <TableHead>Thông tin PO/HĐ</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Người tạo</TableHead>
              <TableHead className="w-[100px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                  <span className="mt-2 block text-xs">Đang tải dữ liệu...</span>
                </TableCell>
              </TableRow>
            ) : stockIns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500">
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

      {total > limit && (
        <div className="flex items-center justify-between py-2">
          <div className="text-sm text-slate-500">
            Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)} trong {total} phiếu
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
    </div>
  )
}
