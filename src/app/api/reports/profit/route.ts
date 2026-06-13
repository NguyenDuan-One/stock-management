import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        stockInItems: {
          where: { stockIn: { status: "CONFIRMED" } },
          select: { quantity: true, unitPrice: true }
        },
        stockOutItems: {
          where: { stockOut: { status: "CONFIRMED" } },
          select: { quantity: true, unitPrice: true }
        }
      }
    })

    const data = products.map((p) => {
      const totalImportedCost = p.stockInItems.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0)
      const totalRevenue = p.stockOutItems.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0)
      const totalQtySold = p.stockOutItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalQtyImported = p.stockInItems.reduce((sum, item) => sum + item.quantity, 0)
      const averageCostPrice = totalQtyImported > 0 ? totalImportedCost / totalQtyImported : Number(p.costPrice || 0)
      const totalCost = totalQtySold * averageCostPrice
      const profit = totalRevenue - totalCost
      const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        categoryName: p.category?.name || "Khác",
        totalQtyImported,
        totalQtySold,
        totalCost,
        totalRevenue,
        profit,
        margin
      }
    })

    const summary = data.reduce(
      (acc, item) => {
        acc.totalCost += item.totalCost
        acc.totalRevenue += item.totalRevenue
        acc.totalProfit += item.profit
        return acc
      },
      { totalCost: 0, totalRevenue: 0, totalProfit: 0 }
    )

    return NextResponse.json({ data, summary })
  } catch (error) {
    console.error("Profit report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
