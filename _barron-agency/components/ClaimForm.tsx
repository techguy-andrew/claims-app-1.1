'use client'

import * as React from 'react'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Input } from './Input'
import { Button } from './Button'

// Inline utility for merging Tailwind classes - makes component portable
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ClaimFormData {
  title: string
  customer: string
  adjustorName: string
  adjustorPhone: string
  adjustorEmail: string
  claimantName: string
  claimantPhone: string
  claimantEmail: string
  claimantAddress: string
}

export interface ClaimFormProps {
  onFormSubmit: (data: ClaimFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
  initialData?: Partial<ClaimFormData>
  className?: string
  onDirtyChange?: (isDirty: boolean) => void
}

export function ClaimForm({
  onFormSubmit,
  onCancel,
  isSubmitting = false,
  initialData,
  className,
  onDirtyChange,
}: ClaimFormProps) {
  const [formData, setFormData] = React.useState<ClaimFormData>({
    title: initialData?.title ?? '',
    customer: initialData?.customer ?? '',
    adjustorName: initialData?.adjustorName ?? '',
    adjustorPhone: initialData?.adjustorPhone ?? '',
    adjustorEmail: initialData?.adjustorEmail ?? '',
    claimantName: initialData?.claimantName ?? '',
    claimantPhone: initialData?.claimantPhone ?? '',
    claimantEmail: initialData?.claimantEmail ?? '',
    claimantAddress: initialData?.claimantAddress ?? '',
  })

  // Check if form has any values (is dirty)
  const isDirty = React.useMemo(() => {
    return Object.values(formData).some((value) => value.trim() !== '')
  }, [formData])

  // Notify parent when dirty state changes
  React.useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    onFormSubmit(formData)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-4', className)}
    >
      {/* Claim Number */}
      <div className="space-y-2">
        <label
          htmlFor="title"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Claim Number <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          name="title"
          placeholder="Enter claim number"
          value={formData.title}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Customer */}
      <div className="space-y-2">
        <label
          htmlFor="customer"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Customer
        </label>
        <Input
          id="customer"
          name="customer"
          placeholder="Customer name"
          value={formData.customer}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      {/* Adjustor Section */}
      <div className="space-y-2">
        <label
          htmlFor="adjustorName"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Adjustor Name
        </label>
        <Input
          id="adjustorName"
          name="adjustorName"
          placeholder="Adjustor name"
          value={formData.adjustorName}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="adjustorPhone"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Adjustor Phone
          </label>
          <Input
            id="adjustorPhone"
            name="adjustorPhone"
            type="tel"
            placeholder="Phone number"
            value={formData.adjustorPhone}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="adjustorEmail"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Adjustor Email
          </label>
          <Input
            id="adjustorEmail"
            name="adjustorEmail"
            type="email"
            placeholder="Email address"
            value={formData.adjustorEmail}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Claimant Section */}
      <div className="space-y-2">
        <label
          htmlFor="claimantName"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Claimant Name
        </label>
        <Input
          id="claimantName"
          name="claimantName"
          placeholder="Claimant name"
          value={formData.claimantName}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="claimantPhone"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Claimant Phone
          </label>
          <Input
            id="claimantPhone"
            name="claimantPhone"
            type="tel"
            placeholder="Phone number"
            value={formData.claimantPhone}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="claimantEmail"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Claimant Email
          </label>
          <Input
            id="claimantEmail"
            name="claimantEmail"
            type="email"
            placeholder="Email address"
            value={formData.claimantEmail}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="claimantAddress"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Claimant Address
        </label>
        <Input
          id="claimantAddress"
          name="claimantAddress"
          placeholder="Address"
          value={formData.claimantAddress}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
          {isSubmitting ? 'Creating...' : 'Create Claim'}
        </Button>
      </div>
    </form>
  )
}
