import * as React from "react"
import Link from "next/link"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ClaimStatusBadge, type ClaimStatus } from "./ClaimStatusBadge"
import { ChevronRightIcon } from "../icons/ChevronRightIcon"

// Inline utility for merging Tailwind classes - makes component portable
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ClaimListCardProps {
  id: string
  claimNumber: string
  status: ClaimStatus
  claimantName?: string | null
  itemCount: number
  createdAt: Date | string
  href?: string
  className?: string
}

function ClaimListCard({
  id,
  claimNumber,
  status,
  claimantName,
  itemCount,
  createdAt,
  href,
  className,
}: ClaimListCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const content = (
    <div className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer",
      className
    )}>
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <ClaimStatusBadge status={status} />
          <div className="font-mono font-semibold">#{claimNumber}</div>
          {claimantName && (
            <div className="text-sm text-muted-foreground truncate">
              {claimantName}
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formattedDate}
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
          <span>View Details</span>
          <ChevronRightIcon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

function ClaimListCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}>
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          <div className="h-5 w-20 rounded bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
      </div>
    </div>
  )
}

export { ClaimListCard, ClaimListCardSkeleton }
