"use client"

import * as React from "react"
import { Menu, Bell, User as UserIcon, Lock, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"
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
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    roles?: string[]
  }
  onMenuClick: () => void
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const pathname = usePathname()

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
      <div className="flex flex-1 items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            <span>/</span>
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
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
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <div className="mt-2 flex gap-1">
                  {user?.roles?.map((role) => (
                    <Badge key={role} variant="secondary" className="text-[10px]">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Hồ sơ cá nhân</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
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
