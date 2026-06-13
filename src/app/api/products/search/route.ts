import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")
    
    if (!query) {
      return NextResponse.json({ data: [] })
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { barcode: query },
          { serialNumber: query },
          { sku: query }
        ]
      },
      include: {
        category: { select: { id: true, name: true } }
      },
      take: 1
    })

    if (products.length === 0) {
      return NextResponse.json(null, { status: 404 })
    }

    return NextResponse.json(products[0])
  } catch (error) {
    console.error("Products Search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
