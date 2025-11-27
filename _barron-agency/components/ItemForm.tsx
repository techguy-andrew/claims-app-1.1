'use client'

import * as React from 'react'
import { Button } from './Button'
import { Input, Textarea } from './Input'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Inline utility for merging Tailwind classes - makes component portable
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ItemFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmitForm?: (data: { title: string; description: string }) => void
  defaultValues?: {
    title?: string
    description?: string
  }
  submitLabel?: string
}

export function ItemForm({
  onSubmitForm,
  defaultValues,
  submitLabel = "Save Item",
  className,
  ...props
}: ItemFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSubmitForm?.({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
    })
  }

  return (
    <form
      className={cn("space-y-4", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input
          type="text"
          name="title"
          placeholder="Enter item title"
          defaultValue={defaultValues?.title}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          name="description"
          placeholder="Enter item description"
          rows={4}
          defaultValue={defaultValues?.description}
        />
      </div>
      <Button type="submit">{submitLabel}</Button>
    </form>
  )
}
