import * as React from "react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Inline utility for merging Tailwind classes - makes component portable
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  copyright?: string
}

export function Footer({
  copyright,
  className,
  children,
  ...props
}: FooterProps) {
  return (
    <footer
      className={cn("border-t mt-auto", className)}
      {...props}
    >
      <div className="container mx-auto px-6 py-4">
        {children || (
          <p className="text-sm text-muted-foreground">
            {copyright || "Footer"}
          </p>
        )}
      </div>
    </footer>
  )
}
