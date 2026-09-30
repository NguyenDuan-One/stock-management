"use client"

import * as React from "react"
import { Menu, Bell, User as UserIcon, Lock, LogOut } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface HeaderProps {
  user?: {
    name?: string | null
    fullName?: string | null
    email?: string | null
    image?: string | null
    roles?: string[]
  }
  onMenuClick: () => void
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const displayName = user?.fullName || user?.name || user?.email || "User"
  const roleText = user?.roles?.join(", ")

  // Generate breadcrumb from pathname
  const paths = pathname.split("/").filter(Boolean)
  const breadcrumbs = paths.map((path, index) => {
    const href = `/${paths.slice(0, index + 1).join("/")}`
    const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ")
    return { href, label }
  })

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-white px-4 shadow-sm md:px-6 print:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Breadcrumb */}
      <div className="flex flex-1 items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground overflow-hidden mr-2">
        <Link href="/" className="hover:text-foreground transition-colors shrink-0">
          Home
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            <span className="shrink-0 text-slate-300">/</span>
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground truncate">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground transition-colors truncate hidden sm:inline">
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600"></span>
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 gap-2 rounded-full px-2">
              <Avatar className="h-8 w-8 bg-slate-200 ring-1 ring-slate-300">
                <AvatarImage src={user?.image || ""} alt={displayName} />
                <AvatarFallback className="bg-slate-200 text-slate-700">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-40 truncate text-sm font-medium text-slate-700 sm:inline">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 p-2" align="end" forceMount>
            <DropdownMenuLabel className="p-2 font-normal">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0 bg-slate-200 ring-1 ring-slate-300">
                  <AvatarImage src={user?.image || ""} alt={displayName} />
                  <AvatarFallback className="bg-slate-200 font-semibold text-slate-700">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-5 text-slate-900">
                    {displayName}
                    {roleText && (
                      <span className="ml-1 font-medium text-slate-500">
                        ({roleText})
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs leading-4 text-slate-500">
                    {user?.email || "Chưa có email"}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Hồ sơ cá nhân</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/profile#password-section")}>
                <Lock className="mr-2 h-4 w-4" />
                <span>Đổi mật khẩu</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:bg-red-50 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
