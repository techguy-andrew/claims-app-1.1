"use client"

import React, { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { useDropzone } from "react-dropzone"
import { CancelIcon } from "../icons/CancelIcon"
import { DownloadIcon } from "../icons/DownloadIcon"
import { FileIcon } from "../icons/FileIcon"
import { UploadIcon } from "../icons/UploadIcon"
import { SpinnerIcon } from "../icons/SpinnerIcon"
import { Button } from "./Button"

// Dynamic imports to avoid SSR issues with pdf.js (uses browser APIs like DOMMatrix)
const PdfViewer = dynamic(
  () => import("./PdfViewer").then((mod) => ({ default: mod.PdfViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Loading PDF viewer...
      </div>
    ),
  }
)

const PdfThumbnail = dynamic(
  () => import("./PdfThumbnail").then((mod) => ({ default: mod.PdfThumbnail })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <SpinnerIcon className="h-6 w-6 text-muted-foreground" />
      </div>
    ),
  }
)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./Dialog"
import { ConfirmationDialog } from "./ConfirmationDialog"
import type { Attachment } from "../types"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Inline utility for merging Tailwind classes - makes component portable
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface FileGalleryProps {
  attachments?: Attachment[]
  onFilesAdded?: (files: File[]) => void
  onFileRemove?: (attachmentId: string) => void
  editable?: boolean
  maxFiles?: number
}

export function FileGallery({
  attachments = [],
  onFilesAdded,
  onFileRemove,
  editable = true,
  maxFiles = 10,
}: FileGalleryProps) {
  const [selectedFile, setSelectedFile] = useState<Attachment | null>(null)
  const [fileToDelete, setFileToDelete] = useState<Attachment | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (onFilesAdded) {
        onFilesAdded(acceptedFiles)
      }
    },
    [onFilesAdded]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - attachments.length,
    disabled: !editable || attachments.length >= maxFiles,
  })

  const isImage = (type: string) => type.startsWith("image/")
  const isPdf = (type: string) => type === "application/pdf"
  const isVideo = (type: string) => type.startsWith("video/")

  const handleRemoveClick = (e: React.MouseEvent, attachment: Attachment) => {
    e.stopPropagation()
    setFileToDelete(attachment)
  }

  const handleConfirmDelete = () => {
    if (fileToDelete && onFileRemove) {
      onFileRemove(fileToDelete.id)
    }
    setFileToDelete(null)
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      // Build query params with publicId for server-side signed URL generation
      const resourceType = attachment.type.startsWith('image/') ? 'image' : 'raw'
      const params = new URLSearchParams({
        publicId: attachment.publicId,
        resourceType,
        filename: attachment.name,
      })
      if (attachment.format) params.set('format', attachment.format)

      const response = await fetch(`/api/download?${params}`)
      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = attachment.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download error:', error)
      // Fallback to opening in new tab if download fails
      window.open(attachment.url, '_blank')
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Dropzone */}
      {editable && attachments.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <UploadIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? "Drop files here..."
              : "Drag and drop files here, or click to select"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {attachments.length}/{maxFiles} files uploaded
          </p>
        </div>
      )}

      {/* File Grid */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {attachments.map((attachment) => {
            const isUploading = attachment.id.startsWith('temp-')

            return (
              <div
                key={attachment.id}
                className="relative group cursor-pointer"
                onClick={() => !isUploading && setSelectedFile(attachment)}
              >
                <div className="aspect-square rounded-lg border bg-muted overflow-hidden">
                  {isImage(attachment.type) ? (
                    <img
                      src={attachment.thumbnailUrl || attachment.url}
                      alt={attachment.name}
                      className={cn(
                        "w-full h-full object-cover",
                        isUploading && "opacity-50"
                      )}
                    />
                  ) : isPdf(attachment.type) && !isUploading ? (
                    <PdfThumbnail url={attachment.url} width={200} />
                  ) : isVideo(attachment.type) && !isUploading ? (
                    <div className="relative w-full h-full">
                      <video
                        src={attachment.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      {/* Play icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <svg className="w-6 h-6 text-foreground ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <FileIcon className={cn(
                        "h-12 w-12 text-muted-foreground mb-2",
                        isUploading && "opacity-50"
                      )} />
                      <p className={cn(
                        "text-xs text-center text-muted-foreground truncate w-full",
                        isUploading && "opacity-50"
                      )}>
                        {attachment.name}
                      </p>
                    </div>
                  )}

                  {/* Upload Progress Overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/40">
                      <div className="text-center">
                        <SpinnerIcon className="h-8 w-8 text-background mx-auto mb-2" />
                        <p className="text-xs text-background font-medium">Uploading...</p>
                      </div>
                    </div>
                  )}
                </div>

              {/* Remove button - disabled during upload */}
              {editable && onFileRemove && !isUploading && (
                <button
                  className="absolute top-2 right-2 p-0 m-0 border-0 bg-transparent cursor-pointer outline-none focus:outline-none text-destructive hover:text-destructive/80 hover:opacity-80 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleRemoveClick(e, attachment)}
                  aria-label="Remove file"
                >
                  <CancelIcon className="h-6 w-6" />
                </button>
              )}

              {/* File info overlay - hidden during upload */}
              {!isUploading && (
                <div className="absolute bottom-0 left-0 right-0 bg-foreground/60 text-background p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs truncate">{attachment.name}</p>
                  <p className="text-xs">
                    {(attachment.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>
            )
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl">
          {/* Download button - positioned next to close button */}
          <button
            className="absolute right-14 top-4 p-0 m-0 border-0 bg-transparent cursor-pointer outline-none focus:outline-none hover:opacity-80 transition-opacity"
            onClick={() => {
              if (selectedFile) {
                handleDownload(selectedFile)
              }
            }}
            aria-label="Download file"
          >
            <DownloadIcon className="h-8 w-8" />
          </button>
          <DialogHeader>
            <DialogTitle>{selectedFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedFile && isImage(selectedFile.type) ? (
              <img
                src={selectedFile.url}
                alt={selectedFile.name}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            ) : selectedFile && isPdf(selectedFile.type) ? (
              <div className="max-h-[70vh] overflow-auto">
                <PdfViewer url={selectedFile.url} maxWidth={700} />
              </div>
            ) : selectedFile && isVideo(selectedFile.type) ? (
              <video
                controls
                autoPlay
                className="w-full max-h-[70vh] rounded-lg"
                src={selectedFile.url}
              >
                <source src={selectedFile.url} type={selectedFile.type} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <FileIcon className="h-24 w-24 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{selectedFile?.name}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    if (selectedFile) {
                      handleDownload(selectedFile)
                    }
                  }}
                >
                  Download File
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
        title="Delete File?"
        description={`Are you sure you want to delete "${fileToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
      />
    </div>
  )
}
