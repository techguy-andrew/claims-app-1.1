'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast, Toaster, ToastProvider, ToastRegistry } from '@/_barron-agency/components/Toast'
import { ClaimDetailsCard, type ClaimDetailsData } from '@/_barron-agency/components/ClaimDetailsCard'
import { ConfirmationDialog } from '@/_barron-agency/components/ConfirmationDialog'
import { useCreateClaim } from '@/lib/hooks/useClaims'
import { ClaimStatus } from '@prisma/client'

export default function NewClaimPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const createClaim = useCreateClaim()

  // Handle claim creation
  const handleCreate = async (data: ClaimDetailsData): Promise<void> => {
    setIsCreating(true)
    try {
      const result = await createClaim.mutateAsync({
        claimNumber: data.claimNumber,
        customer: data.customer || undefined,
        adjustorName: data.adjustorName || undefined,
        adjustorPhone: data.adjustorPhone || undefined,
        adjustorEmail: data.adjustorEmail || undefined,
        claimantName: data.claimantName || undefined,
        claimantPhone: data.claimantPhone || undefined,
        claimantEmail: data.claimantEmail || undefined,
        claimantAddress: data.claimantAddress || undefined,
      })

      setHasUnsavedChanges(false)
      toast.success('Claim created')

      // Replace URL without adding to history - seamless transition
      router.replace(`/claims/${result.id}`)
    } catch {
      toast.error('Failed to create claim')
      setIsCreating(false)
    }
  }

  // Track dirty state - consider form dirty if user has typed anything
  // We detect this by watching for any input events on the card
  const handleCardInput = useCallback(() => {
    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true)
    }
  }, [hasUnsavedChanges])

  // Warn on browser back/refresh with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Intercept back link click when there are unsaved changes
  const handleBackClick = (e: React.MouseEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault()
      setShowLeaveConfirm(true)
    }
  }

  const handleConfirmLeave = () => {
    setShowLeaveConfirm(false)
    router.push('/claims')
  }

  // Empty claim data for create mode
  const emptyClaim: ClaimDetailsData = {
    claimNumber: '',
    status: ClaimStatus.PENDING,
    customer: null,
    adjustorName: null,
    adjustorPhone: null,
    adjustorEmail: null,
    claimantName: null,
    claimantPhone: null,
    claimantEmail: null,
    claimantAddress: null,
  }

  return (
    <ToastProvider>
      <ToastRegistry />
      <Toaster />
      <div className="min-h-screen bg-background">
        <div className="p-8 space-y-6">
          {/* Header with Back Link */}
          <div className="flex items-center justify-between">
            <Link
              href="/claims"
              onClick={handleBackClick}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Claims
            </Link>
          </div>

          {/* Claim Details Card in Create Mode */}
          <div onInput={handleCardInput}>
            <ClaimDetailsCard
              claim={emptyClaim}
              isCreateMode={true}
              onCreate={handleCreate}
              isSaving={isCreating}
            />
          </div>

          {/* Items Section - Placeholder in Create Mode */}
          <div className="text-sm text-muted-foreground">
            Save the claim to add items.
          </div>
        </div>
      </div>

      {/* Leave Confirmation Dialog */}
      <ConfirmationDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to leave without saving?"
        onConfirm={handleConfirmLeave}
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        isDestructive
      />
    </ToastProvider>
  )
}
