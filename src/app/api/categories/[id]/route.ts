import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const category = await prisma.productCategory.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Category API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { name, code, description, isActive } = body

    const existingCode = await prisma.productCategory.findFirst({ 
      where: { 
        code,
        id: { not: resolvedParams.id }
      } 
    })
    
    if (existingCode) {
      return NextResponse.json({ error: "Code already exists" }, { status: 400 })
    }

    const category = await prisma.productCategory.update({
      where: { id: resolvedParams.id },
      data: {
        name,
        code,
        description,
        isActive,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: "UPDATE",
        module: "CATEGORIES",
        targetId: category.id,
        targetName: category.name,
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Category API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const category = await prisma.productCategory.findUnique({
      where: { id: resolvedParams.id },
      include: { _count: { select: { products: true } } }
    })

    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (category._count.products > 0) {
      await prisma.productCategory.update({
        where: { id: resolvedParams.id },
        data: { isActive: false }
      })
    } else {
      await prisma.productCategory.delete({ where: { id: resolvedParams.id } })
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: "DELETE",
        module: "CATEGORIES",
        targetId: category.id,
        targetName: category.name,
      }
    })

    return NextResponse.json({ success: true, mode: category._count.products > 0 ? "soft" : "hard" })
  } catch (error) {
    console.error("Category API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
