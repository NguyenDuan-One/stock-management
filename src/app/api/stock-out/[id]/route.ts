import { NextRequest, NextResponse } from "next/server"
import { StockInStatus, StockOutStatus } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Resolve params explicitly to satisfy Next.js 15 route requirements
    const resolvedParams = await Promise.resolve(params)
    const id = resolvedParams.id

    const stockOut = await prisma.stockOut.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, fullName: true, username: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, unit: true, category: { select: { name: true } } }
            }
          }
        }
      }
    })

    if (!stockOut) {
      return NextResponse.json({ error: "Không tìm thấy phiếu xuất kho" }, { status: 404 })
    }

    return NextResponse.json(stockOut)
  } catch (error) {
    console.error("GET StockOut details error:", error)
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const resolvedParams = await Promise.resolve(params)
    const id = resolvedParams.id

    const body = await req.json()
    const { notes, poNumber, contractNumber } = body

    const stockOut = await prisma.stockOut.findUnique({ where: { id } })
    if (!stockOut) return NextResponse.json({ error: "Not found" }, { status: 404 })
    
    if (stockOut.status === "CANCELLED") {
      return NextResponse.json({ error: "Không thể sửa phiếu đã hủy" }, { status: 400 })
    }

    const updated = await prisma.stockOut.update({
      where: { id },
      data: {
        notes,
        poNumber,
        contractNumber,
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("StockOut API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id as string

    const resolvedParams = await Promise.resolve(params)
    const id = resolvedParams.id
    const body = await req.json().catch(() => ({}))

    if (body.action !== "APPROVE") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const stockOut = await tx.stockOut.findUnique({
        where: { id },
        include: { items: true }
      })

      if (!stockOut) throw new Error("Stock-out not found")
      if (stockOut.status !== StockOutStatus.DRAFT) {
        throw new Error("Only draft stock-out can be approved")
      }

      for (const item of stockOut.items) {
        const serialNumber = String(item.serialNumber || "").trim()
        if (!serialNumber) throw new Error("Serial number is required for every stock-out item")

        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) throw new Error(`Product ${item.productId} not found`)
        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient quantity for ${product.name}. Required: ${item.quantity}, Available: ${product.quantity}`)
        }

        const stockInItem = await tx.stockInItem.findFirst({
          where: {
            productId: item.productId,
            serialNumber,
            stockIn: { status: StockInStatus.CONFIRMED },
          },
          select: { id: true },
        })
        if (!stockInItem) {
          throw new Error(`Serial ${serialNumber} has not been stocked in for ${product.sku}`)
        }

        const existingStockOutItem = await tx.stockOutItem.findFirst({
          where: {
            productId: item.productId,
            serialNumber,
            stockOutId: { not: stockOut.id },
            stockOut: { status: { not: StockOutStatus.CANCELLED } },
          },
          include: { stockOut: { select: { code: true } } },
        })
        if (existingStockOutItem) {
          throw new Error(`Serial ${serialNumber} was already stocked out in ${existingStockOutItem.stockOut.code}`)
        }
      }

      const approved = await tx.stockOut.update({
        where: { id },
        data: { status: StockOutStatus.CONFIRMED },
        include: { items: true }
      })

      for (const item of approved.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) throw new Error(`Product ${item.productId} not found`)

        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } }
        })

        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            type: "STOCK_OUT",
            quantity: item.quantity,
            balanceBefore: product.quantity,
            balanceAfter: product.quantity - item.quantity,
            referenceId: approved.id,
            referenceCode: approved.code,
            notes: "Approve draft stock-out",
          }
        })

        if (item.warrantyMonths > 0 && item.warrantyStartDate && item.warrantyEndDate) {
          await tx.warrantyRecord.create({
            data: {
              productId: item.productId,
              customerId: approved.customerId,
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

      await tx.auditLog.create({
        data: {
          userId,
          action: "APPROVE",
          module: "STOCK_OUT",
          targetId: approved.id,
          targetName: approved.code,
        }
      })

      return approved
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error("StockOut approve error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id as string

    const resolvedParams = await Promise.resolve(params)
    const id = resolvedParams.id

    const stockOut = await prisma.stockOut.findUnique({ 
      where: { id },
      include: { items: true }
    })
    
    if (!stockOut) return NextResponse.json({ error: "Không tìm thấy phiếu" }, { status: 404 })
    
    if (stockOut.status === "CANCELLED") {
      return NextResponse.json({ error: "Phiếu này đã bị hủy" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.stockOut.update({
        where: { id },
        data: { status: "CANCELLED" }
      })

      // Revert stock if it was confirmed/completed
      if (stockOut.status === "CONFIRMED") {
        for (const item of stockOut.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } })
          if (!product) throw new Error(`Product ${item.productId} not found`)
          const nextQuantity = product.quantity + item.quantity

          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { increment: item.quantity } }
          })
          
          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              type: "STOCK_IN", 
              quantity: item.quantity,
              balanceBefore: product.quantity,
              balanceAfter: nextQuantity,
              referenceId: cancelled.id,
              referenceCode: cancelled.code,
              notes: `Hoàn kho do hủy phiếu xuất ${cancelled.code}`,
            }
          })
        }

        // Delete/void warranty records created for this stock out
        const itemIds = stockOut.items.map((item) => item.id)
        if (itemIds.length > 0) {
          await tx.warrantyRecord.deleteMany({
            where: { stockOutItemId: { in: itemIds } }
          })
        }
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: "CANCEL",
          module: "STOCK_OUT",
          targetId: cancelled.id,
          targetName: cancelled.code,
        }
      })

      return cancelled
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("StockOut DELETE error:", error)
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 })
  }
}
