'use client'

import React, { useState, useRef, use, useMemo } from 'react'
import Link from 'next/link'
import { Reorder, useDragControls } from 'framer-motion'
import { toast, Toaster, ToastProvider, ToastRegistry } from '@/_barron-agency/components/Toast'
import { PlusIcon } from '@/_barron-agency/icons/PlusIcon'
import { GripVerticalIcon } from '@/_barron-agency/icons/GripVerticalIcon'
import { ItemCard } from '@/_barron-agency/components/ItemCard'
import { Button } from '@/_barron-agency/components/Button'
import { PageHeader } from '@/_barron-agency/components/PageHeader'
import { EmptyState } from '@/_barron-agency/components/EmptyState'
import { Badge } from '@/_barron-agency/components/Badge'
import { Card, CardContent } from '@/_barron-agency/components/Card'
import { Skeleton } from '@/_barron-agency/components/Skeleton'
import { useClaim, ClaimStatus } from '@/lib/hooks/useClaims'
import {
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useReorderItems,
  type ItemWithAttachments,
} from '@/lib/hooks/useItems'

// Draft item type that can be mixed with real items
interface DraftItem {
  id: string
  title: string
  description: string
  order: number
  claimId: string
  createdAt: Date
  updatedAt: Date
  attachments: []
  isDraft: true
}

// Combined type for items array (real items + draft)
type DisplayItem = ItemWithAttachments | DraftItem

function isDraftItem(item: DisplayItem): item is DraftItem {
  return 'isDraft' in item && item.isDraft === true
}

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

function formatStatus(status: ClaimStatus): string {
  return status.replace('_', ' ')
}

// ReorderableItem component for drag-and-drop - handles both draft and real items
interface ReorderableItemProps {
  item: DisplayItem
  claimId: string
  editingItemId: string | null
  onEdit: (id: string) => void
  onSave: (id: string, data: { title: string; description: string }) => void
  onCancel: (id: string) => void
  onDelete: (id: string) => void
  autoFocus?: boolean
  isSaving?: boolean
}

