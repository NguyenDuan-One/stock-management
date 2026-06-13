"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Boxes, User, Lock, Loader2, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("Admin@123")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError("Tên đăng nhập hoặc mật khẩu không chính xác")
        setIsLoading(false)
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#0f172a] p-12 lg:flex relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-20 h-[600px] w-[600px] rounded-full bg-blue-900/40 blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/20">
              <Boxes className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">Stock Manager</span>
          </div>
          <div className="mt-16">
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              Hệ thống quản lý<br />
              <span className="text-blue-500">kho thông minh</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-slate-400">
              Giải pháp toàn diện giúp doanh nghiệp kiểm soát hàng hóa, tối ưu chi phí và tăng hiệu quả vận hành.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded-full bg-blue-600/20 p-1">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-white">Quản lý vòng đời sản phẩm</h3>
              <p className="mt-1 text-sm text-slate-400">Từ lúc nhập kho, xuất bán đến theo dõi bảo hành.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded-full bg-blue-600/20 p-1">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-white">Hỗ trợ máy quét mã vạch</h3>
              <p className="mt-1 text-sm text-slate-400">Thao tác nhanh chóng, chính xác, giảm thiểu sai sót thủ công.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded-full bg-blue-600/20 p-1">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-white">Báo cáo & Thống kê trực quan</h3>
              <p className="mt-1 text-sm text-slate-400">Dashboard biểu đồ sinh động giúp nắm bắt tình hình tức thời.</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 mt-8 text-sm text-slate-500">
          © {new Date().getFullYear()} Datatech. All rights reserved.
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex w-full items-center justify-center bg-slate-50 p-6 lg:w-1/2 lg:p-12">
        <div className="mx-auto w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/20">
              <Boxes className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Stock Manager</span>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">Đăng nhập</h2>
            <p className="mt-2 text-sm text-slate-500">
              Nhập thông tin tài khoản để truy cập hệ thống
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập hoặc Email</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-11"
                    placeholder="admin"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mật khẩu</Label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="font-normal text-slate-600">Ghi nhớ đăng nhập</Label>
                </div>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Quên mật khẩu?
                </a>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
            
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">Tài khoản Demo:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Admin: <span className="font-mono bg-blue-100 px-1 rounded">admin</span> / <span className="font-mono bg-blue-100 px-1 rounded">Admin@123</span></li>
                <li>Manager: <span className="font-mono bg-blue-100 px-1 rounded">manager</span> / <span className="font-mono bg-blue-100 px-1 rounded">Admin@123</span></li>
                <li>Staff: <span className="font-mono bg-blue-100 px-1 rounded">staff1</span> / <span className="font-mono bg-blue-100 px-1 rounded">Admin@123</span></li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
