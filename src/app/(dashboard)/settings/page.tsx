"use client"

import * as React from "react"
import { Save, Loader2, Settings, ShieldAlert, Building, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/ui/page-header"
import { toast } from "sonner"

export default function SettingsPage() {
  const [isSaving, setIsSaving] = React.useState(false)
  
  // Settings states
  const [appName, setAppName] = React.useState("Stock Manager")
  const [companyName, setCompanyName] = React.useState("Công ty công nghệ Datatech")
  const [address, setAddress] = React.useState("123 Đường A, Quận B, TP. Hồ Chí Minh")
  const [phone, setPhone] = React.useState("028 1234 5678")
  const [email, setEmail] = React.useState("contact@datatech.com")
  
  // System notification flags
  const [enableLowStockAlert, setEnableLowStockAlert] = React.useState(true)
  const [enableWarrantyAlert, setEnableWarrantyAlert] = React.useState(true)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success("Đã lưu cài đặt hệ thống thành công")
    }, 800)
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
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Lưu cấu hình cài đặt
          </Button>
        </div>
      </form>
    </div>
  )
}
