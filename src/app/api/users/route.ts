import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        userRoles: {
          include: {
            role: { select: { id: true, name: true, displayName: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Users API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const body = await req.json()
    const { username, email, fullName, password, phone, roleIds } = body

    if (!username || !email || !password || !fullName || !roleIds || !roleIds.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        email,
        fullName,
        password: hashedPassword,
        phone,
        userRoles: {
          create: roleIds.map((roleId: string) => ({
            roleId
          }))
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        isActive: true,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: "CREATE",
        module: "USERS",
        targetId: user.id,
        targetName: user.username,
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Users API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
