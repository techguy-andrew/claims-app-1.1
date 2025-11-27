'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Claim, Item, Attachment } from '@prisma/client'
import { ClaimStatus } from '@prisma/client'

// Types for API responses
export interface ClaimWithCount extends Claim {
  claimant: {
    id: string
    name: string | null
    email: string
  }
  _count: {
    items: number
  }
}

// Input type for creating a claim
export interface CreateClaimInput {
  title: string
  customer?: string
  adjustorName?: string
  adjustorPhone?: string
  adjustorEmail?: string
  claimantName?: string
  claimantPhone?: string
  claimantEmail?: string
  claimantAddress?: string
}

export interface ClaimWithItems extends Claim {
  claimant: {
    id: string
    name: string | null
    email: string
  }
  items: (Item & {
    attachments: Attachment[]
  })[]
}

// Fetch all claims
export function useClaims() {
  return useQuery({
    queryKey: ['claims'],
    queryFn: async (): Promise<ClaimWithCount[]> => {
      const response = await fetch('/api/claims')
      if (!response.ok) {
        throw new Error('Failed to fetch claims')
      }
      return response.json()
    },
  })
}

// Fetch single claim with items
export function useClaim(claimId: string | undefined) {
  return useQuery({
    queryKey: ['claims', claimId],
    queryFn: async (): Promise<ClaimWithItems> => {
      const response = await fetch(`/api/claims/${claimId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch claim')
      }
      return response.json()
    },
    enabled: !!claimId,
  })
}

// Re-export the ClaimStatus enum for convenience
export { ClaimStatus }

// Create Claim Mutation with Optimistic Update
export function useCreateClaim() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateClaimInput): Promise<ClaimWithCount> => {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create claim')
      }

      return response.json()
    },

    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['claims'] })

      // Snapshot previous value
      const previousClaims = queryClient.getQueryData<ClaimWithCount[]>(['claims'])

      // Optimistically update with temporary claim
      const tempClaim: ClaimWithCount = {
        id: `temp-${Date.now()}`,
        title: data.title,
        description: null,
        amount: null,
        status: ClaimStatus.PENDING,
        claimNumber: `TEMP-${Date.now()}`,
        customer: data.customer || null,
        adjustorName: data.adjustorName || null,
        adjustorPhone: data.adjustorPhone || null,
        adjustorEmail: data.adjustorEmail || null,
        claimantName: data.claimantName || null,
        claimantPhone: data.claimantPhone || null,
        claimantEmail: data.claimantEmail || null,
        claimantAddress: data.claimantAddress || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        claimantId: 'temp',
        claimant: {
          id: 'temp',
          name: 'Loading...',
          email: '',
        },
        _count: {
          items: 0,
        },
      }

      queryClient.setQueryData<ClaimWithCount[]>(['claims'], (old) => {
        return [tempClaim, ...(old || [])]
      })

      return { previousClaims, tempClaim }
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousClaims) {
        queryClient.setQueryData(['claims'], context.previousClaims)
      }
    },

    onSuccess: (newClaim, variables, context) => {
      // Replace temp claim with real claim from server
      queryClient.setQueryData<ClaimWithCount[]>(['claims'], (old) => {
        if (!old) return [newClaim]
        return old.map((claim) =>
          claim.id === context?.tempClaim.id ? newClaim : claim
        )
      })
    },
  })
}
