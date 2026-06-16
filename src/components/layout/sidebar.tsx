"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Boxes,
  LayoutDashboard,
  PackagePlus,
  PackageMinus,
  Package,
  Box,
  Tag,
  Truck,
  Users,
  Shield,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  X,
  Menu,
} from "lucide-react"
import { signOut } from "next-auth/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SidebarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    roles?: string[]
  }
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function Sidebar({ user, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()

  const navGroups = [
    {
      label: "TỔNG QUAN",
      items: [{ href: "/", icon: LayoutDashboard, label: "Dashboard" }],
    },
    {
      label: "KHO HÀNG",
      items: [
        { href: "/stock-in", icon: PackagePlus, label: "Nhập kho" },
        { href: "/stock-out", icon: PackageMinus, label: "Xuất kho" },
        { href: "/inventory", icon: Package, label: "Tồn kho" },
      ],
    },
    {
      label: "DANH MỤC",
      items: [
        { href: "/products", icon: Box, label: "Sản phẩm" },
        { href: "/categories", icon: Tag, label: "Danh mục" },
        { href: "/suppliers", icon: Truck, label: "Nhà cung cấp" },
        { href: "/customers", icon: Users, label: "Khách hàng" },
      ],
    },
    {
      label: "BẢO HÀNH",
      items: [{ href: "/warranty", icon: Shield, label: "Quản lý BH" }],
    },
    {
      label: "BÁO CÁO",
      items: [{ href: "/reports", icon: BarChart3, label: "Báo cáo" }],
    },
    {
      label: "HỆ THỐNG",
      items: [
        { href: "/users", icon: UserCog, label: "Người dùng" },
        { href: "/settings", icon: Settings, label: "Cài đặt" },
      ],
    },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 md:hidden print:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0f172a] text-slate-400 transition-transform duration-300 md:static md:translate-x-0",
          "print:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header/Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none tracking-tight">Stock Manager</span>
              <span className="text-[10px] uppercase tracking-wider text-blue-400">Datatech</span>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1 hover:bg-slate-800 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700">
          <nav className="space-y-6 px-3">
            {navGroups.map((group, i) => (
              <div key={i}>
                <div className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-500">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-blue-600 text-white"
                            : "hover:bg-slate-800 hover:text-slate-200"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User / Logout */}
        {/* <div className="border-t border-slate-800 p-4">
          <div className="mb-4 flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-slate-700">
              <AvatarImage src={user?.image || ""} />
              <AvatarFallback className="bg-slate-800 text-white">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-slate-200">
                {user?.name || "Người dùng"}
              </span>
              <span className="truncate text-xs text-slate-500">
                {user?.roles?.[0] || "Staff"}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div> */}
      </aside>
    </>
  )
}
