import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const categories = await prisma.productCategory.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Categories API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    // Simple permission check placeholder
    // In real app: check if user has 'categories.create' permission
    
    const body = await req.json()
    const { name, code, description } = body

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const existingCode = await prisma.productCategory.findUnique({ where: { code } })
    if (existingCode) {
      return NextResponse.json({ error: "Code already exists" }, { status: 400 })
    }

    const category = await prisma.productCategory.create({
      data: {
        name,
        code,
        description,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: "CREATE",
        module: "CATEGORIES",
        targetId: category.id,
        targetName: category.name,
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Categories API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
