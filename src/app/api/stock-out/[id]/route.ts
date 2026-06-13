import { NextRequest, NextResponse } from "next/server"
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
