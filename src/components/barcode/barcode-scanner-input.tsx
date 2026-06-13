"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Barcode, Loader2 } from "lucide-react"

interface Props {
  onScan: (value: string) => void
  isLoading?: boolean
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export function BarcodeScannerInput({
  onScan,
  isLoading,
  placeholder,
  autoFocus = true,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const lastKeyTime = useRef<number>(0)
  const keyBuffer = useRef<string[]>([])
  const scanTimeout = useRef<NodeJS.Timeout>()
  const [value, setValue] = useState("")
  const [isScanning, setIsScanning] = useState(false)

  const playBeep = (type: "success" | "error") => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      if (type === "success") {
        oscillator.frequency.value = 1000 // 1kHz beep
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
        oscillator.start()
        oscillator.stop(audioCtx.currentTime + 0.1)
      } else {
        oscillator.frequency.value = 300 // Lower pitch warning beep
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime)
        oscillator.start()
        oscillator.stop(audioCtx.currentTime + 0.25)
      }
    } catch (e) {
      console.warn("Audio Context beep failed", e)
    }
  }

  const handleScan = useCallback(
    (scannedValue: string) => {
      if (!scannedValue.trim()) return
      setIsScanning(true)
      playBeep("success")
      onScan(scannedValue.trim())
      setValue("")
      setTimeout(() => {
        setIsScanning(false)
        inputRef.current?.focus()
      }, 500)
    },
    [onScan]
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

    // Detect fast input (barcode scanner typically inputs at < 50ms per char)
    if (timeDiff < 50) {
      keyBuffer.current.push(e.key)
      clearTimeout(scanTimeout.current)
      scanTimeout.current = setTimeout(() => {
        keyBuffer.current = []
      }, 200)
    }
  }

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // Re-focus after loading
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
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Quét mã vạch hoặc nhập SKU..."}
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
            setValue("")
            inputRef.current?.focus()
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ×
        </button>
      )}
    </div>
  )
}
