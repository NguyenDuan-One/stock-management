import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const records = await prisma.warrantyRecord.findMany({
      include: {
        product: { select: { name: true, sku: true } },
        customer: { select: { name: true, code: true } }
      },
      orderBy: { endDate: "asc" }
    })

    const now = new Date()
    const summary = records.reduce(
      (acc, r) => {
        const endDate = new Date(r.endDate)
        const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays < 0 || r.status === "EXPIRED") {
          acc.expired++
        } else if (diffDays <= 30) {
          acc.expiringSoon++
          acc.active++
        } else {
          acc.active++
        }
        return acc
      },
      { active: 0, expired: 0, expiringSoon: 0 }
    )

    return NextResponse.json({ records, summary })
  } catch (error) {
    console.error("Warranty report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
