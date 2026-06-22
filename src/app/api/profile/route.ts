import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const userSelect = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  phone: true,
  avatar: true,
  isActive: true,
  createdAt: true,
  userRoles: {
    include: {
      role: {
        select: {
          id: true,
          name: true,
          displayName: true,
        },
      },
    },
  },
} as const

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: userSelect,
    })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    console.error("Profile GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id as string
    const body = await req.json()
    const fullName = String(body.fullName || "").trim()
    const email = String(body.email || "").trim()
    const phone = String(body.phone || "").trim()

    if (!fullName || !email) {
      return NextResponse.json({ error: "Họ tên và email là bắt buộc" }, { status: 400 })
    }

    const duplicatedEmail = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId },
      },
      select: { id: true },
    })
    if (duplicatedEmail) {
      return NextResponse.json({ error: "Email đã được sử dụng bởi tài khoản khác" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        email,
        phone: phone || null,
      },
      select: userSelect,
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        module: "PROFILE",
        targetId: userId,
        targetName: user.username,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Profile PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id as string
    const body = await req.json()
    const currentPassword = String(body.currentPassword || "")
    const newPassword = String(body.newPassword || "")
    const confirmPassword = String(body.confirmPassword || "")

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ thông tin mật khẩu" }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự" }, { status: 400 })
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Xác nhận mật khẩu mới không khớp" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, password: true },
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const passwordMatch = await bcrypt.compare(currentPassword, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "CHANGE_PASSWORD",
        module: "PROFILE",
        targetId: userId,
        targetName: user.username,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Profile PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
