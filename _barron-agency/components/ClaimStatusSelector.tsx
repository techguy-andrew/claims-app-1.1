import * as React from "react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ClaimStatusBadge, type ClaimStatus } from "./ClaimStatusBadge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./DropdownMenu"
import { CheckIcon } from "../icons/CheckIcon"

// Inline utility for merging Tailwind classes - makes component portable
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const STATUS_OPTIONS: { value: ClaimStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CLOSED', label: 'Closed' },
]

export interface ClaimStatusSelectorProps {
  status: ClaimStatus
  onStatusChange?: (status: ClaimStatus) => void
  disabled?: boolean
  className?: string
}

function ClaimStatusSelector({
  status,
  onStatusChange,
  disabled = false,
  className,
}: ClaimStatusSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          className={cn(
            "cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
        >
          <ClaimStatusBadge status={status} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onStatusChange?.(option.value)}
            className="flex items-center gap-2"
          >
            <span className="w-4">
              {option.value === status && (
                <CheckIcon className="h-4 w-4 text-foreground" />
              )}
            </span>
            <ClaimStatusBadge status={option.value} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ClaimStatusSelector, STATUS_OPTIONS }
