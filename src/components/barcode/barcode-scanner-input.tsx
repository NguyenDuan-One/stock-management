"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Barcode, Loader2, Plus, X } from "lucide-react"

export interface BarcodeSuggestion {
  id: string
  name: string
  sku: string
  barcode?: string | null
  quantity?: number | null
  unit?: string | null
}

type WindowWithLegacyAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

interface Props {
  onScan: (value: string) => void
  isLoading?: boolean
  placeholder?: string
  autoFocus?: boolean
  className?: string
  suggestions?: BarcodeSuggestion[]
  onQueryChange?: (value: string) => void
  onSuggestionSelect?: (item: BarcodeSuggestion) => void
  onAddNew?: (value: string) => void
  addNewLabel?: string
  emptyText?: string
}

export function BarcodeScannerInput({
  onScan,
  isLoading,
  placeholder,
  autoFocus = true,
  className,
  suggestions = [],
  onQueryChange,
  onSuggestionSelect,
  onAddNew,
  addNewLabel = "Them moi",
  emptyText = "Khong tim thay ket qua phu hop",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const lastKeyTime = useRef<number>(0)
  const keyBuffer = useRef<string[]>([])
  const scanTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [value, setValue] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const trimmedValue = value.trim()
  const showSuggestions = isFocused && trimmedValue.length > 0 && (suggestions.length > 0 || !!onAddNew)

  const playBeep = (type: "success" | "error") => {
    try {
      const AudioContextClass = window.AudioContext || (window as WindowWithLegacyAudio).webkitAudioContext
      if (!AudioContextClass) return
      const audioCtx = new AudioContextClass()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      if (type === "success") {
        oscillator.frequency.value = 1000
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
        oscillator.start()
        oscillator.stop(audioCtx.currentTime + 0.1)
      } else {
        oscillator.frequency.value = 300
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime)
        oscillator.start()
        oscillator.stop(audioCtx.currentTime + 0.25)
      }
    } catch (e) {
      console.warn("Audio Context beep failed", e)
    }
  }

  const clearValue = useCallback(() => {
    setValue("")
    onQueryChange?.("")
  }, [onQueryChange])

  const handleScan = useCallback(
    (scannedValue: string) => {
      if (!scannedValue.trim()) return
      setIsScanning(true)
      playBeep("success")
      onScan(scannedValue.trim())
      clearValue()
      setTimeout(() => {
        setIsScanning(false)
        inputRef.current?.focus()
      }, 500)
    },
    [clearValue, onScan]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now()
    const timeDiff = now - lastKeyTime.current
    lastKeyTime.current = now

    if (e.key === "Enter") {
      e.preventDefault()
      if (value.trim()) {
        handleScan(value)
      }
      return
    }

    if (timeDiff < 50) {
      keyBuffer.current.push(e.key)
      if (scanTimeout.current) clearTimeout(scanTimeout.current)
      scanTimeout.current = setTimeout(() => {
        keyBuffer.current = []
      }, 200)
    }
  }

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  return (
    <div className={`relative ${className || ""}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
        {isLoading || isScanning ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Barcode className="h-5 w-5" />
        )}
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          onQueryChange?.(e.target.value)
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 150)}
        placeholder={placeholder || "Quet ma vach hoac nhap SKU..."}
        disabled={isLoading}
        className={`w-full pl-10 pr-10 py-3 text-base font-mono border-2 rounded-lg outline-none transition-all
          ${
            isScanning
              ? "border-green-500 bg-green-50 text-green-900"
              : "border-blue-400 bg-blue-50/50 text-slate-800 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
          }
          disabled:opacity-50 disabled:cursor-not-allowed`}
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            clearValue()
            inputRef.current?.focus()
          }}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:bg-white hover:text-gray-600"
          aria-label="Xoa noi dung"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {suggestions.length > 0 ? (
            <div className="max-h-72 overflow-y-auto p-1">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    clearValue()
                    onSuggestionSelect?.(item)
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800">{item.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      SKU: {item.sku}
                      {item.barcode ? ` | Barcode: ${item.barcode}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {item.quantity ?? 0} {item.unit || ""}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-3 text-sm text-slate-500">{emptyText}</div>
          )}

          {onAddNew && (
            <button
              type="button"
              className="flex min-h-11 w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm font-semibold text-blue-700 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onAddNew(trimmedValue)}
            >
              <Plus className="h-4 w-4" />
              {addNewLabel}: <span className="font-mono">{trimmedValue}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
