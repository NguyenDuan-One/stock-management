"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react"

interface RecentTransactionsProps {
  stockIn: any[]
  stockOut: any[]
}

export function RecentTransactions({ stockIn, stockOut }: RecentTransactionsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="success">Hoàn thành</Badge>
      case "DRAFT":
        return <Badge variant="secondary">Nháp</Badge>
      case "CANCELLED":
        return <Badge variant="destructive">Đã hủy</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4 text-blue-500" />
              Phiếu nhập gần đây
            </CardTitle>
            <CardDescription>Các giao dịch nhập hàng mới nhất</CardDescription>
          </div>
          <Link href="/stock-in" className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center gap-1">
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mt-4">
            {stockIn.length === 0 ? (
              <div className="text-center py-4 text-sm text-slate-500">Chưa có dữ liệu</div>
            ) : (
              stockIn.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-slate-900">{item.code}</p>
                    <p className="text-xs text-slate-500">
                      {item.supplier?.name} • {formatDate(item.importDate)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(item.totalAmount)}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              Phiếu xuất gần đây
            </CardTitle>
            <CardDescription>Các giao dịch bán hàng mới nhất</CardDescription>
          </div>
          <Link href="/stock-out" className="text-sm font-medium text-emerald-600 hover:text-emerald-500 flex items-center gap-1">
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mt-4">
            {stockOut.length === 0 ? (
              <div className="text-center py-4 text-sm text-slate-500">Chưa có dữ liệu</div>
            ) : (
              stockOut.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-slate-900">{item.code}</p>
                    <p className="text-xs text-slate-500">
                      {item.customer?.name} • {formatDate(item.exportDate)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(item.totalAmount)}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
