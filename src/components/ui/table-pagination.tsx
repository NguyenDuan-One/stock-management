"use client"

import { Button } from "@/components/ui/button"

interface TablePaginationProps {
  page: number
  limit: number
  total: number
  itemLabel?: string
  onPageChange: (page: number) => void
}

export function TablePagination({
  page,
  limit,
  total,
  itemLabel = "kết quả",
  onPageChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (item) =>
      item === 1 ||
      item === totalPages ||
      Math.abs(item - page) <= 1
  )

  return (
    <div className="flex flex-col gap-3 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Hiển thị <span className="font-medium text-slate-700">{start}</span> -{" "}
        <span className="font-medium text-slate-700">{end}</span> trong{" "}
        <span className="font-medium text-slate-700">{total}</span> {itemLabel}
      </p>
      <div className="flex items-center justify-between sm:justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Trước
        </Button>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="sm:hidden text-xs text-slate-600 px-1 font-medium">
            {page}/{totalPages}
          </span>
          {pages.map((item, index) => {
            const previous = pages[index - 1]
            const showGap = previous && item - previous > 1

            return (
              <div key={item} className="hidden sm:flex items-center gap-1 sm:gap-2">
                {showGap && <span className="px-1 text-sm text-slate-400">...</span>}
                <Button
                  variant={page === item ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0 text-xs sm:text-sm"
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </Button>
              </div>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  )
}
