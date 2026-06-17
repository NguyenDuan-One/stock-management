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
    const supplierId = searchParams.get("supplierId")

    const whereClause: any = {
      status: "COMPLETED",
      ...(supplierId && { supplierId }),
      ...((from || to) && {
        importDate: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        }
      })
    }

    const stockIns = await prisma.stockIn.findMany({
      where: whereClause,
      include: {
        supplier: { select: { name: true, code: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true, unit: true } }
          }
        }
      },
      orderBy: { importDate: "desc" }
    })

    const summary = stockIns.reduce(
      (acc, item) => {
        acc.totalAmount += Number(item.totalAmount)
        acc.totalItems += item.items.reduce((sum, i) => sum + i.quantity, 0)
        acc.count++
        return acc
      },
      { totalAmount: 0, totalItems: 0, count: 0 }
    )

    return NextResponse.json({ stockIns, summary })
  } catch (error) {
    console.error("Stock-in report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
