'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Item, Attachment } from '../types'

// Simulated API delay helper
const simulatedDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface AddAttachmentsData {
  itemId: string
  files: File[]
}

interface RemoveAttachmentData {
  itemId: string
  attachmentId: string
}

// Add Attachments Mutation with Optimistic Update
export function useAddAttachments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AddAttachmentsData) => {
      // Simulate file upload
      await simulatedDelay(500)

      // In real implementation:
      // const formData = new FormData()
      // data.files.forEach(file => formData.append('files', file))
      // const response = await fetch(`/api/items/${data.itemId}/attachments`, { method: 'POST', body: formData })

      // Server would return actual uploaded attachments
      const uploadedAttachments: Attachment[] = data.files.map(file => ({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size,
      }))

      return { itemId: data.itemId, attachments: uploadedAttachments }
    },

    onMutate: async (data) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['items'] })

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<Item[]>(['items'])

      // Create temporary attachments for optimistic update
      const tempAttachments: Attachment[] = data.files.map(file => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size,
        file, // Include file for upload tracking
      }))

      // Optimistically add attachments to item
      queryClient.setQueryData<Item[]>(['items'], (old = []) =>
        old.map(item =>
          item.id === data.itemId
            ? {
                ...item,
                attachments: [...(item.attachments || []), ...tempAttachments],
              }
            : item
        )
      )

      return { previousItems, tempAttachments }
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['items'], context.previousItems)
      }

      // Clean up object URLs
      context?.tempAttachments.forEach(att => {
        if (att.url.startsWith('blob:')) {
          URL.revokeObjectURL(att.url)
        }
      })
    },

    onSuccess: (result, variables, context) => {
      // Replace temp attachments with real ones
      queryClient.setQueryData<Item[]>(['items'], (old = []) =>
        old.map(item => {
          if (item.id === result.itemId) {
            // Remove temp attachments and add real ones
            const existingAttachments = (item.attachments || []).filter(
              att => !att.id.startsWith('temp-')
            )

            return {
              ...item,
              attachments: [...existingAttachments, ...result.attachments],
            }
          }
          return item
        })
      )

      // Clean up temp object URLs
      context?.tempAttachments.forEach(att => {
        if (att.url.startsWith('blob:')) {
          URL.revokeObjectURL(att.url)
        }
      })
    },
  })
}

// Remove Attachment Mutation with Optimistic Update
export function useRemoveAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RemoveAttachmentData) => {
      // Simulate API call
      await simulatedDelay(200)

      // In real implementation: await fetch(`/api/items/${data.itemId}/attachments/${data.attachmentId}`, { method: 'DELETE' })
      return data
    },

    onMutate: async (data) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['items'] })

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<Item[]>(['items'])

      // Get the attachment being removed (for cleanup)
      const item = previousItems?.find(i => i.id === data.itemId)
      const removedAttachment = item?.attachments?.find(a => a.id === data.attachmentId)

      // Optimistically remove attachment
      queryClient.setQueryData<Item[]>(['items'], (old = []) =>
        old.map(item =>
          item.id === data.itemId
            ? {
                ...item,
                attachments: (item.attachments || []).filter(
                  att => att.id !== data.attachmentId
                ),
              }
            : item
        )
      )

      return { previousItems, removedAttachment }
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['items'], context.previousItems)
      }
    },

    onSettled: (data, error, variables, context) => {
      // Clean up object URL if it was a blob URL
      if (context?.removedAttachment?.url.startsWith('blob:')) {
        URL.revokeObjectURL(context.removedAttachment.url)
      }
    },
  })
}
