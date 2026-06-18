import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const mmToPt = (mm: number) => (mm * 72) / 25.4

const toAscii = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
}

const escapePdfText = (value: string) => {
  return toAscii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

const getBarcodeBars = (value: string) => {
  const source = value || "SKU"
  let seed = 0
  for (let i = 0; i < source.length; i += 1) seed += source.charCodeAt(i) * (i + 1)
  return Array.from({ length: 64 }, (_, idx) => ((seed + idx * 17 + source.charCodeAt(idx % source.length)) % 5) + 1)
}

const buildPdf = ({
  mode,
  code,
  productName,
  sku,
  widthMm,
  heightMm,
}: {
  mode: "sku" | "serial"
  code: string
  productName: string
  sku: string
  widthMm: number
  heightMm: number
}) => {
  const pageWidth = mmToPt(widthMm)
  const pageHeight = mmToPt(heightMm)
  const margin = mmToPt(3)
  const contentWidth = pageWidth - margin * 2
  const barcodeHeight = mmToPt(13)
  const barcodeY = (pageHeight - barcodeHeight) / 2
  const bars = getBarcodeBars(code)
  const totalUnits = bars.reduce((sum, width) => sum + width, 0)
  const scale = contentWidth / totalUnits

  let x = margin
  const barcodeOps = bars
    .map((width, idx) => {
      const barWidth = Math.max(0.5, width * scale)
      const op = idx % 2 === 0 ? `${x.toFixed(2)} ${barcodeY.toFixed(2)} ${barWidth.toFixed(2)} ${barcodeHeight.toFixed(2)} re f` : ""
      x += barWidth
      return op
    })
    .filter(Boolean)
    .join("\n")

  const title = mode === "serial" ? "SERIAL" : "SKU"
  const safeName = escapePdfText(productName).slice(0, 36)
  const safeCode = escapePdfText(code).slice(0, 42)
  const safeSku = escapePdfText(sku).slice(0, 42)
  const stream = [
    "0 0 0 rg",
    "BT",
    "/F1 8 Tf",
    `1 0 0 1 ${margin.toFixed(2)} ${(pageHeight - margin - 6).toFixed(2)} Tm`,
    `(${title}) Tj`,
    "ET",
    "BT",
    "/F1 9 Tf",
    `1 0 0 1 ${margin.toFixed(2)} ${(pageHeight - margin - 16).toFixed(2)} Tm`,
    `(${safeName}) Tj`,
    "ET",
    barcodeOps,
    "BT",
    "/F2 9 Tf",
    `1 0 0 1 ${margin.toFixed(2)} ${(margin + 8).toFixed(2)} Tm`,
    `(${safeCode}) Tj`,
    "ET",
    "BT",
    "/F1 6 Tf",
    `1 0 0 1 ${margin.toFixed(2)} ${margin.toFixed(2)} Tm`,
    `(SKU: ${safeSku}) Tj`,
    "ET",
  ].join("\n")

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>",
    `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
  ]

  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = Buffer.byteLength(pdf, "utf8")
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf, "utf8")
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const code = String(searchParams.get("code") || "").trim()
  const mode = searchParams.get("mode") === "serial" ? "serial" : "sku"

  if (!code) {
    return NextResponse.json({ error: "Print code is required" }, { status: 400 })
  }

  const pdf = buildPdf({
    mode,
    code,
    productName: String(searchParams.get("productName") || ""),
    sku: String(searchParams.get("sku") || ""),
    widthMm: Number(searchParams.get("widthMm") || 60),
    heightMm: Number(searchParams.get("heightMm") || 40),
  })

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="label-${mode}-${encodeURIComponent(code)}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
