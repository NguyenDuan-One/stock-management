import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAverageCostMethod } from "@/lib/inventory-cost"

const TRACKING_METHODS = ["None", "AverageCost", "FIFO", "SerialNumber", "LotNumber"]

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const product = await prisma.product.findUnique({
      where: { id: resolvedParams.id },
      include: {
        category: true,
        inventoryTransactions: {
          take: 10,
          orderBy: { createdAt: "desc" }
        }
      }
    })

    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Product API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { 
      name, sku, categoryId, unit, description, 
      minQuantity, costPrice, sellingPrice, barcode, serialNumber, trackingMethod, isActive
    } = body

    const currentProduct = await prisma.product.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: {
            stockInItems: true,
            stockOutItems: true,
            inventoryTransactions: true,
          }
        }
      }
    })
    if (!currentProduct) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (!trackingMethod || !TRACKING_METHODS.includes(trackingMethod)) {
      return NextResponse.json({ error: "Vui lòng chọn phương pháp tính giá tồn" }, { status: 400 })
    }

    const hasTransactions =
      currentProduct._count.stockInItems > 0 ||
      currentProduct._count.stockOutItems > 0 ||
      currentProduct._count.inventoryTransactions > 0

    if (hasTransactions && trackingMethod && trackingMethod !== currentProduct.trackingMethod) {
      return NextResponse.json(
        { error: "Không thể đổi phương pháp tính giá khi sản phẩm đã phát sinh giao dịch" },
        { status: 400 }
      )
    }

    const existingSku = await prisma.product.findFirst({ 
      where: { 
        sku,
        id: { not: resolvedParams.id }
      } 
    })
    
    if (existingSku) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id: resolvedParams.id },
      data: {
        name,
        sku,
        categoryId,
        unit,
        description,
        minQuantity: parseInt(minQuantity || "0"),
        costPrice: costPrice ? parseFloat(costPrice) : null,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
        barcode,
        serialNumber,
        trackingMethod: hasTransactions ? currentProduct.trackingMethod : trackingMethod,
        isActive,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: "UPDATE",
        module: "PRODUCTS",
        targetId: product.id,
        targetName: product.name,
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Product API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const product = await prisma.product.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: {
            stockInItems: true,
            stockOutItems: true,
            inventoryTransactions: true,
            warrantyRecords: true,
          }
        }
      }
    })

    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const hasRelatedData =
      product._count.stockInItems > 0 ||
      product._count.stockOutItems > 0 ||
      product._count.inventoryTransactions > 0 ||
      product._count.warrantyRecords > 0

    if (hasRelatedData) {
      await prisma.product.update({
        where: { id: resolvedParams.id },
        data: { isActive: false }
      })
    } else {
      await prisma.product.delete({ where: { id: resolvedParams.id } })
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: "DELETE",
        module: "PRODUCTS",
        targetId: product.id,
        targetName: product.name,
      }
    })

    return NextResponse.json({ success: true, mode: hasRelatedData ? "soft" : "hard" })
  } catch (error) {
    console.error("Product API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
