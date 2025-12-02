'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useClaims, ClaimStatus } from '@/lib/hooks/useClaims'
import { Card } from '@/_barron-agency/components/Card'
import { Skeleton } from '@/_barron-agency/components/Skeleton'
import { ClaimStatusBadge } from '@/_barron-agency/components/ClaimStatusBadge'

const STATUS_ORDER: ClaimStatus[] = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED']

// Date/time display component
function DateTimeDisplay() {
  const [dateTime, setDateTime] = useState<{ date: string; time: string } | null>(null)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setDateTime({
        date: now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        })
      })
    }
    update()
    const interval = setInterval(update, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  if (!dateTime) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-5 w-64" />
      </div>
    )
  }

  return (
    <div>
      <div className="text-4xl font-bold">{dateTime.time}</div>
      <div className="text-muted-foreground mt-1">{dateTime.date}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: claims, isLoading } = useClaims()

  // Calculate counts per status
  const statusCounts = useMemo(() => {
    const counts: Partial<Record<ClaimStatus, number>> = {}
    claims?.forEach(claim => {
      counts[claim.status] = (counts[claim.status] || 0) + 1
    })
    return counts
  }, [claims])

  // Get active statuses (count > 0) in order
  const activeStatuses = useMemo(() => {
    return STATUS_ORDER.filter(status => (statusCounts[status] || 0) > 0)
  }, [statusCounts])

  return (
    <div className="p-8 space-y-8">
      {/* Date/Time Display */}
      <DateTimeDisplay />

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            // Loading skeletons
            [...Array(3)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-8 w-12" />
              </Card>
            ))
          ) : activeStatuses.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No claims yet
            </div>
          ) : (
            activeStatuses.map((status) => {
              const count = statusCounts[status] || 0

              return (
                <Link key={status} href={`/claims?status=${status}`}>
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between">
                      <ClaimStatusBadge status={status} />
                      <div className="text-2xl font-bold">{count}</div>
                    </div>
                  </Card>
                </Link>
              )
            })
          )}
      </div>
    </div>
  )
}
