import * as React from "react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Inline utility for merging Tailwind classes - makes component portable
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ClaimStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED'

export interface ClaimStatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: ClaimStatus
}

function ClaimStatusBadge({ status, className, ...props }: ClaimStatusBadgeProps) {
  const statusConfig: Record<ClaimStatus, { label: string; classes: string }> = {
    PENDING: { label: 'Pending', classes: 'border-transparent bg-secondary text-secondary-foreground' },
    UNDER_REVIEW: { label: 'Under Review', classes: 'border-transparent bg-warning text-warning-foreground' },
    APPROVED: { label: 'Approved', classes: 'border-transparent bg-success text-success-foreground' },
    REJECTED: { label: 'Rejected', classes: 'border-transparent bg-destructive text-destructive-foreground' },
    CLOSED: { label: 'Closed', classes: 'border-transparent bg-secondary text-secondary-foreground' },
  }

  const config = statusConfig[status] || statusConfig.PENDING

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold",
        config.classes,
        className
      )}
      {...props}
    >
      {config.label}
    </div>
  )
}

export { ClaimStatusBadge }
