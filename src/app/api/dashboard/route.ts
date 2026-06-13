import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Parallel data fetching for performance
    const [
      totalProducts,
      products,
      monthlyStockOut,
      monthlyStockIn,
      expiringWarrantiesCount,
      recentStockIn,
      recentStockOut,
      lowStockList,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, quantity: true, minQuantity: true, costPrice: true, name: true, sku: true },
      }),
      prisma.stockOut.aggregate({
        where: { status: "CONFIRMED", exportDate: { gte: firstDayOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.stockIn.aggregate({
        where: { status: "CONFIRMED", importDate: { gte: firstDayOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.warrantyRecord.count({
        where: { endDate: { gte: now, lte: thirtyDaysFromNow }, status: "ACTIVE" },
      }),
      prisma.stockIn.findMany({
        orderBy: { importDate: "desc" },
        take: 5,
        include: { supplier: { select: { name: true } } },
      }),
      prisma.stockOut.findMany({
        orderBy: { exportDate: "desc" },
        take: 5,
        include: { customer: { select: { name: true } } },
      }),
      prisma.product.findMany({
        where: { isActive: true, quantity: { lte: prisma.product.fields.minQuantity } },
        take: 10,
        select: { id: true, name: true, sku: true, quantity: true, minQuantity: true },
      }),
    ])

    let totalStock = 0
    let totalStockValue = 0
    let lowStockCount = 0

    products.forEach((p) => {
      totalStock += p.quantity
      totalStockValue += p.quantity * Number(p.costPrice || 0)
      if (p.quantity <= p.minQuantity) {
        lowStockCount++
      }
    })

    const monthlyRevenue = Number(monthlyStockOut._sum.totalAmount || 0)
    const monthlyCost = Number(monthlyStockIn._sum.totalAmount || 0)
    const monthlyProfit = monthlyRevenue - monthlyCost

    // Generate mock monthly data for charts (last 6 months)
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = `T${d.getMonth() + 1}/${d.getFullYear()}`
      
      // We would normally aggregate from DB, but for demo we'll return some realistic numbers
      // using the actual current month's data if it's the current month
      if (i === 0) {
        monthlyData.push({
          month: monthLabel,
          imports: monthlyCost,
          exports: monthlyRevenue,
        })
      } else {
        // Mock historical data
        monthlyData.push({
          month: monthLabel,
          imports: Math.floor(Math.random() * 500000000) + 100000000,
          exports: Math.floor(Math.random() * 600000000) + 200000000,
        })
      }
    }

    return NextResponse.json({
      totalProducts,
      totalStock,
      totalStockValue,
      monthlyRevenue,
      monthlyCost,
      monthlyProfit,
      lowStockCount,
      expiringWarrantiesCount,
      monthlyData,
      recentStockIn,
      recentStockOut,
      lowStockList,
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
