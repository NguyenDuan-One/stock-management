import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { name, code, contactName, phone, email, address, taxCode, notes } = body

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const existingCode = await prisma.supplier.findFirst({
      where: { code, id: { not: id } },
    })
    if (existingCode) return NextResponse.json({ error: "Code already exists" }, { status: 400 })

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, code, contactName, phone, email, address, taxCode, notes },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: "UPDATE",
        module: "SUPPLIERS",
        targetId: supplier.id,
        targetName: supplier.name,
      },
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error("Supplier update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { stockIns: true } } },
    })
    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (supplier._count.stockIns > 0) {
      await prisma.supplier.update({ where: { id }, data: { isActive: false } })
    } else {
      await prisma.supplier.delete({ where: { id } })
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: "DELETE",
        module: "SUPPLIERS",
        targetId: supplier.id,
        targetName: supplier.name,
      },
    })

    return NextResponse.json({ success: true, mode: supplier._count.stockIns > 0 ? "soft" : "hard" })
  } catch (error) {
    console.error("Supplier delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
