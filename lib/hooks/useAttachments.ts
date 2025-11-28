'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Attachment as PrismaAttachment } from '@prisma/client'
import type { ClaimWithItems } from './useClaims'

// UI-friendly attachment type that maps from Prisma schema
export interface Attachment {
  id: string
  name: string          // Maps from filename
  url: string
  thumbnailUrl?: string | null
  type: string          // Maps from mimeType
  size: number
  width?: number | null
  height?: number | null
  file?: File           // For local file handling before upload
}

// Helper to convert Prisma attachment to UI attachment
export function toUIAttachment(prismaAttachment: PrismaAttachment): Attachment {
  return {
    id: prismaAttachment.id,
    name: prismaAttachment.filename,
    url: prismaAttachment.url,
    thumbnailUrl: prismaAttachment.thumbnailUrl,
    type: prismaAttachment.mimeType,
    size: prismaAttachment.size,
    width: prismaAttachment.width,
    height: prismaAttachment.height,
  }
}

interface AddAttachmentsData {
  claimId: string
  itemId: string
  files: File[]
}

interface RemoveAttachmentData {
  claimId: string
  itemId: string
  attachmentId: string
}

// Add Attachments Mutation with Optimistic Update
export function useAddAttachments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AddAttachmentsData): Promise<PrismaAttachment[]> => {
      const formData = new FormData()
      data.files.forEach((file) => formData.append('files', file))

      const response = await fetch(
        `/api/claims/${data.claimId}/items/${data.itemId}/attachments`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload files')
      }

      return response.json()
    },

    onMutate: async (data) => {
      // Cancel outgoing queries for this claim
      await queryClient.cancelQueries({ queryKey: ['claims', data.claimId] })

      // Snapshot previous value
      const previousClaim = queryClient.getQueryData<ClaimWithItems>(['claims', data.claimId])

      // Create temporary attachments for optimistic update
      const tempAttachments: Attachment[] = data.files.map((file) => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        thumbnailUrl: null,
        type: file.type,
        size: file.size,
        width: null,
        height: null,
        file, // Include file for upload tracking
      }))

      // Optimistically add attachments to the item
      queryClient.setQueryData<ClaimWithItems>(['claims', data.claimId], (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === data.itemId
              ? {
                  ...item,
                  attachments: [
                    ...item.attachments,
                    // Convert UI attachments back to Prisma-like format for cache
                    ...tempAttachments.map((att) => ({
                      id: att.id,
                      itemId: data.itemId,
                      filename: att.name,
                      url: att.url,
                      thumbnailUrl: att.thumbnailUrl ?? null,
                      mimeType: att.type,
                      size: att.size,
                      width: att.width ?? null,
                      height: att.height ?? null,
                      publicId: '',
                      version: null,
                      format: null,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    })),
                  ],
                }
              : item
          ),
        }
      })

      return { previousClaim, tempAttachments, itemId: data.itemId }
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousClaim) {
        queryClient.setQueryData(['claims', variables.claimId], context.previousClaim)
      }

      // Clean up object URLs
      context?.tempAttachments.forEach((att) => {
        if (att.url.startsWith('blob:')) {
          URL.revokeObjectURL(att.url)
        }
      })
    },

    onSuccess: (result, variables, context) => {
      // Replace temp attachments with real ones from server
      queryClient.setQueryData<ClaimWithItems>(['claims', variables.claimId], (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((item) => {
            if (item.id === variables.itemId) {
              // Remove temp attachments and add real ones
              const existingAttachments = item.attachments.filter(
                (att) => !att.id.startsWith('temp-')
              )
              return {
                ...item,
                attachments: [...existingAttachments, ...result],
              }
            }
            return item
          }),
        }
      })

      // Clean up temp object URLs
      context?.tempAttachments.forEach((att) => {
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
    mutationFn: async (data: RemoveAttachmentData): Promise<{ success: boolean }> => {
      const response = await fetch(
        `/api/claims/${data.claimId}/items/${data.itemId}/attachments/${data.attachmentId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete attachment')
      }

      return response.json()
    },

    onMutate: async (data) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['claims', data.claimId] })

      // Snapshot previous value
      const previousClaim = queryClient.getQueryData<ClaimWithItems>(['claims', data.claimId])

      // Get the attachment being removed (for cleanup)
      const item = previousClaim?.items.find((i) => i.id === data.itemId)
      const removedAttachment = item?.attachments.find((a) => a.id === data.attachmentId)

      // Optimistically remove attachment
      queryClient.setQueryData<ClaimWithItems>(['claims', data.claimId], (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === data.itemId
              ? {
                  ...item,
                  attachments: item.attachments.filter(
                    (att) => att.id !== data.attachmentId
                  ),
                }
              : item
          ),
        }
      })

      return { previousClaim, removedAttachment }
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousClaim) {
        queryClient.setQueryData(['claims', variables.claimId], context.previousClaim)
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
