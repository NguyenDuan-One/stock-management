import { NextRequest, NextResponse } from "next/server"
import { StockInStatus, StockOutStatus } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get("productId")
    const serial = searchParams.get("serial")?.trim()

    if (!productId || !serial) {
      return NextResponse.json({ error: "Product and serial are required", available: false }, { status: 400 })
    }

    const stockInItem = await prisma.stockInItem.findFirst({
      where: {
        productId,
        serialNumber: serial,
        stockIn: { status: StockInStatus.CONFIRMED },
      },
      select: { id: true },
    })

    if (!stockInItem) {
      return NextResponse.json(
        { error: "Serial này chưa được nhập kho cho SKU đang chọn", available: false },
        { status: 404 }
      )
    }

    const stockOutItem = await prisma.stockOutItem.findFirst({
      where: {
        productId,
        serialNumber: serial,
        stockOut: { status: { not: StockOutStatus.CANCELLED } },
      },
      include: {
        stockOut: { select: { code: true, status: true } },
      },
    })

    if (stockOutItem) {
      return NextResponse.json(
        { error: `Serial này đã xuất ở phiếu ${stockOutItem.stockOut.code}`, available: false },
        { status: 409 }
      )
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error("Serial check API error:", error)
    return NextResponse.json({ error: "Internal server error", available: false }, { status: 500 })
  }
}
