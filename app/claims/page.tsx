'use client'

import { useState, useCallback } from 'react'
import { PageHeader } from '@/_barron-agency/components/PageHeader'
import { EmptyState } from '@/_barron-agency/components/EmptyState'
import { Button } from '@/_barron-agency/components/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/_barron-agency/components/Dialog'
import { ConfirmationDialog } from '@/_barron-agency/components/ConfirmationDialog'
import { ClaimForm, type ClaimFormData } from '@/_barron-agency/components/ClaimForm'
import { ClaimListCard, ClaimListCardSkeleton } from '@/_barron-agency/components/ClaimListCard'
import { PlusIcon } from '@/_barron-agency/icons/PlusIcon'
import { useClaims, useCreateClaim } from '@/lib/hooks/useClaims'

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
      <div className="min-h-screen bg-background">
        <div className="max-w-[1200px] w-full mx-auto px-6 py-4">
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
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] w-full mx-auto px-6 py-4 space-y-6">
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
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <ClaimListCardSkeleton key={i} />
            ))}
          </div>
        ) : claims?.length === 0 ? (
          <EmptyState
            title="No claims yet"
            description="Claims will appear here once they are created."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {claims?.map((claim) => (
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
