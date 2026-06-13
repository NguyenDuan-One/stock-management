"use client"

import Link from "next/link"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface LowStockItem {
  id: string
  name: string
  sku: string
  quantity: number
  minQuantity: number
}

interface LowStockAlertProps {
  items: LowStockItem[]
  count: number
}

export function LowStockAlert({ items, count }: LowStockAlertProps) {
  return (
    <Card className="h-full border-red-100 shadow-sm">
      <CardHeader className="bg-red-50/50 pb-4 border-b border-red-50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Cảnh báo hết hàng
            </CardTitle>
            <CardDescription className="text-red-600/80">
              {count > 0 
                ? `Có ${count} sản phẩm dưới mức tồn tối thiểu` 
                : "Không có sản phẩm nào sắp hết hàng"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100 max-h-[360px] overflow-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Tồn kho đang ở mức an toàn
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-slate-900 truncate" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{item.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-red-600">
                    {item.quantity} <span className="text-xs font-normal text-slate-500">/ {item.minQuantity}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase mt-0.5">Tồn kho</p>
                </div>
              </div>
            ))
          )}
        </div>
        
        {count > items.length && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <Button variant="link" asChild className="h-auto p-0 text-xs text-blue-600">
              <Link href="/inventory?filter=low_stock">
                Xem thêm {count - items.length} sản phẩm khác <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
