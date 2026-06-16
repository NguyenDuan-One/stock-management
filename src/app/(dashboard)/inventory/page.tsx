"use client"

import * as React from "react"
import { Search, Loader2, AlertTriangle } from "lucide-react"
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
import { PageHeader } from "@/components/ui/page-header"
import { TablePagination } from "@/components/ui/table-pagination"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

export default function InventoryPage() {
  const [products, setProducts] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [filterLowStock, setFilterLowStock] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const limit = 10

  React.useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/products?limit=1000")
      const json = await res.json()
      setProducts(json.data || [])
    } catch (error) {
      console.error(error)
      toast.error("Không thể tải danh sách tồn kho")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.sku.toLowerCase().includes(search.toLowerCase()) ||
      (prod.barcode && prod.barcode.includes(search))
    
    if (filterLowStock) {
      return matchesSearch && prod.quantity <= prod.minQuantity
    }
    return matchesSearch
  })
  const paginatedProducts = filteredProducts.slice((page - 1) * limit, page * limit)

  // Calculate totals
  const totalItems = filteredProducts.reduce((sum, p) => sum + p.quantity, 0)
  const totalValue = filteredProducts.reduce((sum, p) => sum + p.quantity * (p.costPrice || 0), 0)
  const lowStockCount = products.filter((p) => p.quantity <= p.minQuantity).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý tồn kho"
        subtitle="Theo dõi số lượng thiết bị thực tế đang lưu kho"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="text-sm text-slate-500 font-medium">Tổng số lượng tồn kho</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {totalItems.toLocaleString()} <span className="text-sm font-normal text-slate-500">sản phẩm</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="text-sm text-slate-500 font-medium">Tổng giá trị tồn kho (Giá vốn)</div>
          <div className="text-2xl font-bold text-blue-700 mt-2">
            {formatCurrency(totalValue)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500 font-medium">Sản phẩm sắp hết hàng</div>
            <div className={`text-2xl font-bold mt-2 ${lowStockCount > 0 ? "text-red-600" : "text-slate-900"}`}>
              {lowStockCount} <span className="text-sm font-normal text-slate-500">mặt hàng</span>
            </div>
          </div>
          {lowStockCount > 0 && (
            <div className="bg-red-50 p-3 rounded-full text-red-600 border border-red-100">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo Tên, SKU, Barcode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9 bg-white"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            variant={filterLowStock ? "default" : "outline"}
            className={filterLowStock ? "bg-red-600 hover:bg-red-700 text-white" : ""}
            onClick={() => {
              setFilterLowStock(!filterLowStock)
              setPage(1)
            }}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Cảnh báo hết hàng ({lowStockCount})
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead className="text-right">Tồn kho thực tế</TableHead>
              <TableHead className="text-right">Tồn tối thiểu</TableHead>
              <TableHead className="text-right">Đơn giá vốn</TableHead>
              <TableHead className="text-right">Tổng giá trị tồn</TableHead>
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
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  Không tìm thấy sản phẩm nào.
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((prod) => {
                const isWarning = prod.quantity <= prod.minQuantity
                const itemTotalValue = prod.quantity * (prod.costPrice || 0)
                
                return (
                  <TableRow key={prod.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="font-semibold text-slate-900">{prod.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">SKU: {prod.sku}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-700">
                        {prod.category?.name || "Khác"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-800">
                      {prod.quantity} {prod.unit || "cái"}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {prod.minQuantity} {prod.unit || "cái"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {prod.costPrice ? formatCurrency(prod.costPrice) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      {formatCurrency(itemTotalValue)}
                    </TableCell>
                    <TableCell>
                      {prod.quantity <= 0 ? (
                        <Badge className="bg-red-50 text-red-700 border-red-200">Hết hàng</Badge>
                      ) : isWarning ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200">Cần nhập hàng</Badge>
                      ) : (
                        <Badge className="bg-green-50 text-green-700 border-green-200">Đầy đủ</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          limit={limit}
          total={filteredProducts.length}
          itemLabel="sản phẩm"
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
