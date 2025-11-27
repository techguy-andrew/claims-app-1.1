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

export interface SettingsFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmitForm?: (data: { name: string; email: string; bio: string }) => void
  defaultValues?: {
    name?: string
    email?: string
    bio?: string
  }
  submitLabel?: string
}

export function SettingsForm({
  onSubmitForm,
  defaultValues,
  submitLabel = "Save Settings",
  className,
  ...props
}: SettingsFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSubmitForm?.({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      bio: formData.get('bio') as string,
    })
  }

  return (
    <form
      className={cn("space-y-4", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium">Display Name</label>
        <Input
          type="text"
          name="name"
          placeholder="Your name"
          defaultValue={defaultValues?.name}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          name="email"
          placeholder="you@example.com"
          defaultValue={defaultValues?.email}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Bio</label>
        <Textarea
          name="bio"
          placeholder="Tell us about yourself"
          rows={4}
          defaultValue={defaultValues?.bio}
        />
      </div>
      <Button type="submit">{submitLabel}</Button>
    </form>
  )
}
