import { Card, CardHeader, CardDescription } from './Card'
import { Skeleton } from './Skeleton'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Inline utility for merging Tailwind classes - makes component portable
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ItemCardSkeletonProps {
  className?: string
  count?: number
}

export function ItemCardSkeleton({ className, count = 1 }: ItemCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className={cn('w-full h-full', className)}
        >
          <CardHeader className="relative p-4 sm:p-6">
            <div className="flex flex-col gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Title skeleton */}
              <Skeleton className="h-7 w-3/4" />

              {/* Description skeleton */}
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </>
  )
}

export function ItemCardStackSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <ItemCardSkeleton count={count} />
    </div>
  )
}
