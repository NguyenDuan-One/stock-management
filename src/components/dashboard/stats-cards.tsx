"use client"

import {
  Package,
  Warehouse,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { formatCurrency, numberWithCommas } from "@/lib/utils"

interface StatsCardsProps {
  data: {
    totalProducts: number
    totalStock: number
    totalStockValue: number
    monthlyRevenue: number
    lowStockCount: number
    expiringWarrantiesCount: number
  }
}

export function StatsCards({ data }: StatsCardsProps) {
  const cards = [
    {
      title: "Tổng sản phẩm",
      value: numberWithCommas(data.totalProducts),
      icon: Package,
      gradient: "gradient-blue",
      textColor: "text-blue-600",
      description: "Sản phẩm đang kinh doanh",
    },
    {
      title: "Tổng tồn kho",
      value: numberWithCommas(data.totalStock),
      icon: Warehouse,
      gradient: "gradient-green",
      textColor: "text-emerald-600",
      description: "Tổng số lượng trong kho",
    },
    {
      title: "Giá trị tồn kho",
      value: formatCurrency(data.totalStockValue),
      icon: DollarSign,
      gradient: "gradient-purple",
      textColor: "text-purple-600",
      description: "Tổng giá trị vốn hiện tại",
    },
    {
      title: "Đã bán tháng này",
      value: formatCurrency(data.monthlyRevenue),
      icon: TrendingUp,
      gradient: "gradient-orange",
      textColor: "text-orange-600",
      description: "Doanh thu xuất kho",
    },
    {
      title: "Sắp hết hàng",
      value: data.lowStockCount,
      icon: AlertTriangle,
      gradient: "gradient-red",
      textColor: "text-red-600",
      description: "Sản phẩm dưới mức tối thiểu",
    },
    {
      title: "BH sắp hết hạn",
      value: data.expiringWarrantiesCount,
      icon: Clock,
      gradient: "gradient-yellow",
      textColor: "text-yellow-600",
      description: "Trong vòng 30 ngày tới",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <div key={index} className="stat-card flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${card.gradient}`}>
            <card.icon className={`h-6 w-6 ${card.textColor}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{card.title}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{card.value}</h3>
            <p className="text-xs text-slate-400 mt-1">{card.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
