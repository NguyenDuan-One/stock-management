import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const resolvedParams = await Promise.resolve(params)
    const id = resolvedParams.id

    const stockIn = await prisma.stockIn.findUnique({
      where: { id },
      include: {
        supplier: true,
        createdBy: { select: { id: true, fullName: true, username: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } }
          }
        }
      }
    })

    if (!stockIn) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json(stockIn)
  } catch (error) {
    console.error("StockIn API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const resolvedParams = await Promise.resolve(params)
    const id = resolvedParams.id

    const body = await req.json()
    const { notes, poNumber, contractNumber } = body

    const stockIn = await prisma.stockIn.findUnique({ where: { id } })
    if (!stockIn) return NextResponse.json({ error: "Not found" }, { status: 404 })
    
    if (stockIn.status === "CANCELLED") {
      return NextResponse.json({ error: "Không thể sửa phiếu đã hủy" }, { status: 400 })
    }

    const updated = await prisma.stockIn.update({
      where: { id },
      data: {
        notes,
        poNumber,
        contractNumber,
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("StockIn API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const resolvedParams = await Promise.resolve(params)
    const id = resolvedParams.id

    const stockIn = await prisma.stockIn.findUnique({ 
      where: { id },
      include: { items: true }
    })
    
    if (!stockIn) return NextResponse.json({ error: "Not found" }, { status: 404 })
    
    if (stockIn.status === "CANCELLED") {
      return NextResponse.json({ error: "Phiếu này đã bị hủy" }, { status: 400 })
    }

    // Cancel stock-in
    const result = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.stockIn.update({
        where: { id },
        data: { status: "CANCELLED" }
      })

      // Revert stock if it was confirmed/completed
      if (stockIn.status === "CONFIRMED" || stockIn.status === "COMPLETED") {
        for (const item of stockIn.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } }
          })
          
          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              type: "STOCK_OUT", 
              quantity: item.quantity,
              referenceId: cancelled.id,
              notes: `Hoàn kho do hủy phiếu nhập ${cancelled.code}`,
              createdById: session.user.id as string
            }
          })
        }
      }

      await tx.auditLog.create({
        data: {
          userId: session.user.id as string,
          action: "CANCEL",
          module: "STOCK_IN",
          targetId: cancelled.id,
          targetName: cancelled.code,
        }
      })

      return cancelled
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("StockIn API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
