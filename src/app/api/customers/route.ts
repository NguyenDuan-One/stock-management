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
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
        ]
      })
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where: whereClause }),
      prisma.customer.findMany({
        where: whereClause,
        include: {
          _count: { select: { stockOuts: true } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      })
    ])

    return NextResponse.json({
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Customers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const body = await req.json()
    const { name, code, contactName, phone, email, address, taxCode, notes } = body

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const existingCode = await prisma.customer.findUnique({ where: { code } })
    if (existingCode) {
      return NextResponse.json({ error: "Code already exists" }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        code,
        contactName,
        phone,
        email,
        address,
        taxCode,
        notes,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: "CREATE",
        module: "CUSTOMERS",
        targetId: customer.id,
        targetName: customer.name,
      }
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error("Customers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
