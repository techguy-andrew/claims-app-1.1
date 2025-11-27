import * as React from "react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Inline utility for merging Tailwind classes - makes component portable
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string
  logo?: React.ReactNode
  actions?: React.ReactNode
}

export function Header({
  title = "Header",
  logo,
  actions,
  className,
  children,
  ...props
}: HeaderProps) {
  return (
    <header
      className={cn("border-b", className)}
      {...props}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {logo}
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
        {children}
      </div>
    </header>
  )
}
