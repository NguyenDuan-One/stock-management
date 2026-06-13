import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const customerId = searchParams.get("customerId")

    const whereClause: any = {
      status: "CONFIRMED",
      ...(customerId && { customerId }),
      ...((from || to) && {
        exportDate: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        }
      })
    }

    const stockOuts = await prisma.stockOut.findMany({
      where: whereClause,
      include: {
        customer: { select: { name: true, code: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true, unit: true } }
          }
        }
      },
      orderBy: { exportDate: "desc" }
    })

    const summary = stockOuts.reduce(
      (acc, item) => {
        acc.totalRevenue += item.totalAmount
        acc.totalItems += item.items.reduce((sum, i) => sum + i.quantity, 0)
        acc.count++
        return acc
      },
      { totalRevenue: 0, totalItems: 0, count: 0 }
    )

    return NextResponse.json({ stockOuts, summary })
  } catch (error) {
    console.error("Stock-out report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
