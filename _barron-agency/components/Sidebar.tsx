import * as React from "react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Inline utility for merging Tailwind classes - makes component portable
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  width?: string
}

export function Sidebar({
  width = "w-64",
  className,
  children,
  ...props
}: SidebarProps) {
  return (
    <aside
      className={cn(width, "border-r min-h-screen p-6", className)}
      {...props}
    >
      <nav>
        {children || (
          <p className="text-sm text-muted-foreground">Sidebar</p>
        )}
      </nav>
    </aside>
  )
}
