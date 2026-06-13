"use client"

import * as React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    roles?: string[]
  }
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 print:block print:h-auto print:overflow-visible print:bg-white">
      <Sidebar user={user} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex flex-1 flex-col overflow-hidden print:block print:overflow-visible">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 print:block print:overflow-visible print:p-0">
          <div className="mx-auto max-w-7xl print:max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
