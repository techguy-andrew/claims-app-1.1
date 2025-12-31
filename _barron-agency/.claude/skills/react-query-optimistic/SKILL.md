---
name: react-query-optimistic
description: React Query patterns with optimistic updates for professional UX. Use when implementing data fetching, mutations, or state management with React Query.
---

# React Query Optimistic Updates

Professional UX means no loading spinners for user actions. This skill covers optimistic update patterns.

## Philosophy

> The burden of proof is on the loading spinner, not the optimistic update. 
> Loading spinners say "the software is working." 
> Optimistic updates say "it's done."

## Query Key Convention

```typescript
// Hierarchical keys for cache invalidation
const queryKeys = {
  claims: ['claims'] as const,
  claim: (id: string) => ['claims', id] as const,
  claimItems: (claimId: string) => ['claims', claimId, 'items'] as const,
  item: (claimId: string, itemId: string) => 
    ['claims', claimId, 'items', itemId] as const,
  attachments: (claimId: string, itemId: string) =>
    ['claims', claimId, 'items', itemId, 'attachments'] as const,
}
```

## Basic Query Pattern

```typescript
// lib/hooks/useClaims.ts
import { useQuery } from '@tanstack/react-query'

export function useClaims() {
  return useQuery({
    queryKey: queryKeys.claims,
    queryFn: async () => {
      const res = await fetch('/api/claims')
      if (!res.ok) throw new Error('Failed to fetch claims')
      return res.json() as Promise<Claim[]>
    },
  })
}

export function useClaim(id: string) {
  return useQuery({
    queryKey: queryKeys.claim(id),
    queryFn: async () => {
      const res = await fetch(`/api/claims/${id}`)
      if (!res.ok) throw new Error('Failed to fetch claim')
      return res.json() as Promise<Claim>
    },
    enabled: !!id,
  })
}
```

## Optimistic Create

```typescript
export function useCreateItem(claimId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateItemInput) => {
      const res = await fetch(`/api/claims/${claimId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create item')
      return res.json() as Promise<Item>
    },

    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.claimItems(claimId),
      })

      // Snapshot current state
      const previousItems = queryClient.getQueryData<Item[]>(
        queryKeys.claimItems(claimId)
      )

      // Optimistically add item
      const optimisticItem: Item = {
        id: `temp-${Date.now()}`,
        ...newItem,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: [],
      }

      queryClient.setQueryData<Item[]>(
        queryKeys.claimItems(claimId),
        (old) => [...(old || []), optimisticItem]
      )

      return { previousItems }
    },

    onError: (err, newItem, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(
          queryKeys.claimItems(claimId),
          context.previousItems
        )
      }
      toast.error('Failed to create item')
    },

    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({
        queryKey: queryKeys.claimItems(claimId),
      })
    },
  })
}
```

## Optimistic Update

```typescript
export function useUpdateItem(claimId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, data }: UpdateItemInput) => {
      const res = await fetch(`/api/claims/${claimId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update item')
      return res.json() as Promise<Item>
    },

    onMutate: async ({ itemId, data }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.claimItems(claimId),
      })

      const previousItems = queryClient.getQueryData<Item[]>(
        queryKeys.claimItems(claimId)
      )

      // Optimistically update
      queryClient.setQueryData<Item[]>(
        queryKeys.claimItems(claimId),
        (old) =>
          old?.map((item) =>
            item.id === itemId
              ? { ...item, ...data, updatedAt: new Date().toISOString() }
              : item
          )
      )

      return { previousItems }
    },

    onError: (err, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(
          queryKeys.claimItems(claimId),
          context.previousItems
        )
      }
      toast.error('Failed to update item')
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.claimItems(claimId),
      })
    },
  })
}
```

## Optimistic Delete

```typescript
export function useDeleteItem(claimId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/claims/${claimId}/items/${itemId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete item')
    },

    onMutate: async (itemId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.claimItems(claimId),
      })

      const previousItems = queryClient.getQueryData<Item[]>(
        queryKeys.claimItems(claimId)
      )

      // Optimistically remove
      queryClient.setQueryData<Item[]>(
        queryKeys.claimItems(claimId),
        (old) => old?.filter((item) => item.id !== itemId)
      )

      return { previousItems }
    },

    onError: (err, itemId, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(
          queryKeys.claimItems(claimId),
          context.previousItems
        )
      }
      toast.error('Failed to delete item')
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.claimItems(claimId),
      })
    },
  })
}
```

## File Upload with Progress

```typescript
export function useUploadAttachment(claimId: string, itemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(
        `/api/claims/${claimId}/items/${itemId}/attachments`,
        {
          method: 'POST',
          body: formData,
        }
      )
      if (!res.ok) throw new Error('Failed to upload')
      return res.json() as Promise<Attachment>
    },

    onMutate: async (file) => {
      // Show optimistic placeholder
      const optimisticAttachment: Attachment = {
        id: `uploading-${Date.now()}`,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        url: URL.createObjectURL(file), // Local preview
        publicId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<Attachment[]>(
        queryKeys.attachments(claimId, itemId),
        (old) => [...(old || []), optimisticAttachment]
      )

      return { optimisticId: optimisticAttachment.id }
    },

    onSuccess: (data, file, context) => {
      // Replace optimistic with real data
      queryClient.setQueryData<Attachment[]>(
        queryKeys.attachments(claimId, itemId),
        (old) =>
          old?.map((a) =>
            a.id === context?.optimisticId ? data : a
          )
      )
    },

    onError: (err, file, context) => {
      // Remove optimistic entry
      queryClient.setQueryData<Attachment[]>(
        queryKeys.attachments(claimId, itemId),
        (old) => old?.filter((a) => a.id !== context?.optimisticId)
      )
      toast.error(`Failed to upload ${file.name}`)
    },
  })
}
```

## Provider Setup

```typescript
// _barron-agency/providers/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```