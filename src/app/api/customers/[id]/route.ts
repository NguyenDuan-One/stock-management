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

    const existingCode = await prisma.customer.findFirst({
      where: { code, id: { not: id } },
    })
    if (existingCode) return NextResponse.json({ error: "Code already exists" }, { status: 400 })

    const customer = await prisma.customer.update({
      where: { id },
      data: { name, code, contactName, phone, email, address, taxCode, notes },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: "UPDATE",
        module: "CUSTOMERS",
        targetId: customer.id,
        targetName: customer.name,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Customer update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { _count: { select: { stockOuts: true, warrantyRecords: true } } },
    })
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const hasRelatedData = customer._count.stockOuts > 0 || customer._count.warrantyRecords > 0
    if (hasRelatedData) {
      await prisma.customer.update({ where: { id }, data: { isActive: false } })
    } else {
      await prisma.customer.delete({ where: { id } })
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: "DELETE",
        module: "CUSTOMERS",
        targetId: customer.id,
        targetName: customer.name,
      },
    })

    return NextResponse.json({ success: true, mode: hasRelatedData ? "soft" : "hard" })
  } catch (error) {
    console.error("Customer delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
