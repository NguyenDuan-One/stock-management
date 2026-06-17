type CompanySettings = {
  companyName?: string
  address?: string
  phone?: string
  email?: string
  logoUrl?: string
}

type PrintCompanyHeaderProps = {
  settings: CompanySettings | null
  title: string
  code: string
}

export function PrintCompanyHeader({ settings, title, code }: PrintCompanyHeaderProps) {
  const companyName = settings?.companyName || "Cong ty cong nghe Datatech"
  const address = settings?.address || ""
  const phone = settings?.phone || ""
  const email = settings?.email || ""

  return (
    <div className="flex items-start justify-between gap-6 border-b pb-6 print:gap-4 print:pb-4">
      <div className="flex min-w-0 items-start gap-4">
        {settings?.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt="Logo cong ty"
            className="h-16 w-16 shrink-0 object-contain print:h-14 print:w-14"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border text-xs font-bold text-slate-400 print:h-14 print:w-14">
            LOGO
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <div className="text-base font-bold uppercase leading-snug text-slate-900 print:text-sm">
            {companyName}
          </div>
          {address && <div className="text-xs leading-relaxed text-slate-600">Dia chi: {address}</div>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {phone && <span>SDT: {phone}</span>}
            {email && <span>Email: {email}</span>}
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900 print:text-base">
          {title}
        </h1>
        <div className="mt-2 font-mono text-sm font-semibold text-slate-700 print:text-xs">{code}</div>
      </div>
    </div>
  )
}
