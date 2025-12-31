"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { CancelIcon } from "../icons/CancelIcon"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Inline utility for merging Tailwind classes - makes component portable
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Dialog Context
interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog")
  }
  return context
}

// Main Dialog component
export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    onOpenChange?.(newOpen)
  }, [onOpenChange])

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

// Dialog Trigger
export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild, children, onClick, ...props }, ref) => {
    const { onOpenChange } = useDialogContext()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      onOpenChange(true)
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ onClick?: React.MouseEventHandler }>, {
        onClick: handleClick,
      })
    }

    return (
      <button ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    )
  }
)
DialogTrigger.displayName = "DialogTrigger"

// Dialog Close
export interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const DialogClose = React.forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ asChild, children, onClick, ...props }, ref) => {
    const { onOpenChange } = useDialogContext()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      onOpenChange(false)
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ onClick?: React.MouseEventHandler }>, {
        onClick: handleClick,
      })
    }

    return (
      <button ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    )
  }
)
DialogClose.displayName = "DialogClose"

// Dialog Portal - renders content in a portal (immediate render, SSR-safe)
function DialogPortal({ children }: { children: React.ReactNode }) {
  if (typeof window === 'undefined') return null
  return createPortal(children, document.body)
}

// Dialog Overlay
export interface DialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className }, ref) => {
    const { onOpenChange } = useDialogContext()

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        className={cn(
          "fixed inset-0 z-[100] bg-foreground/80",
          className
        )}
        onClick={() => onOpenChange(false)}
      />
    )
  }
)
DialogOverlay.displayName = "DialogOverlay"

// Dialog Content
export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children }, ref) => {
    const { open, onOpenChange } = useDialogContext()
    const contentRef = React.useRef<HTMLDivElement>(null)

    // Handle ESC key
    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onOpenChange(false)
        }
      }

      if (open) {
        document.addEventListener("keydown", handleKeyDown)
        // Prevent body scroll when dialog is open
        document.body.style.overflow = "hidden"
      }

      return () => {
        document.removeEventListener("keydown", handleKeyDown)
        document.body.style.overflow = ""
      }
    }, [open, onOpenChange])

    // Focus trap - focus first focusable element when opened
    React.useEffect(() => {
      if (open && contentRef.current) {
        const focusableElements = contentRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus()
        }
      }
    }, [open])

    return (
      <DialogPortal>
        <AnimatePresence mode="wait">
          {open && (
            <>
              <DialogOverlay />
              {/* Scrollable container for mobile keyboard support */}
              <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 overflow-y-auto">
                <motion.div
                  ref={(node) => {
                    // Merge refs
                    if (typeof ref === "function") ref(node)
                    else if (ref) ref.current = node
                    contentRef.current = node
                  }}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={cn(
                    "relative z-[100] w-full max-w-lg",
                    "grid gap-4 border bg-background p-6 shadow-lg",
                    "rounded-t-lg sm:rounded-lg", // Rounded top on mobile, all corners on desktop
                    "max-h-[85vh] overflow-y-auto", // Limit height and allow scroll
                    className
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {children}
                  <DialogClose className="absolute right-4 top-4 p-0 m-0 border-0 bg-transparent cursor-pointer outline-none focus:outline-none hover:opacity-80 transition-opacity">
                    <CancelIcon className="h-8 w-8" />
                    <span className="sr-only">Close</span>
                  </DialogClose>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </DialogPortal>
    )
  }
)
DialogContent.displayName = "DialogContent"

// Dialog Header
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

// Dialog Footer
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

// Dialog Title
const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

// Dialog Description
const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
