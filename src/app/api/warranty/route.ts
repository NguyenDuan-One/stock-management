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
    const status = searchParams.get("status") || ""
    
    const skip = (page - 1) * limit

    const whereClause: any = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { serialNumber: { contains: search } },
          { product: { name: { contains: search } } },
          { customer: { name: { contains: search } } },
        ]
      })
    }

    const [total, warranties] = await Promise.all([
      prisma.warrantyRecord.count({ where: whereClause }),
      prisma.warrantyRecord.findMany({
        where: whereClause,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          customer: { select: { id: true, name: true, code: true } },
          stockOutItem: { 
            include: { 
              stockOut: { select: { code: true, exportDate: true } }
            } 
          }
        },
        skip,
        take: limit,
        orderBy: { endDate: "asc" }
      })
    ])

    return NextResponse.json({
      data: warranties,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Warranty API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
