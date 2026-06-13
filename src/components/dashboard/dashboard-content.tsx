"use client"

import { useEffect, useState } from "react"
import { StatsCards } from "./stats-cards"
import { DashboardCharts } from "./charts"
import { RecentTransactions } from "./recent-transactions"
import { LowStockAlert } from "./low-stock-alert"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardContent() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <StatsCards data={data} />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardCharts data={data.monthlyData} />
        </div>
        <div>
          <LowStockAlert items={data.lowStockList} count={data.lowStockCount} />
        </div>
      </div>

      <RecentTransactions 
        stockIn={data.recentStockIn} 
        stockOut={data.recentStockOut} 
      />
    </div>
  )
}
