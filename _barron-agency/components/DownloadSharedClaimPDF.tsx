'use client'

import React, { useState } from 'react'
import { Button } from './Button'
import { DownloadIcon } from '../icons/DownloadIcon'
import { SpinnerIcon } from '../icons/SpinnerIcon'
import { toast } from './Toast'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface DownloadSharedClaimPDFProps {
  /** The share token for the claim */
  token: string
  /** The claim number for the filename */
  claimNumber: string
  /** Optional additional class names */
  className?: string
}

export function DownloadSharedClaimPDF({
  token,
  claimNumber,
  className,
}: DownloadSharedClaimPDFProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/share/${token}/pdf`)

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Claim-${claimNumber}.pdf`

      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('PDF download error:', error)
      toast.error('Failed to download PDF')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={isLoading}
      className={cn('gap-2', className)}
    >
      {isLoading ? (
        <SpinnerIcon className="h-4 w-4 animate-spin" />
      ) : (
        <DownloadIcon className="h-4 w-4" />
      )}
      {isLoading ? 'Generating...' : 'Download PDF'}
    </Button>
  )
}
