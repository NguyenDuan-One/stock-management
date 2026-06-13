"use client"

import { useSession } from "next-auth/react"

export function usePermissions() {
  const { data: session } = useSession()
  const permissions = (session?.user as any)?.permissions as string[] || []
  const roles = (session?.user as any)?.roles as string[] || []

  return {
    hasPermission: (p: string) => permissions.includes(p),
    hasAnyPermission: (ps: string[]) => ps.some(p => permissions.includes(p)),
    isAdmin: () => roles.includes("ADMIN"),
    permissions,
    roles,
  }
}
