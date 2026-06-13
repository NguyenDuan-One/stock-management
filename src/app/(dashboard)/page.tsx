import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tổng quan hệ thống</h1>
          <p className="text-sm text-slate-500 mt-1">
            Chào mừng trở lại, {session.user.name}
          </p>
        </div>
      </div>
      <DashboardContent />
    </div>
  )
}
