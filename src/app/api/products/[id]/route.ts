import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
      minQuantity, costPrice, sellingPrice, barcode, serialNumber, isActive 
    } = body

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

    const product = await prisma.product.update({
      where: { id: resolvedParams.id },
      data: { isActive: false }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: "DELETE",
        module: "PRODUCTS",
        targetId: product.id,
        targetName: product.name,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Product API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
