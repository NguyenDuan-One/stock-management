import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    
    const skip = (page - 1) * limit

    const whereClause: any = {
      ...(search && {
        OR: [
          { code: { contains: search } },
          { poNumber: { contains: search } },
          { contractNumber: { contains: search } },
          { supplier: { name: { contains: search } } },
        ]
      })
    }

    const [total, stockIns] = await Promise.all([
      prisma.stockIn.count({ where: whereClause }),
      prisma.stockIn.findMany({
        where: whereClause,
        include: {
          supplier: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, fullName: true } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      })
    ])

    return NextResponse.json({
      data: stockIns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("StockIn API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id as string

    const body = await req.json()
    const { supplierId, importDate, poNumber, contractNumber, notes, items, status } = body

    if (!supplierId || !items || !items.length) {
      return NextResponse.json({ error: "Supplier and items are required" }, { status: 400 })
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0)

    // Run in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate code PN-YYYYMM-NNNN
      const date = new Date(importDate || Date.now())
      const currentYear = date.getFullYear()
      const currentMonth = (date.getMonth() + 1).toString().padStart(2, "0")
      const prefix = `PN-${currentYear}${currentMonth}-`
      const count = await tx.stockIn.count({
        where: { code: { startsWith: prefix } }
      })
      const code = `${prefix}${(count + 1).toString().padStart(4, "0")}`

      // 2. Create StockIn record
      const stockIn = await tx.stockIn.create({
        data: {
          code,
          supplierId,
          importDate: new Date(importDate),
          poNumber,
          contractNumber,
          totalAmount,
          notes,
          status: status === "COMPLETED" ? "CONFIRMED" : (status || "CONFIRMED"),
          createdById: userId,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              serialNumber: item.serialNumber,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.unitPrice) * Number(item.quantity),
              warrantyMonths: Number(item.warrantyMonths || 12),
              notes: item.notes,
            }))
          }
        },
        include: { items: true }
      })

      if (status !== "DRAFT" && status !== "CANCELLED") {
        // 3. Update products and create transactions
        for (const item of items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } })
          if (!product) throw new Error(`Product ${item.productId} not found`)

          const itemQuantity = Number(item.quantity)
          const itemUnitPrice = Number(item.unitPrice)
          const currentQuantity = product.quantity
          const currentCostPrice = Number(product.costPrice || 0)
          const nextQuantity = currentQuantity + itemQuantity
          const nextCostPrice = nextQuantity > 0
            ? ((currentQuantity * currentCostPrice) + (itemQuantity * itemUnitPrice)) / nextQuantity
            : itemUnitPrice

          // Increment quantity and update moving average cost price
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: { increment: itemQuantity },
              costPrice: nextCostPrice,
            }
          })

          // Create inventory transaction
          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              type: "STOCK_IN",
              quantity: itemQuantity,
              balanceBefore: currentQuantity,
              balanceAfter: nextQuantity,
              referenceId: stockIn.id,
              referenceCode: stockIn.code,
              notes: "Nhập kho",
            }
          })
        }
      }

      // 4. Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: "CREATE",
          module: "STOCK_IN",
          targetId: stockIn.id,
          targetName: stockIn.code,
        }
      })

      return stockIn
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("StockIn create error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
