"use client"

import * as React from "react"
import { Loader2, Download, TrendingUp, DollarSign, Package, AlertTriangle, ShieldCheck, Calendar, Filter } from "lucide-react"
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
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/utils"
import { isAverageCostMethod } from "@/lib/inventory-cost"
import * as XLSX from "xlsx"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = React.useState("inventory")
  const [isLoading, setIsLoading] = React.useState(false)
  const [reportPage, setReportPage] = React.useState(1)
  const reportLimit = 10

  // Data states
  const [inventoryData, setInventoryData] = React.useState<any[]>([])
  const [inventorySummary, setInventorySummary] = React.useState<any>(null)

  const [stockInData, setStockInData] = React.useState<any[]>([])
  const [stockInSummary, setStockInSummary] = React.useState<any>(null)
  const [stockInFrom, setStockInFrom] = React.useState("")
  const [stockInTo, setStockInTo] = React.useState("")

  const [stockOutData, setStockOutData] = React.useState<any[]>([])
  const [stockOutSummary, setStockOutSummary] = React.useState<any>(null)
  const [stockOutFrom, setStockOutFrom] = React.useState("")
  const [stockOutTo, setStockOutTo] = React.useState("")

  const [warrantyData, setWarrantyData] = React.useState<any[]>([])
  const [warrantySummary, setWarrantySummary] = React.useState<any>(null)

  const [profitData, setProfitData] = React.useState<any[]>([])
  const [profitSummary, setProfitSummary] = React.useState<any>(null)

  const trackingLabels: Record<string, string> = {
    None: "Không quản lý tồn",
    AverageCost: "Bình quân",
    FIFO: "FIFO",
    SerialNumber: "Theo serial",
    LotNumber: "Theo lot/lô",
  }

  const numberTextClass = (value: unknown, baseClass: string, normalColor = "text-slate-900") => {
    return `${baseClass} ${Number(value) < 0 ? "text-red-600" : normalColor}`
  }

  React.useEffect(() => {
    setReportPage(1)
    loadReportData()
  }, [activeTab])

  const paginateReport = (data: any[]) => {
    return data.slice((reportPage - 1) * reportLimit, reportPage * reportLimit)
  }

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      if (activeTab === "inventory") {
        const res = await fetch("/api/reports/inventory")
        const json = await res.json()
        setInventoryData(json.products || [])
        setInventorySummary(json.summary)
      } else if (activeTab === "stock-in") {
        const query = new URLSearchParams({
          ...(stockInFrom && { from: stockInFrom }),
          ...(stockInTo && { to: stockInTo }),
        })
        const res = await fetch(`/api/reports/stock-in?${query.toString()}`)
        const json = await res.json()
        setStockInData(json.stockIns || [])
        setStockInSummary(json.summary)
      } else if (activeTab === "stock-out") {
        const query = new URLSearchParams({
          ...(stockOutFrom && { from: stockOutFrom }),
          ...(stockOutTo && { to: stockOutTo }),
        })
        const res = await fetch(`/api/reports/stock-out?${query.toString()}`)
        const json = await res.json()
        setStockOutData(json.stockOuts || [])
        setStockOutSummary(json.summary)
      } else if (activeTab === "warranty") {
        const res = await fetch("/api/reports/warranty")
        const json = await res.json()
        setWarrantyData(json.records || [])
        setWarrantySummary(json.summary)
      } else if (activeTab === "profit") {
        const res = await fetch("/api/reports/profit")
        const json = await res.json()
        setProfitData(json.data || [])
        setProfitSummary(json.summary)
      }
    } catch (error) {
      console.error(error)
      toast.error("Không thể tải dữ liệu báo cáo")
    } finally {
      setIsLoading(false)
    }
  }

  // Excel exporter
  const handleExportExcel = (dataList: any[], filename: string, headers: Record<string, string>) => {
    try {
      if (!dataList || dataList.length === 0) {
        toast.error("Không có dữ liệu để xuất")
        return
      }

      const ws = XLSX.utils.json_to_sheet(
        dataList.map((row) => {
          const mapped: any = {}
          Object.entries(headers).forEach(([key, label]) => {
            // Support dot notation for nested fields e.g., category.name
            if (key.includes(".")) {
              const keys = key.split(".")
              let val = row
              keys.forEach((k) => {
                val = val ? val[k] : null
              })
              mapped[label] = val || ""
            } else {
              mapped[label] = row[key] ?? ""
            }
          })
          return mapped
        })
      )

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`)
      toast.success(`Xuất file Excel thành công!`)
    } catch (e) {
      console.error(e)
      toast.error("Lỗi khi xuất file Excel")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo thống kê"
        subtitle="Xem và phân tích hoạt động nhập xuất kho và doanh số lợi nhuận"
      />

      <Tabs
        defaultValue="inventory"
        onValueChange={(value) => {
          setActiveTab(value)
          setReportPage(1)
        }}
        className="w-full"
      >
        <TabsList className="bg-slate-100 p-1 border rounded-lg justify-start flex flex-wrap h-auto w-full md:w-max">
          <TabsTrigger value="inventory" className="py-2">Báo cáo Tồn kho</TabsTrigger>
          <TabsTrigger value="stock-in" className="py-2">Nhập kho</TabsTrigger>
          <TabsTrigger value="stock-out" className="py-2">Xuất kho</TabsTrigger>
          <TabsTrigger value="warranty" className="py-2">Bảo hành</TabsTrigger>
          <TabsTrigger value="profit" className="py-2">Lợi nhuận</TabsTrigger>
        </TabsList>

        {/* -------------------- INVENTORY REPORT -------------------- */}
        <TabsContent value="inventory" className="space-y-6 mt-4">
          {inventorySummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600 border border-blue-100 shrink-0">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold block">TỔNG SỐ LƯỢNG TỒN</span>
                  <span className={numberTextClass(inventorySummary.totalQty, "text-2xl font-bold", "text-slate-800")}>{inventorySummary.totalQty.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
                <div className="bg-emerald-50 p-3 rounded-full text-emerald-600 border border-emerald-100 shrink-0">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold block">TỔNG GIÁ TRỊ VỐN</span>
                  <span className={numberTextClass(inventorySummary.totalCostValue, "text-2xl font-bold", "text-blue-700")}>{formatCurrency(inventorySummary.totalCostValue)}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
                <div className="bg-amber-50 p-3 rounded-full text-amber-600 border border-amber-100 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold block">SẢN PHẨM CẦN NHẬP</span>
                  <span className="text-2xl font-bold text-red-600">{inventorySummary.lowStockCount}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="bg-white shadow-sm border"
              onClick={() =>
                handleExportExcel(
                  inventoryData.map((item) => ({
                    ...item,
                    costPrice: isAverageCostMethod(item.trackingMethod) ? item.costPrice : "",
                  })),
                  "BaoCaoTonKho",
                  {
                    sku: "Mã SKU",
                    name: "Tên sản phẩm",
                    "category.name": "Danh mục",
                    trackingMethod: "Phương pháp giá",
                    quantity: "Tồn kho thực tế",
                    minQuantity: "Tồn tối thiểu",
                    costPrice: "Đơn giá vốn",
                    stockValue: "Tổng giá trị tồn",
                    sellingPrice: "Giá bán",
                  }
                )
              }
              disabled={isLoading}
            >
              <Download className="mr-2 h-4 w-4 text-blue-600" />
              Xuất Excel
            </Button>
          </div>

          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>SKU</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Phương pháp giá</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead className="text-right">Giá vốn</TableHead>
                  <TableHead className="text-right">Giá bán</TableHead>
                  <TableHead className="text-right">Tổng giá trị vốn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                    </TableCell>
                  </TableRow>
                ) : inventoryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  paginateReport(inventoryData).map((item) => {
                    const showUnitCost = isAverageCostMethod(item.trackingMethod)
                    const stockValue = Number(item.stockValue || 0)

                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs font-semibold">{item.sku}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-slate-900">{item.name}</span>
                          {item.quantity <= item.minQuantity && (
                            <span className="ml-2 inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                              Cảnh báo hết hàng
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{item.category?.name || "Khác"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="border-none bg-blue-50 text-blue-700">
                            {trackingLabels[item.trackingMethod] || "Bình quân"}
                          </Badge>
                        </TableCell>
                        <TableCell className={numberTextClass(item.quantity, "text-right font-bold", "text-slate-800")}>
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell className={numberTextClass(item.costPrice, "text-right", "text-slate-900")}>
                          {showUnitCost && item.costPrice ? formatCurrency(item.costPrice) : ""}
                        </TableCell>
                        <TableCell className={numberTextClass(item.sellingPrice, "text-right", "text-slate-900")}>{formatCurrency(item.sellingPrice)}</TableCell>
                        <TableCell className={numberTextClass(stockValue, "text-right font-bold", "text-slate-900")}>
                          {formatCurrency(stockValue)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={reportPage}
              limit={reportLimit}
              total={inventoryData.length}
              itemLabel="sản phẩm"
              onPageChange={setReportPage}
            />
          </div>
        </TabsContent>

        {/* -------------------- STOCK IN REPORT -------------------- */}
        <TabsContent value="stock-in" className="space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Từ ngày</label>
              <Input type="date" value={stockInFrom} onChange={(e) => setStockInFrom(e.target.value)} className="bg-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Đến ngày</label>
              <Input type="date" value={stockInTo} onChange={(e) => setStockInTo(e.target.value)} className="bg-white" />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
              setReportPage(1)
              loadReportData()
            }}>
              <Filter className="mr-2 h-4 w-4" /> Lọc báo cáo
            </Button>
            <Button
              variant="outline"
              className="bg-white shadow-sm ml-auto"
              onClick={() =>
                handleExportExcel(stockInData, "BaoCaoNhapKho", {
                  code: "Mã phiếu",
                  "supplier.name": "Nhà cung cấp",
                  importDate: "Ngày nhập",
                  poNumber: "Số PO",
                  contractNumber: "Số hợp đồng",
                  totalAmount: "Tổng số tiền",
                })
              }
              disabled={isLoading}
            >
              <Download className="mr-2 h-4 w-4 text-blue-600" /> Export
            </Button>
          </div>

          {stockInSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <span className="text-slate-500 text-xs font-semibold block">TỔNG GIÁ TRỊ NHẬP HÀNG</span>
                <span className={numberTextClass(stockInSummary.totalAmount, "text-2xl font-bold mt-2", "text-blue-700")}>{formatCurrency(stockInSummary.totalAmount)}</span>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <span className="text-slate-500 text-xs font-semibold block">TỔNG SỐ LƯỢT PHIẾU NHẬP</span>
                <span className="text-2xl font-bold text-slate-800 mt-2">{stockInSummary.count} phiếu</span>
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Nhà cung cấp</TableHead>
                  <TableHead>Ngày nhập</TableHead>
                  <TableHead>Số PO</TableHead>
                  <TableHead className="text-right">Tổng cộng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                    </TableCell>
                  </TableRow>
                ) : stockInData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                      Không tìm thấy dữ liệu trong khoảng thời gian này.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginateReport(stockInData).map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono font-bold text-blue-600">{item.code}</TableCell>
                      <TableCell className="font-medium text-slate-800">{item.supplier?.name}</TableCell>
                      <TableCell>{formatDate(item.importDate)}</TableCell>
                      <TableCell className="font-mono text-xs">{item.poNumber || "-"}</TableCell>
                      <TableCell className={numberTextClass(item.totalAmount, "text-right font-bold", "text-slate-900")}>{formatCurrency(item.totalAmount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={reportPage}
              limit={reportLimit}
              total={stockInData.length}
              itemLabel="phiếu"
              onPageChange={setReportPage}
            />
          </div>
        </TabsContent>

        {/* -------------------- STOCK OUT REPORT -------------------- */}
        <TabsContent value="stock-out" className="space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Từ ngày</label>
              <Input type="date" value={stockOutFrom} onChange={(e) => setStockOutFrom(e.target.value)} className="bg-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Đến ngày</label>
              <Input type="date" value={stockOutTo} onChange={(e) => setStockOutTo(e.target.value)} className="bg-white" />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
              setReportPage(1)
              loadReportData()
            }}>
              <Filter className="mr-2 h-4 w-4" /> Lọc báo cáo
            </Button>
            <Button
              variant="outline"
              className="bg-white shadow-sm ml-auto"
              onClick={() =>
                handleExportExcel(stockOutData, "BaoCaoXuatKho", {
                  code: "Mã phiếu",
                  "customer.name": "Khách hàng",
                  exportDate: "Ngày xuất",
                  poNumber: "Số PO",
                  contractNumber: "Số hợp đồng",
                  totalAmount: "Tổng doanh thu",
                })
              }
              disabled={isLoading}
            >
              <Download className="mr-2 h-4 w-4 text-blue-600" /> Export
            </Button>
          </div>

          {stockOutSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <span className="text-slate-500 text-xs font-semibold block">TỔNG DOANH THU XUẤT HÀNG</span>
                <span className={numberTextClass(stockOutSummary.totalRevenue, "text-2xl font-bold mt-2", "text-blue-700")}>{formatCurrency(stockOutSummary.totalRevenue)}</span>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <span className="text-slate-500 text-xs font-semibold block">TỔNG SỐ LƯỢT XUẤT KHO</span>
                <span className="text-2xl font-bold text-slate-800 mt-2">{stockOutSummary.count} phiếu</span>
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Ngày xuất</TableHead>
                  <TableHead>Số PO</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                    </TableCell>
                  </TableRow>
                ) : stockOutData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                      Không tìm thấy dữ liệu trong khoảng thời gian này.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginateReport(stockOutData).map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono font-bold text-blue-600">{item.code}</TableCell>
                      <TableCell className="font-medium text-slate-800">{item.customer?.name || "Khách lẻ"}</TableCell>
                      <TableCell>{formatDate(item.exportDate)}</TableCell>
                      <TableCell className="font-mono text-xs">{item.poNumber || "-"}</TableCell>
                      <TableCell className={numberTextClass(item.totalAmount, "text-right font-bold", "text-slate-900")}>{formatCurrency(item.totalAmount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={reportPage}
              limit={reportLimit}
              total={stockOutData.length}
              itemLabel="phiếu"
              onPageChange={setReportPage}
            />
          </div>
        </TabsContent>

        {/* -------------------- WARRANTY REPORT -------------------- */}
        <TabsContent value="warranty" className="space-y-6 mt-4">
          {warrantySummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <span className="text-slate-500 text-xs font-semibold block">ĐANG BẢO HÀNH</span>
                <span className="text-2xl font-bold text-green-600 mt-2">{warrantySummary.active} thiết bị</span>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <span className="text-slate-500 text-xs font-semibold block">HẾT BẢO HÀNH</span>
                <span className="text-2xl font-bold text-red-600 mt-2">{warrantySummary.expired} thiết bị</span>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <span className="text-slate-500 text-xs font-semibold block">SẮP HẾT HẠN (30 NGÀY)</span>
                <span className="text-2xl font-bold text-amber-600 mt-2">{warrantySummary.expiringSoon} thiết bị</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="bg-white shadow-sm border"
              onClick={() =>
                handleExportExcel(warrantyData, "BaoCaoBaoHanh", {
                  serialNumber: "Số Serial (S/N)",
                  "product.name": "Sản phẩm",
                  "customer.name": "Khách hàng",
                  startDate: "Ngày bắt đầu",
                  endDate: "Ngày hết hạn",
                  warrantyMonths: "Số tháng bảo hành",
                })
              }
              disabled={isLoading}
            >
              <Download className="mr-2 h-4 w-4 text-blue-600" /> Export Excel
            </Button>
          </div>

          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Ngày xuất bán</TableHead>
                  <TableHead>Ngày hết hạn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                    </TableCell>
                  </TableRow>
                ) : warrantyData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                      Chưa có dữ liệu bảo hành
                    </TableCell>
                  </TableRow>
                ) : (
                  paginateReport(warrantyData).map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono font-medium text-slate-800">{item.serialNumber || "-"}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{item.product?.name}</TableCell>
                      <TableCell>{item.customer?.name}</TableCell>
                      <TableCell>{formatDate(item.startDate)}</TableCell>
                      <TableCell className="font-semibold">{formatDate(item.endDate)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={reportPage}
              limit={reportLimit}
              total={warrantyData.length}
              itemLabel="hồ sơ"
              onPageChange={setReportPage}
            />
          </div>
        </TabsContent>

        {/* -------------------- PROFIT REPORT -------------------- */}
        <TabsContent value="profit" className="space-y-6 mt-4">
          {profitSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <span className="text-slate-500 text-xs font-semibold block">TỔNG DOANH THU XUẤT</span>
                <span className={numberTextClass(profitSummary.totalRevenue, "text-2xl font-bold mt-2", "text-slate-800")}>{formatCurrency(profitSummary.totalRevenue)}</span>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <span className="text-slate-500 text-xs font-semibold block">TỔNG CHI PHÍ NHẬP COGS</span>
                <span className={numberTextClass(profitSummary.totalCost, "text-2xl font-bold mt-2", "text-slate-800")}>{formatCurrency(profitSummary.totalCost)}</span>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <span className="text-slate-500 text-xs font-semibold block">TỔNG LỢI NHUẬN GỘP</span>
                <span className={numberTextClass(profitSummary.totalProfit, "text-2xl font-bold mt-2", "text-green-600")}>
                  {formatCurrency(profitSummary.totalProfit)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="bg-white shadow-sm border"
              onClick={() =>
                handleExportExcel(profitData, "BaoCaoLoiNhuan", {
                  sku: "Mã SKU",
                  name: "Sản phẩm",
                  categoryName: "Danh mục",
                  trackingMethod: "Phương pháp giá",
                  totalQtyImported: "SL Nhập",
                  totalQtySold: "SL Xuất",
                  totalCost: "Tổng vốn nhập",
                  totalRevenue: "Tổng doanh thu",
                  profit: "Lợi nhuận gộp",
                  margin: "Biên lợi nhuận %",
                })
              }
              disabled={isLoading}
            >
              <Download className="mr-2 h-4 w-4 text-blue-600" /> Export Excel
            </Button>
          </div>

          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>SKU</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Phương pháp giá</TableHead>
                  <TableHead className="text-right">SL Nhập</TableHead>
                  <TableHead className="text-right">SL Bán</TableHead>
                  <TableHead className="text-right">Tổng chi phí vốn</TableHead>
                  <TableHead className="text-right">Tổng doanh thu</TableHead>
                  <TableHead className="text-right">Lợi nhuận gộp</TableHead>
                  <TableHead className="text-right">Biên LN (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                    </TableCell>
                  </TableRow>
                ) : profitData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                      Chưa có dữ liệu giao dịch
                    </TableCell>
                  </TableRow>
                ) : (
                  paginateReport(profitData).map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50 text-xs">
                      <TableCell className="font-mono">{item.sku}</TableCell>
                      <TableCell className="font-semibold text-slate-800">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="border-none bg-blue-50 text-blue-700">
                          {trackingLabels[item.trackingMethod] || "Bình quân"}
                        </Badge>
                      </TableCell>
                      <TableCell className={numberTextClass(item.totalQtyImported, "text-right", "text-slate-900")}>{item.totalQtyImported}</TableCell>
                      <TableCell className={numberTextClass(item.totalQtySold, "text-right font-medium", "text-blue-600")}>{item.totalQtySold}</TableCell>
                      <TableCell className={numberTextClass(item.totalCost, "text-right", "text-slate-600")}>{formatCurrency(item.totalCost)}</TableCell>
                      <TableCell className={numberTextClass(item.totalRevenue, "text-right font-semibold", "text-slate-800")}>{formatCurrency(item.totalRevenue)}</TableCell>
                      <TableCell className={numberTextClass(item.profit, "text-right font-bold", "text-green-700")}>{formatCurrency(item.profit)}</TableCell>
                      <TableCell className={numberTextClass(item.margin, "text-right font-bold", "text-slate-900")}>{item.margin.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={reportPage}
              limit={reportLimit}
              total={profitData.length}
              itemLabel="dòng"
              onPageChange={setReportPage}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
