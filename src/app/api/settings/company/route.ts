import { NextRequest, NextResponse } from "next/server"
import { mkdir, readFile, readdir, unlink, writeFile } from "fs/promises"
import path from "path"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"

type CompanySettings = {
  appName: string
  companyName: string
  address: string
  phone: string
  email: string
  logoUrl: string
  enableLowStockAlert: boolean
  enableWarrantyAlert: boolean
}

const defaultSettings: CompanySettings = {
  appName: "Stock Manager",
  companyName: "Công ty công nghệ Datatech",
  address: "123 Đường A, Quận B, TP. Hồ Chí Minh",
  phone: "028 1234 5678",
  email: "contact@datatech.com",
  logoUrl: "",
  enableLowStockAlert: true,
  enableWarrantyAlert: true,
}

const uploadDir = path.join(process.cwd(), "public", "uploads", "company")
const settingsPath = path.join(uploadDir, "settings.json")

async function ensureUploadDir() {
  await mkdir(uploadDir, { recursive: true })
}

async function readSettings(): Promise<CompanySettings> {
  try {
    const raw = await readFile(settingsPath, "utf8")
    return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    return defaultSettings
  }
}

function getLogoExtension(file: File) {
  const extensionByType: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
  }

  return extensionByType[file.type]
}

async function clearOldLogos() {
  const files = await readdir(uploadDir)

  await Promise.all(
    files
      .filter((fileName) => fileName.startsWith("company-logo."))
      .map(async (fileName) => {
        const targetPath = path.resolve(uploadDir, fileName)
        if (targetPath.startsWith(path.resolve(uploadDir))) {
          await unlink(targetPath)
        }
      })
  )
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await ensureUploadDir()
    return NextResponse.json(await readSettings())
  } catch (error) {
    console.error("Company settings GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await ensureUploadDir()

    const currentSettings = await readSettings()
    const formData = await req.formData()
    const logo = formData.get("logo")

    let logoUrl = currentSettings.logoUrl

    if (logo instanceof File && logo.size > 0) {
      const extension = getLogoExtension(logo)
      if (!extension) {
        return NextResponse.json({ error: "Logo chỉ hỗ trợ PNG, JPG, WEBP hoặc SVG" }, { status: 400 })
      }

      if (logo.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "Logo không được vượt quá 2MB" }, { status: 400 })
      }

      await clearOldLogos()
      const fileName = `company-logo${extension}`
      const logoPath = path.join(uploadDir, fileName)
      const bytes = await logo.arrayBuffer()
      await writeFile(logoPath, Buffer.from(bytes))
      logoUrl = `/uploads/company/${fileName}`
    }

    const settings: CompanySettings = {
      appName: String(formData.get("appName") || defaultSettings.appName),
      companyName: String(formData.get("companyName") || defaultSettings.companyName),
      address: String(formData.get("address") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      logoUrl,
      enableLowStockAlert: formData.get("enableLowStockAlert") === "true",
      enableWarrantyAlert: formData.get("enableWarrantyAlert") === "true",
    }

    await writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf8")

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Company settings POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
