'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Item } from '../types'

// Simulated API delay helper (matching demo page pattern)
const simulatedDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface CreateItemData {
  title: string
  description: string
}

interface UpdateItemData {
  id: string
  title: string
  description: string
}

interface DeleteItemData {
  id: string
}

interface ReorderItemsData {
  items: Item[]
}

// Create Item Mutation with Optimistic Update
export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateItemData) => {
      // Simulate API call
      await simulatedDelay(300)

      // In real implementation: const response = await fetch('/api/items', { method: 'POST', body: JSON.stringify(data) })
      const newItem: Item = {
        id: `${Date.now()}-${Math.random()}`, // Server would generate this
        ...data,
        order: 0,
        attachments: [],
      }

      return newItem
    },

    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['items'] })

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<Item[]>(['items'])

      // Optimistically update with temporary item
      const tempItem: Item = {
        id: `temp-${Date.now()}`, // Temporary ID
        ...data,
        order: 0,
        attachments: [],
      }

      queryClient.setQueryData<Item[]>(['items'], (old = []) => [tempItem, ...old])

      return { previousItems, tempItem }
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['items'], context.previousItems)
      }
    },

    onSuccess: (newItem, variables, context) => {
      // Replace temp item with real item from server
      queryClient.setQueryData<Item[]>(['items'], (old = []) =>
        old.map(item => (item.id === context?.tempItem.id ? newItem : item))
      )
    },
  })
}

// Update Item Mutation with Optimistic Update
export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateItemData) => {
      // Simulate API call
      await simulatedDelay(300)

      // In real implementation: await fetch(`/api/items/${data.id}`, { method: 'PATCH', body: JSON.stringify(data) })
      return data
    },

    onMutate: async (data) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['items'] })

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<Item[]>(['items'])

      // Optimistically update
      queryClient.setQueryData<Item[]>(['items'], (old = []) =>
        old.map(item =>
          item.id === data.id
            ? { ...item, title: data.title, description: data.description }
            : item
        )
      )

      return { previousItems }
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['items'], context.previousItems)
      }
    },
  })
}

// Delete Item Mutation with Optimistic Update
export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: DeleteItemData) => {
      // Simulate API call
      await simulatedDelay(200)

      // In real implementation: await fetch(`/api/items/${data.id}`, { method: 'DELETE' })
      return data
    },

    onMutate: async (data) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['items'] })

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<Item[]>(['items'])

      // Optimistically remove item
      queryClient.setQueryData<Item[]>(['items'], (old = []) =>
        old.filter(item => item.id !== data.id)
      )

      return { previousItems }
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['items'], context.previousItems)
      }
    },
  })
}

// Duplicate Item Mutation with Optimistic Update
export function useDuplicateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: string) => {
      // Simulate API call
      await simulatedDelay(300)

      // Get the original item
      const items = queryClient.getQueryData<Item[]>(['items']) || []
      const original = items.find(item => item.id === itemId)

      if (!original) throw new Error('Item not found')

      // Server would create duplicate
      const duplicate: Item = {
        ...original,
        id: `${Date.now()}-${Math.random()}`,
        title: `${original.title} (Copy)`,
      }

      return duplicate
    },

    onMutate: async (itemId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['items'] })

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<Item[]>(['items'])

      // Get original item
      const items = previousItems || []
      const original = items.find(item => item.id === itemId)

      if (original) {
        // Optimistically add duplicate with temp ID
        const tempDuplicate: Item = {
          ...original,
          id: `temp-${Date.now()}`,
          title: `${original.title} (Copy)`,
        }

        const originalIndex = items.findIndex(item => item.id === itemId)
        const newItems = [...items]
        newItems.splice(originalIndex + 1, 0, tempDuplicate)

        queryClient.setQueryData<Item[]>(['items'], newItems)

        return { previousItems, tempDuplicate }
      }

      return { previousItems }
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['items'], context.previousItems)
      }
    },

    onSuccess: (duplicate, variables, context) => {
      // Replace temp duplicate with real one
      if (context?.tempDuplicate) {
        queryClient.setQueryData<Item[]>(['items'], (old = []) =>
          old.map(item => (item.id === context.tempDuplicate.id ? duplicate : item))
        )
      }
    },
  })
}

// Reorder Items Mutation with Optimistic Update
export function useReorderItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ReorderItemsData) => {
      // Simulate API call
      await simulatedDelay(100)

      // In real implementation: await fetch('/api/items/reorder', { method: 'POST', body: JSON.stringify(data) })
      return data.items
    },

    onMutate: async (data) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['items'] })

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<Item[]>(['items'])

      // Optimistically update order
      queryClient.setQueryData<Item[]>(['items'], data.items)

      return { previousItems }
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['items'], context.previousItems)
      }
    },
  })
}
