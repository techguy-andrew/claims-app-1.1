'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/_barron-agency/components/Card'
import { Badge } from '@/_barron-agency/components/Badge'
import { PageHeader } from '@/_barron-agency/components/PageHeader'
import { Skeleton } from '@/_barron-agency/components/Skeleton'
import { EmptyState } from '@/_barron-agency/components/EmptyState'
import { Button } from '@/_barron-agency/components/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/_barron-agency/components/Dialog'
import { ConfirmationDialog } from '@/_barron-agency/components/ConfirmationDialog'
import { ClaimForm, type ClaimFormData } from '@/_barron-agency/components/ClaimForm'
import { PlusIcon } from '@/_barron-agency/icons/PlusIcon'
import { useClaims, useCreateClaim, ClaimStatus } from '@/lib/hooks/useClaims'

// Map claim status to badge variant
function getStatusVariant(status: ClaimStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'APPROVED':
      return 'default'
    case 'PENDING':
      return 'secondary'
    case 'UNDER_REVIEW':
      return 'outline'
    case 'REJECTED':
      return 'destructive'
    case 'CLOSED':
      return 'secondary'
    default:
      return 'outline'
  }
}

// Format status for display
function formatStatus(status: ClaimStatus): string {
  return status.replace('_', ' ')
}

// Format date for display
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ClaimsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const { data: claims, isLoading, error } = useClaims()
  const createClaim = useCreateClaim()

  const handleCreateClaim = (data: ClaimFormData) => {
    createClaim.mutate(data, {
      onSuccess: () => {
        setIsFormDirty(false)
        setDialogOpen(false)
      },
    })
  }

  const handleDialogClose = useCallback((open: boolean) => {
    if (!open && isFormDirty) {
      // User is trying to close with unsaved changes
      setConfirmDialogOpen(true)
    } else {
      setDialogOpen(open)
      if (!open) {
        setIsFormDirty(false)
      }
    }
  }, [isFormDirty])

  const handleConfirmDiscard = useCallback(() => {
    setIsFormDirty(false)
    setDialogOpen(false)
    setConfirmDialogOpen(false)
  }, [])

  const handleCancelForm = useCallback(() => {
    if (isFormDirty) {
      setConfirmDialogOpen(true)
    } else {
      setDialogOpen(false)
    }
  }, [isFormDirty])

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <PageHeader title="Claims" />
          <EmptyState
            title="Error loading claims"
            description="There was a problem loading your claims. Please try again."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Claims"
          description="View and manage all insurance claims"
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <PlusIcon />
              New Claim
            </Button>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : claims?.length === 0 ? (
          <EmptyState
            title="No claims yet"
            description="Claims will appear here once they are created."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {claims?.map((claim) => (
              <Link key={claim.id} href={`/claims/${claim.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-mono">
                        #{claim.claimNumber}
                      </CardTitle>
                      <Badge variant={getStatusVariant(claim.status)}>
                        {formatStatus(claim.status)}
                      </Badge>
                    </div>
                    {claim.claimantName && (
                      <CardDescription className="text-sm">
                        {claim.claimantName}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{claim._count.items} {claim._count.items === 1 ? 'item' : 'items'}</span>
                      {claim.customer && (
                        <span>{claim.customer}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(claim.createdAt)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Claim</DialogTitle>
              <DialogDescription>
                Create a new insurance claim
              </DialogDescription>
            </DialogHeader>
            <ClaimForm
              onFormSubmit={handleCreateClaim}
              onCancel={handleCancelForm}
              isSubmitting={createClaim.isPending}
              onDirtyChange={setIsFormDirty}
            />
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          title="Discard changes?"
          description="You have unsaved changes. Are you sure you want to close without saving?"
          onConfirm={handleConfirmDiscard}
          confirmLabel="Discard"
          cancelLabel="Keep Editing"
          isDestructive
        />
      </div>
    </div>
  )
}
