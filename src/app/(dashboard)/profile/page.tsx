"use client"

import * as React from "react"
import { Loader2, Lock, Save, UserRound } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)
  const [profile, setProfile] = React.useState<any>(null)

  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  React.useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/profile")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Không thể tải hồ sơ")

      setProfile(json)
      setFullName(json.fullName || "")
      setEmail(json.email || "")
      setPhone(json.phone || "")
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Không thể tải hồ sơ")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      setIsSavingProfile(true)
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Không thể cập nhật hồ sơ")

      setProfile(json)
      toast.success("Đã cập nhật hồ sơ cá nhân")
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật hồ sơ")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      setIsChangingPassword(true)
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Không thể đổi mật khẩu")

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Đã đổi mật khẩu")
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Không thể đổi mật khẩu")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const displayName = profile?.fullName || profile?.username || "User"
  const roleNames = profile?.userRoles?.map((item: any) => item.role?.displayName || item.role?.name).filter(Boolean) || []

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Hồ sơ cá nhân" subtitle="Cập nhật thông tin tài khoản và mật khẩu đăng nhập" />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 bg-slate-200 ring-1 ring-slate-300">
                <AvatarImage src={profile?.avatar || ""} alt={displayName} />
                <AvatarFallback className="bg-slate-200 text-xl font-semibold text-slate-700">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4">
                <div className="text-lg font-semibold text-slate-900">{displayName}</div>
                <div className="mt-1 font-mono text-sm text-slate-500">{profile?.username}</div>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {roleNames.length ? (
                  roleNames.map((role: string) => (
                    <Badge key={role} variant="secondary" className="border-none bg-blue-50 text-blue-700">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary">Staff</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card id="password-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="h-5 w-5 text-blue-600" />
                Thông tin cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Họ tên *</Label>
                    <Input
                      id="profile-name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email *</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-phone">Số điện thoại</Label>
                  <Input
                    id="profile-phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={isSavingProfile}>
                    {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Lưu hồ sơ
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-5 w-5 text-blue-600" />
                Đổi mật khẩu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mật khẩu hiện tại *</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Mật khẩu mới *</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Xác nhận mật khẩu mới *</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="outline" disabled={isChangingPassword}>
                    {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                    Đổi mật khẩu
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
