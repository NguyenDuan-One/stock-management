import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateInventoryValue } from "@/lib/inventory-cost"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        stockInItems: {
          include: { stockIn: { select: { status: true } } },
          orderBy: { createdAt: "asc" },
        },
        stockOutItems: {
          include: { stockOut: { select: { status: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { quantity: "desc" }
    })

    const productsWithValue = products.map((product) => ({
      ...product,
      stockValue: calculateInventoryValue(product),
    }))

    const summary = productsWithValue.reduce(
      (acc, p) => {
        acc.totalQty += p.quantity
        acc.totalCostValue += Number(p.stockValue || 0)
        acc.totalSellValue += p.quantity * Number(p.sellingPrice || 0)
        if (p.quantity <= p.minQuantity) acc.lowStockCount++
        return acc
      },
      { totalQty: 0, totalCostValue: 0, totalSellValue: 0, lowStockCount: 0 }
    )

    return NextResponse.json({ products: productsWithValue, summary })
  } catch (error) {
    console.error("Inventory report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
