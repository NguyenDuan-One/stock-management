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
      include: { 
        stockOuts: {
          select: { id: true, status: true, code: true }
        },
        warrantyRecords: {
          select: { id: true, status: true }
        }
      },
    })
    if (!customer) return NextResponse.json({ error: "Không tìm thấy khách hàng" }, { status: 404 })

    const activeStockOuts = customer.stockOuts.filter((so) => so.status !== "CANCELLED")
    
    const { searchParams } = new URL(req.url)
    const force = searchParams.get("force") === "true"

    if (activeStockOuts.length > 0 && !force) {
      await prisma.customer.update({ where: { id }, data: { isActive: false } })

      await prisma.auditLog.create({
        data: {
          userId: session.user.id as string,
          action: "DELETE",
          module: "CUSTOMERS",
          targetId: customer.id,
          targetName: customer.name,
        },
      })

      return NextResponse.json({ 
        success: true, 
        mode: "soft",
        message: `Khách hàng có ${activeStockOuts.length} phiếu xuất kho đang hoạt động nên đã được chuyển sang trạng thái Ẩn để bảo toàn lịch sử.` 
      })
    }

    // Clean up cancelled/related data and hard delete
    await prisma.$transaction(async (tx) => {
      await tx.warrantyRecord.deleteMany({ where: { customerId: id } })

      if (customer.stockOuts.length > 0) {
        const soIds = customer.stockOuts.map((so) => so.id)
        await tx.stockOutItem.deleteMany({ where: { stockOutId: { in: soIds } } })
        await tx.stockOut.deleteMany({ where: { id: { in: soIds } } })
      }

      await tx.customer.delete({ where: { id } })
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: "DELETE",
        module: "CUSTOMERS",
        targetId: customer.id,
        targetName: customer.name,
      },
    })

    return NextResponse.json({ 
      success: true, 
      mode: "hard",
      message: "Đã xóa vĩnh viễn khách hàng thành công." 
    })
  } catch (error) {
    console.error("Customer delete error:", error)
    return NextResponse.json({ error: "Lỗi hệ thống khi xóa khách hàng" }, { status: 500 })
  }
}
