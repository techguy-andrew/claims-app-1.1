'use client'

import { useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/_barron-agency/components/PageHeader'
import { EmptyState } from '@/_barron-agency/components/EmptyState'
import { Button } from '@/_barron-agency/components/Button'
import { ClaimListCard, ClaimListCardSkeleton } from '@/_barron-agency/components/ClaimListCard'
import { ClaimsToolbar } from '@/_barron-agency/components/ClaimsToolbar'
import { PlusIcon } from '@/_barron-agency/icons/PlusIcon'
import { useClaims, ClaimStatus } from '@/lib/hooks/useClaims'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useClaimsFilter } from '@/lib/hooks/useClaimsFilter'

function ClaimsPageContent() {
  const searchParams = useSearchParams()

  // Filter state - initialize from URL params
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<ClaimStatus[]>(() => {
    const statusParam = searchParams.get('status')
    if (statusParam && Object.values(ClaimStatus).includes(statusParam as ClaimStatus)) {
      return [statusParam as ClaimStatus]
    }
    return []
  })

  // Debounced search for performance
  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data: claims, isLoading, error } = useClaims()

  // Filtered results
  const { filteredClaims, isEmpty, isFiltered, activeFilterCount } = useClaimsFilter({
    claims,
    searchQuery: debouncedSearch,
    selectedStatuses,
  })

  const clearAllFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedStatuses([])
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-16 z-40 bg-background border-b px-8 py-6">
          <PageHeader title="Claims" />
        </div>
        <div className="p-8">
          <EmptyState
            title="Error loading claims"
            description="There was a problem loading your claims. Please try again."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ClaimsToolbar
          title="Claims"
          description="View and manage all insurance claims"
          action={
            <Link href="/claims/new">
              <Button>
                <PlusIcon />
                New Claim
              </Button>
            </Link>
          }
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatuses={selectedStatuses}
          onStatusChange={setSelectedStatuses}
          onClearAll={clearAllFilters}
          activeFilterCount={activeFilterCount}
        />

        <div className="p-8">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[...Array(3)].map((_, i) => (
                <ClaimListCardSkeleton key={i} />
              ))}
            </div>
          ) : isEmpty ? (
            <EmptyState
              title={isFiltered ? "No matching claims" : "No claims yet"}
              description={
                isFiltered
                  ? "Try adjusting your search or filter criteria."
                  : "Claims will appear here once they are created."
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {filteredClaims.map((claim) => (
                <ClaimListCard
                  key={claim.id}
                  id={claim.id}
                  claimNumber={claim.claimNumber}
                  status={claim.status}
                  claimantName={claim.claimantName}
                  itemCount={claim._count.items}
                  createdAt={claim.createdAt}
                  href={`/claims/${claim.id}`}
                />
              ))}
            </div>
          )}
        </div>
    </div>
  )
}

export default function ClaimsPage() {
  return (
    <Suspense fallback={<ClaimsPageSkeleton />}>
      <ClaimsPageContent />
    </Suspense>
  )
}

function ClaimsPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-16 z-40 bg-background border-b px-8 py-6">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
      </div>
      <div className="p-8">
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <ClaimListCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
