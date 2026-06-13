"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  delay?: number
  className?: string
}

export function SearchInput({
  placeholder = "Tìm kiếm...",
  value,
  onChange,
  delay = 300,
  className = "",
}: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(value)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  React.useEffect(() => {
    const handler = setTimeout(() => {
      onChange(localValue)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [localValue, delay, onChange])

  return (
    <div className={`relative w-full ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-9 pr-8 bg-white"
      />
      {localValue && (
        <button
          type="button"
          onClick={() => {
            setLocalValue("")
            onChange("")
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
