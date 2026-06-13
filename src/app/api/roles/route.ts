import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true
      }
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error("Roles API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
