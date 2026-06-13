"use client"

import * as React from "react"
import { Save, Loader2, Building, Bell, ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/ui/page-header"
import { toast } from "sonner"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const logoInputRef = React.useRef<HTMLInputElement>(null)
  
  // Settings states
  const [appName, setAppName] = React.useState("Stock Manager")
  const [companyName, setCompanyName] = React.useState("Công ty công nghệ Datatech")
  const [address, setAddress] = React.useState("123 Đường A, Quận B, TP. Hồ Chí Minh")
  const [phone, setPhone] = React.useState("028 1234 5678")
  const [email, setEmail] = React.useState("contact@datatech.com")
  const [logoUrl, setLogoUrl] = React.useState("")
  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = React.useState("")
  
  // System notification flags
  const [enableLowStockAlert, setEnableLowStockAlert] = React.useState(true)
  const [enableWarrantyAlert, setEnableWarrantyAlert] = React.useState(true)

  React.useEffect(() => {
    fetchSettings()
  }, [])

  React.useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(logoUrl)
      return
    }

    const objectUrl = URL.createObjectURL(logoFile)
    setLogoPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [logoFile, logoUrl])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/settings/company")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Không thể tải cấu hình")

      setAppName(json.appName || "Stock Manager")
      setCompanyName(json.companyName || "Công ty công nghệ Datatech")
      setAddress(json.address || "")
      setPhone(json.phone || "")
      setEmail(json.email || "")
      setLogoUrl(json.logoUrl || "")
      setEnableLowStockAlert(Boolean(json.enableLowStockAlert))
      setEnableWarrantyAlert(Boolean(json.enableWarrantyAlert))
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Không thể tải cấu hình hệ thống")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSaving(true)

      const formData = new FormData()
      formData.append("appName", appName)
      formData.append("companyName", companyName)
      formData.append("address", address)
      formData.append("phone", phone)
      formData.append("email", email)
      formData.append("enableLowStockAlert", String(enableLowStockAlert))
      formData.append("enableWarrantyAlert", String(enableWarrantyAlert))
      if (logoFile) formData.append("logo", logoFile)

      const res = await fetch("/api/settings/company", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Không thể lưu cấu hình")

      setLogoUrl(json.logoUrl || "")
      setLogoFile(null)
      toast.success("Đã lưu cài đặt hệ thống thành công")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Không thể lưu cấu hình hệ thống")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Cài đặt hệ thống"
        subtitle="Quản lý thông tin công ty và cấu hình các cảnh báo hệ thống"
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Settings */}
        <Card className="shadow-sm border">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-base text-slate-800 flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600" />
              Thông tin doanh nghiệp
            </CardTitle>
            <CardDescription>
              Thông tin này sẽ hiển thị trên tiêu đề và hóa đơn in phiếu nhập/xuất kho
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-4 rounded-lg border bg-slate-50/60 p-4 sm:flex-row sm:items-center">
              <button
                type="button"
                className="flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border bg-white transition hover:border-blue-400 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => logoInputRef.current?.click()}
                aria-label="Chọn logo công ty"
              >
                {logoPreviewUrl ? (
                  <img src={logoPreviewUrl} alt="Logo công ty" className="h-full w-full object-contain p-2" />
                ) : (
                  <Building className="h-10 w-10 text-slate-300" />
                )}
              </button>
              <div className="flex-1 space-y-2">
                <Label htmlFor="set-logo">Logo công ty</Label>
                <Input
                  ref={logoInputRef}
                  id="set-logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-slate-500">
                  Logo được lưu trực tiếp trong thư mục <span className="font-mono">public/uploads/company</span> và dùng trên phiếu nhập/xuất kho.
                </p>
              </div>
              <button
                type="button"
                className="hidden rounded-md p-2 text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:block"
                onClick={() => logoInputRef.current?.click()}
                aria-label="Chọn logo công ty"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="set-appname">Tên ứng dụng hệ thống</Label>
                <Input
                  id="set-appname"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="set-company">Tên công ty / Doanh nghiệp</Label>
                <Input
                  id="set-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="set-phone">Số điện thoại liên hệ</Label>
                <Input
                  id="set-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="set-email">Email liên hệ</Label>
                <Input
                  id="set-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="set-address">Địa chỉ công ty</Label>
                <Input
                  id="set-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cấu hình cảnh báo */}
        <Card className="shadow-sm border">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-base text-slate-800 flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              Cấu hình thông báo & Cảnh báo kho
            </CardTitle>
            <CardDescription>
              Thiết lập các cảnh báo tự động gửi đến bảng tin Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-800 text-sm block">Cảnh báo tồn tối thiểu</span>
                <span className="text-slate-500 text-xs">
                  Hiển thị cảnh báo màu đỏ trên Dashboard khi số lượng tồn của sản phẩm thấp hơn mức tối thiểu
                </span>
              </div>
              <Switch checked={enableLowStockAlert} onCheckedChange={setEnableLowStockAlert} />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-800 text-sm block">Cảnh báo sắp hết hạn bảo hành</span>
                <span className="text-slate-500 text-xs">
                  Hiển thị các thiết bị sắp hết hạn bảo hành (trong vòng 30 ngày) tại bảng tin bảo hành
                </span>
              </div>
              <Switch checked={enableWarrantyAlert} onCheckedChange={setEnableWarrantyAlert} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving || isLoading}>
            {(isSaving || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Lưu cấu hình cài đặt
          </Button>
        </div>
      </form>
    </div>
  )
}
