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
          { customer: { name: { contains: search } } },
        ]
      })
    }

    const [total, stockOuts] = await Promise.all([
      prisma.stockOut.count({ where: whereClause }),
      prisma.stockOut.findMany({
        where: whereClause,
        include: {
          customer: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, fullName: true } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      })
    ])

    return NextResponse.json({
      data: stockOuts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("StockOut API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id as string

    const body = await req.json()
    const { customerId, exportDate, poNumber, contractNumber, notes, items, status } = body

    if (!customerId || !items || !items.length) {
      return NextResponse.json({ error: "Customer and items are required" }, { status: 400 })
    }

    // Run in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Validate inventory first
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) throw new Error(`Product ${item.productId} not found`)
        if (product.quantity < Number(item.quantity)) {
          throw new Error(`Insufficient quantity for ${product.name}. Required: ${item.quantity}, Available: ${product.quantity}`)
        }
      }

      // Calculate total amount
      const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0)

      // Generate code PX-YYYYMM-NNNN
      const date = new Date(exportDate || Date.now())
      const currentYear = date.getFullYear()
      const currentMonth = (date.getMonth() + 1).toString().padStart(2, "0")
      const prefix = `PX-${currentYear}${currentMonth}-`
      const count = await tx.stockOut.count({
        where: { code: { startsWith: prefix } }
      })
      const code = `${prefix}${(count + 1).toString().padStart(4, "0")}`

      // Create StockOut record
      const stockOut = await tx.stockOut.create({
        data: {
          code,
          customerId,
          exportDate: new Date(exportDate),
          poNumber,
          contractNumber,
          totalAmount,
          notes,
          status: status === "COMPLETED" ? "CONFIRMED" : (status || "CONFIRMED"),
          createdById: userId,
          items: {
            create: items.map((item: any) => {
              const warrantyStartDate = item.warrantyStartDate ? new Date(item.warrantyStartDate) : new Date(exportDate)
              const warrantyEndDate = new Date(warrantyStartDate)
              warrantyEndDate.setMonth(warrantyEndDate.getMonth() + Number(item.warrantyMonths || 12))

              return {
                productId: item.productId,
                serialNumber: item.serialNumber,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.unitPrice) * Number(item.quantity),
                warrantyMonths: Number(item.warrantyMonths || 12),
                warrantyStartDate,
                warrantyEndDate,
                notes: item.notes,
              }
            })
          }
        },
        include: { items: true }
      })

      if (status !== "DRAFT" && status !== "CANCELLED") {
        // Update products and create transactions and warranties
        for (const item of stockOut.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } })
          if (!product) throw new Error(`Product ${item.productId} not found`)

          // Decrement quantity
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } }
          })

          // Create inventory transaction
          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              type: "STOCK_OUT",
              quantity: item.quantity,
              balanceBefore: product.quantity,
              balanceAfter: product.quantity - item.quantity,
              referenceId: stockOut.id,
              referenceCode: stockOut.code,
              notes: "Xuất kho bán hàng",
            }
          })

          // Create warranty record if applicable
          if (item.warrantyMonths > 0 && item.warrantyStartDate && item.warrantyEndDate) {
            await tx.warrantyRecord.create({
              data: {
                productId: item.productId,
                customerId: customerId,
                stockOutItemId: item.id,
                serialNumber: item.serialNumber,
                warrantyMonths: item.warrantyMonths,
                startDate: item.warrantyStartDate,
                endDate: item.warrantyEndDate,
                status: "ACTIVE"
              }
            })
          }
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: "CREATE",
          module: "STOCK_OUT",
          targetId: stockOut.id,
          targetName: stockOut.code,
        }
      })

      return stockOut
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("StockOut create error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
