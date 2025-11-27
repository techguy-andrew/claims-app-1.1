'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Item, Attachment } from '@prisma/client'
import type { ClaimWithItems } from './useClaims'

// Item with attachments
export interface ItemWithAttachments extends Item {
  attachments: Attachment[]
}

interface CreateItemData {
  claimId: string
  title: string
  description: string
  order?: number
}

interface UpdateItemData {
  claimId: string
  id: string
  title: string
  description: string
}

interface DeleteItemData {
  claimId: string
  id: string
}

interface ReorderItemsData {
  claimId: string
  items: Array<{ id: string; order: number }>
}

// Create Item Mutation - adds item to list after server confirms
// No optimistic update here since we use a local draft card pattern in the UI
export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateItemData): Promise<ItemWithAttachments> => {
      const response = await fetch(`/api/claims/${data.claimId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          order: data.order,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create item')
      }

      return response.json()
    },

    onSuccess: (newItem, variables) => {
      // Add the new item to the list after server confirms
      queryClient.setQueryData<ClaimWithItems>(['claims', variables.claimId], (old) => {
        if (!old) return old
        return {
          ...old,
          items: [newItem, ...old.items],
        }
      })
    },
  })
}

// Update Item Mutation with Optimistic Update
export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateItemData): Promise<ItemWithAttachments> => {
      const response = await fetch(`/api/claims/${data.claimId}/items/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update item')
      }

      return response.json()
    },

    onMutate: async (data) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['claims', data.claimId] })

      // Snapshot previous value
      const previousClaim = queryClient.getQueryData<ClaimWithItems>(['claims', data.claimId])

      // Optimistically update
      queryClient.setQueryData<ClaimWithItems>(['claims', data.claimId], (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === data.id
              ? { ...item, title: data.title, description: data.description }
              : item
          ),
        }
      })

      return { previousClaim }
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousClaim) {
        queryClient.setQueryData(['claims', variables.claimId], context.previousClaim)
      }
    },
  })
}

// Delete Item Mutation with Optimistic Update
export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: DeleteItemData): Promise<void> => {
      const response = await fetch(`/api/claims/${data.claimId}/items/${data.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }
    },

    onMutate: async (data) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['claims', data.claimId] })

      // Snapshot previous value
      const previousClaim = queryClient.getQueryData<ClaimWithItems>(['claims', data.claimId])

      // Optimistically remove item
      queryClient.setQueryData<ClaimWithItems>(['claims', data.claimId], (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.filter((item) => item.id !== data.id),
        }
      })

      return { previousClaim }
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousClaim) {
        queryClient.setQueryData(['claims', variables.claimId], context.previousClaim)
      }
    },
  })
}

// Reorder Items Mutation with Optimistic Update
export function useReorderItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ReorderItemsData): Promise<ItemWithAttachments[]> => {
      const response = await fetch(`/api/claims/${data.claimId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: data.items }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder items')
      }

      return response.json()
    },

    onMutate: async (data) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['claims', data.claimId] })

      // Snapshot previous value
      const previousClaim = queryClient.getQueryData<ClaimWithItems>(['claims', data.claimId])

      // Optimistically update order
      queryClient.setQueryData<ClaimWithItems>(['claims', data.claimId], (old) => {
        if (!old) return old

        // Create a map of new orders
        const orderMap = new Map(data.items.map((i) => [i.id, i.order]))

        // Update items with new orders and sort
        const updatedItems = old.items
          .map((item) => ({
            ...item,
            order: orderMap.get(item.id) ?? item.order,
          }))
          .sort((a, b) => a.order - b.order)

        return {
          ...old,
          items: updatedItems,
        }
      })

      return { previousClaim }
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousClaim) {
        queryClient.setQueryData(['claims', variables.claimId], context.previousClaim)
      }
    },
  })
}
