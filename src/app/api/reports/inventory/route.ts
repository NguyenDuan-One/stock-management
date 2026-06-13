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
        category: { select: { name: true } }
      },
      orderBy: { quantity: "desc" }
    })

    const summary = products.reduce(
      (acc, p) => {
        acc.totalQty += p.quantity
        acc.totalCostValue += p.quantity * (p.costPrice || 0)
        acc.totalSellValue += p.quantity * (p.sellingPrice || 0)
        if (p.quantity <= p.minQuantity) acc.lowStockCount++
        return acc
      },
      { totalQty: 0, totalCostValue: 0, totalSellValue: 0, lowStockCount: 0 }
    )

    return NextResponse.json({ products, summary })
  } catch (error) {
    console.error("Inventory report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
