'use client'

import * as React from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Inline utility for merging Tailwind classes - makes component portable
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface LoginFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmitForm?: (data: { email: string; password: string }) => void
  submitLabel?: string
}

export function LoginForm({
  onSubmitForm,
  submitLabel = "Sign In",
  className,
  ...props
}: LoginFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSubmitForm?.({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
  }

  return (
    <form
      className={cn("space-y-4", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          name="email"
          placeholder="you@example.com"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <Input
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
      </div>
      <Button type="submit" className="w-full">{submitLabel}</Button>
    </form>
  )
}
