"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Inline utility for merging Tailwind classes - makes component portable
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Toast types
type ToastType = "success" | "error" | "info"

interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

// Toast context for global state
interface ToastContextValue {
  toasts: ToastItem[]
  addToast: (message: string, type: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

// Hook to access toast context
function useToastContext() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("Toast must be used within a ToastProvider")
  }
  return context
}

// Toast Provider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const addToast = React.useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

// Individual toast component
function ToastItem({ toast, onRemove }: { toast: ToastItem; onRemove: () => void }) {
  const [isExiting, setIsExiting] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onRemove, 200) // Wait for exit animation
    }, toast.duration || 3000)

    return () => clearTimeout(timer)
  }, [toast.duration, onRemove])

  const typeStyles = {
    success: "bg-success text-success-foreground",
    error: "bg-destructive text-destructive-foreground",
    info: "bg-muted text-muted-foreground",
  }

  return (
    <div
      className={cn(
        "rounded-full px-4 py-2 text-sm shadow-lg transition-all duration-200",
        "min-w-0 max-w-[400px]",
        typeStyles[toast.type],
        isExiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      )}
      role="alert"
    >
      {toast.message}
    </div>
  )
}

// Toaster component - renders all toasts
export function Toaster() {
  const { toasts, removeToast } = useToastContext()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>,
    document.body
  )
}

// Global toast instance for imperative API
let globalAddToast: ((message: string, type: ToastType, duration?: number) => void) | null = null

export function ToastRegistry() {
  const { addToast } = useToastContext()

  React.useEffect(() => {
    globalAddToast = addToast
    return () => {
      globalAddToast = null
    }
  }, [addToast])

  return null
}

// Toast API object - matches Sonner's API
export const toast = {
  success: (message: string, duration?: number) => {
    if (globalAddToast) {
      globalAddToast(message, "success", duration)
    }
  },
  error: (message: string, duration?: number) => {
    if (globalAddToast) {
      globalAddToast(message, "error", duration)
    }
  },
  info: (message: string, duration?: number) => {
    if (globalAddToast) {
      globalAddToast(message, "info", duration)
    }
  },
}
