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
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6 border-b pb-6 print:flex-row print:gap-4 print:pb-4">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        {settings?.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt="Logo cong ty"
            className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 object-contain print:h-14 print:w-14"
          />
        ) : (
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded border text-xs font-bold text-slate-400 print:h-14 print:w-14">
            LOGO
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <div className="text-sm sm:text-base font-bold uppercase leading-snug text-slate-900 print:text-sm break-words">
            {companyName}
          </div>
          {address && <div className="text-xs leading-relaxed text-slate-600 break-words">Địa chỉ: {address}</div>}
          <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-slate-600">
            {phone && <span>SĐT: {phone}</span>}
            {email && <span>Email: {email}</span>}
          </div>
        </div>
      </div>

      <div className="shrink-0 text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 print:border-t-0 print:pt-0 print:text-right">
        <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-slate-900 print:text-base">
          {title}
        </h1>
        <div className="mt-1 sm:mt-2 font-mono text-xs sm:text-sm font-semibold text-slate-700 print:text-xs">{code}</div>
      </div>
    </div>
  )
}
