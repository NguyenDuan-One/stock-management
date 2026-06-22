import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateInventoryValue, isAverageCostMethod } from "@/lib/inventory-cost"

const TRACKING_METHODS = ["None", "AverageCost", "FIFO", "SerialNumber", "LotNumber"]

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    
    const skip = (page - 1) * limit

    const whereClause: any = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { serialNumber: { contains: search } },
          { barcode: { contains: search } },
        ]
      }),
      ...(categoryId && { categoryId }),
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: { select: { id: true, name: true } },
          stockInItems: {
            include: { stockIn: { select: { status: true } } },
            orderBy: { createdAt: "asc" },
          },
          stockOutItems: {
            include: { stockOut: { select: { status: true } } },
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: {
              stockInItems: true,
              stockOutItems: true,
              inventoryTransactions: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      })
    ])

    const productsWithValue = products.map((product) => ({
      ...product,
      
      stockValue: calculateInventoryValue(product),
    }))

    return NextResponse.json({
      data: productsWithValue,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Products API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const body = await req.json()
    const { 
      name, sku, categoryId, unit, description, 
      minQuantity, costPrice, sellingPrice, barcode, serialNumber, trackingMethod
    } = body

    if (!name || !sku) {
      return NextResponse.json({ error: "Name and SKU are required" }, { status: 400 })
    }

    if (!trackingMethod || !TRACKING_METHODS.includes(trackingMethod)) {
      return NextResponse.json({ error: "Vui lòng chọn phương pháp tính giá tồn" }, { status: 400 })
    }

    const existingSku = await prisma.product.findUnique({ where: { sku } })
    if (existingSku) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        categoryId,
        unit: unit || "cái",
        description,
        minQuantity: parseInt(minQuantity || "0"),
        costPrice: costPrice ? parseFloat(costPrice) : null,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
        barcode,
        serialNumber,
        trackingMethod,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: "CREATE",
        module: "PRODUCTS",
        targetId: product.id,
        targetName: product.name,
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Products API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
