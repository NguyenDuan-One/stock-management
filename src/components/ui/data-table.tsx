"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface Column {
  key: string
  label: string
  render?: (item: any, index: number) => React.ReactNode
  className?: string
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  isLoading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  pagination?: {
    page: number
    limit: number
    total: number
    onPageChange: (page: number) => void
  }
}

export function DataTable({
  columns,
  data,
  isLoading = false,
  searchable = false,
  searchPlaceholder = "Tìm kiếm...",
  searchValue = "",
  onSearchChange,
  pagination,
}: DataTableProps) {
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.limit)
    : 0

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
      )}

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={rIdx}>
                  {columns.map((col, cIdx) => (
                    <TableCell key={cIdx} className={col.className}>
                      <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-slate-500"
                >
                  Không tìm thấy dữ liệu.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, rIdx) => (
                <TableRow key={item.id || rIdx} className="hover:bg-slate-50/50">
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? col.render(item, rIdx) : item[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between py-2">
          <div className="text-sm text-slate-500">
            Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} trong{" "}
            {pagination.total} kết quả
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Trước
            </Button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1
              // Simple pagination rendering
              if (
                p === 1 ||
                p === totalPages ||
                Math.abs(p - pagination.page) <= 1
              ) {
                return (
                  <Button
                    key={p}
                    variant={pagination.page === p ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => pagination.onPageChange(p)}
                  >
                    {p}
                  </Button>
                )
              }
              if (p === 2 || p === totalPages - 1) {
                return (
                  <span key={p} className="text-slate-400 px-1">
                    ...
                  </span>
                )
              }
              return null
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