function ReorderableItem({
  item,
  claimId,
  editingItemId,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  autoFocus,
  isSaving,
}: ReorderableItemProps) {
  const dragControls = useDragControls()
  const isEditing = editingItemId === item.id
  const itemIsDraft = isDraftItem(item)

  // Memoize attachments transformation to prevent infinite re-render loop
  // Draft items have empty attachments array
  const attachments = useMemo(() => {
    if (itemIsDraft) return []
    return item.attachments.map((a) => ({
      id: a.id,
      name: a.filename,
      url: a.url,
      type: a.mimeType,
      size: a.size,
    }))
  }, [item, itemIsDraft])

  // Only animate on initial appear for new draft items
  const shouldAnimateIn = itemIsDraft && !isSaving

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      initial={shouldAnimateIn ? { opacity: 0, y: -8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldAnimateIn ? { duration: 0.2, ease: 'easeOut' } : { duration: 0 }}
      className="relative"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-start gap-2 w-full">
        {/* Drag Handle - disabled for draft items */}
        <div
          className={`flex-shrink-0 pt-6 ${itemIsDraft ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
          onPointerDown={(e) => {
            if (!isEditing && !itemIsDraft) {
              dragControls.start(e)
            }
          }}
        >
          <GripVerticalIcon className={`h-5 w-5 ${itemIsDraft ? 'text-muted-foreground/30' : 'text-muted-foreground hover:text-foreground'} transition-colors`} />
        </div>

        {/* Item Card */}
        <div className="flex-1 min-w-0">
          <ItemCard
            itemId={itemIsDraft ? undefined : item.id}
            title={item.title}
            description={item.description}
            editable={true}
            onEdit={() => onEdit(item.id)}
            onSave={(data) => onSave(item.id, data)}
            onCancel={() => onCancel(item.id)}
            onDelete={itemIsDraft ? undefined : () => onDelete(item.id)}
            autoFocus={autoFocus}
            attachments={attachments}
            isSaving={isSaving}
            titlePlaceholder="Enter item title..."
            descriptionPlaceholder="Enter item description..."
          />
        </div>
      </div>
    </Reorder.Item>
  )
}

export default function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: claimId } = use(params)
  const { data: claim, isLoading, error } = useClaim(claimId)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [savingItemId, setSavingItemId] = useState<string | null>(null)
  const [draftItem, setDraftItem] = useState<DraftItem | null>(null)
  const stableKeysRef = useRef<Map<string, string>>(new Map())

  // React Query mutations
  const createItemMutation = useCreateItem()
  const updateItemMutation = useUpdateItem()
  const deleteItemMutation = useDeleteItem()
  const reorderItemsMutation = useReorderItems()

  // Combine draft item with real items into a single array for unified rendering
  const realItems = claim?.items ?? []
  const displayItems: DisplayItem[] = useMemo(() => {
    if (draftItem) {
      return [draftItem, ...realItems]
    }
    return realItems
  }, [draftItem, realItems])

  // Handle adding a new item - creates a local draft at the top of the list
  const handleNewItem = () => {
    // Don't allow creating another draft if one exists
    if (draftItem) return

    const draftId = `draft-${Date.now()}`
    const newDraft: DraftItem = {
      id: draftId,
      title: '',
      description: '',
      order: -1, // Place at top
      claimId,
      createdAt: new Date(),
      updatedAt: new Date(),
      attachments: [],
      isDraft: true,
    }
    setDraftItem(newDraft)
    setEditingItemId(draftId)
  }

  // Handle editing an item
  const handleEdit = (id: string) => {
    setEditingItemId(id)
  }

  // Handle saving an item with optimistic update
  const handleSave = async (id: string, data: { title: string; description: string }) => {
    // Validate that title is not empty
    if (!data.title.trim()) {
      toast.error('Title is required')
      return
    }

    setSavingItemId(id)

    // Check if this is a draft item (new item not yet in DB)
    if (draftItem && draftItem.id === id) {
      try {
        // Update the draft item's content optimistically while saving
        // This keeps the content visible during the save
        setDraftItem({
          ...draftItem,
          title: data.title,
          description: data.description,
        })

        await createItemMutation.mutateAsync({
          claimId,
          title: data.title,
          description: data.description,
          order: 0,
        })

        // Clear the draft - the real item now exists in the cache
        setDraftItem(null)
        setEditingItemId(null)
        toast.success('Item created')
      } catch (error) {
        toast.error('Failed to create item')
        console.error('Create error:', error)
      } finally {
        setSavingItemId(null)
      }
      return
    }

    // Existing item - update it
    try {
      await updateItemMutation.mutateAsync({
        claimId,
        id,
        ...data,
      })
      setEditingItemId(null)
      toast.success('Item saved')
    } catch (error) {
      toast.error('Failed to save item')
      console.error('Save error:', error)
    } finally {
      setSavingItemId(null)
    }
  }

  // Handle canceling edit
  const handleCancel = (id: string) => {
    // If it's a draft item, just remove it locally (no DB call needed)
    if (draftItem && draftItem.id === id) {
      setDraftItem(null)
      setEditingItemId(null)
      return
    }

    setEditingItemId(null)
  }

  // Handle deleting an item with optimistic update
  const handleDelete = async (id: string) => {
    try {
      await deleteItemMutation.mutateAsync({ claimId, id })
      stableKeysRef.current.delete(id)

      if (editingItemId === id) {
        setEditingItemId(null)
      }

      toast.success('Item deleted')
    } catch (error) {
      toast.error('Failed to delete item')
      console.error('Delete error:', error)
    }
  }

  // Handle reordering items with optimistic update
  // Only reorder real items, not draft items
  const handleReorder = async (newOrder: DisplayItem[]) => {
    // Filter out draft items - they shouldn't be reordered
    const realItemsOnly = newOrder.filter((item): item is ItemWithAttachments => !isDraftItem(item))

    const reorderedItems = realItemsOnly.map((item, index) => ({
      id: item.id,
      order: index,
    }))

    if (reorderedItems.length === 0) return

    try {
      await reorderItemsMutation.mutateAsync({
        claimId,
        items: reorderedItems,
      })
    } catch (error) {
      toast.error('Failed to update order')
      console.error('Reorder error:', error)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <PageHeader title="Claim Not Found" />
          <EmptyState
            title="Error loading claim"
            description="The claim could not be found or there was an error loading it."
          />
          <div className="mt-4">
            <Link href="/claims">
              <Button variant="outline">Back to Claims</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-1/2" />
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <ToastRegistry />
      <Toaster />
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Link */}
          <Link
            href="/claims"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Claims
          </Link>

          {/* Claim Header */}
          <PageHeader
            title={claim?.title ?? 'Claim'}
            description={claim?.description ?? undefined}
          />

          {/* Claim Info Card */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <Badge variant={getStatusVariant(claim?.status ?? 'PENDING')}>
                  {formatStatus(claim?.status ?? 'PENDING')}
                </Badge>
                <span className="font-mono text-sm text-muted-foreground">
                  #{claim?.claimNumber}
                </span>
                {claim?.customer && (
                  <span className="text-sm text-muted-foreground">
                    {claim.customer}
                  </span>
                )}
              </div>

              {/* Adjustor Info */}
              {(claim?.adjustorName || claim?.adjustorPhone || claim?.adjustorEmail) && (
                <div className="pt-4 border-t space-y-1 text-sm">
                  <p className="font-medium">Adjustor</p>
                  {claim?.adjustorName && <p className="text-muted-foreground">{claim.adjustorName}</p>}
                  {claim?.adjustorPhone && <p className="text-muted-foreground">Phone: {claim.adjustorPhone}</p>}
                  {claim?.adjustorEmail && <p className="text-muted-foreground">Email: {claim.adjustorEmail}</p>}
                </div>
              )}

              {/* Claimant Info */}
              {(claim?.claimantName || claim?.claimantPhone || claim?.claimantEmail || claim?.claimantAddress) && (
                <div className="pt-4 border-t space-y-1 text-sm">
                  <p className="font-medium">Claimant</p>
                  {claim?.claimantName && <p className="text-muted-foreground">{claim.claimantName}</p>}
                  {claim?.claimantPhone && <p className="text-muted-foreground">Phone: {claim.claimantPhone}</p>}
                  {claim?.claimantEmail && <p className="text-muted-foreground">Email: {claim.claimantEmail}</p>}
                  {claim?.claimantAddress && <p className="text-muted-foreground">Address: {claim.claimantAddress}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items Section */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {realItems.length} {realItems.length === 1 ? 'item' : 'items'}
            </div>
            <Button onClick={handleNewItem} className="gap-2" disabled={!!draftItem}>
              <PlusIcon className="h-4 w-4" />
              Add Item
            </Button>
          </div>

          {/* Items List - unified rendering for both draft and real items */}
          <div className="flex flex-col gap-4 w-full">
            {displayItems.length === 0 ? (
              <EmptyState
                title="No items yet"
                description="Click 'Add Item' to add items to this claim."
              />
            ) : (
              <Reorder.Group
                axis="y"
                values={displayItems}
                onReorder={handleReorder}
                className="flex flex-col gap-4 w-full touch-pan-y select-none"
              >
                {displayItems.map((item) => {
                  const stableKey = stableKeysRef.current.get(item.id) || item.id

                  return (
                    <ReorderableItem
                      key={stableKey}
                      item={item}
                      claimId={claimId}
                      editingItemId={editingItemId}
                      onEdit={handleEdit}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      onDelete={handleDelete}
                      autoFocus={editingItemId === item.id}
                      isSaving={savingItemId === item.id}
                    />
                  )
                })}
              </Reorder.Group>
            )}
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}
