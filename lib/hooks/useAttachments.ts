"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Attachment as PrismaAttachment } from "@prisma/client";
import type { ClaimWithItems } from "./useClaims";

// UI-friendly attachment type that maps from Prisma schema
export interface Attachment {
  id: string;
  name: string; // Maps from filename
  url: string;
  thumbnailUrl?: string | null;
  type: string; // Maps from mimeType
  size: number;
  width?: number | null;
  height?: number | null;
  publicId: string; // R2 key or Cloudinary public ID
  format?: string | null; // File format/extension
  file?: File; // For local file handling before upload
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
    publicId: prismaAttachment.publicId,
    format: prismaAttachment.format,
  };
}

interface AddAttachmentsData {
  claimId: string;
  itemId: string;
  files: File[];
}

interface RemoveAttachmentData {
  claimId: string;
  itemId: string;
  attachmentId: string;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const UPLOAD_TIMEOUT = 60000; // 60 seconds
const MAX_RETRIES = 3;

// Upload a single file with timeout and retry logic
async function uploadFileWithRetry(
  url: string,
  formData: FormData,
  fileName: string
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(UPLOAD_TIMEOUT),
      });

      // Don't retry client errors (4xx) - only server errors (5xx)
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Server error - will retry
      lastError = new Error(`Server error (${response.status})`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "TimeoutError" || error.name === "AbortError") {
          lastError = new Error(`Upload timed out for ${fileName}`);
        } else if (error.message.includes("Failed to fetch")) {
          lastError = new Error(`Network error - check your connection`);
        } else {
          lastError = error;
        }
      }
    }

    // Wait before retry (exponential backoff: 1s, 2s, 4s)
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError || new Error(`Failed to upload ${fileName} after ${MAX_RETRIES} attempts`);
}

// Get user-friendly error message from response
function getUploadErrorMessage(status: number, serverError?: string): string {
  if (serverError) return serverError;
  switch (status) {
    case 400:
      return "Invalid file format";
    case 413:
      return "File too large (max 100MB)";
    case 408:
      return "Upload timed out - please try again";
    case 429:
      return "Too many uploads - please wait a moment";
    case 500:
    case 502:
    case 503:
      return "Server error - please try again";
    default:
      return `Upload failed (error ${status})`;
  }
}

// Add Attachments Mutation with Server-Side Upload to R2
export function useAddAttachments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: AddAttachmentsData
    ): Promise<PrismaAttachment[]> => {
      const uploadedAttachments: PrismaAttachment[] = [];

      for (const file of data.files) {
        // Validate file size on client
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`${file.name} exceeds 100MB limit`);
        }

        // Upload file via FormData to our API (server handles R2 upload)
        const formData = new FormData();
        formData.append("file", file);

        const url = `/api/claims/${data.claimId}/items/${data.itemId}/attachments`;
        const response = await uploadFileWithRetry(url, formData, file.name);

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(getUploadErrorMessage(response.status, error.error));
        }

        const newAttachment: PrismaAttachment = await response.json();
        uploadedAttachments.push(newAttachment);
      }

      return uploadedAttachments;
    },

    onMutate: async (data) => {
      // Cancel outgoing queries for this claim
      await queryClient.cancelQueries({ queryKey: ["claims", data.claimId] });

      // Snapshot previous value
      const previousClaim = queryClient.getQueryData<ClaimWithItems>([
        "claims",
        data.claimId,
      ]);

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
        publicId: "", // Temp value until upload completes
        format: null,
        file, // Include file for upload tracking
      }));

      // Optimistically add attachments to the item
      queryClient.setQueryData<ClaimWithItems>(
        ["claims", data.claimId],
        (old) => {
          if (!old) return old;
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
                        publicId: "",
                        version: null,
                        format: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      })),
                    ],
                  }
                : item
            ),
          };
        }
      );

      return { previousClaim, tempAttachments, itemId: data.itemId };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousClaim) {
        queryClient.setQueryData(
          ["claims", variables.claimId],
          context.previousClaim
        );
      }

      // Clean up object URLs
      context?.tempAttachments.forEach((att) => {
        if (att.url.startsWith("blob:")) {
          URL.revokeObjectURL(att.url);
        }
      });
    },

    onSuccess: (result, variables, context) => {
      // Replace temp attachments with real ones from server
      queryClient.setQueryData<ClaimWithItems>(
        ["claims", variables.claimId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => {
              if (item.id === variables.itemId) {
                // Remove temp attachments and add real ones
                const existingAttachments = item.attachments.filter(
                  (att) => !att.id.startsWith("temp-")
                );
                return {
                  ...item,
                  attachments: [...existingAttachments, ...result],
                };
              }
              return item;
            }),
          };
        }
      );

      // Clean up temp object URLs
      context?.tempAttachments.forEach((att) => {
        if (att.url.startsWith("blob:")) {
          URL.revokeObjectURL(att.url);
        }
      });
    },
  });
}

// Remove Attachment Mutation with Optimistic Update
export function useRemoveAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: RemoveAttachmentData
    ): Promise<{ success: boolean }> => {
      const response = await fetch(
        `/api/claims/${data.claimId}/items/${data.itemId}/attachments/${data.attachmentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete attachment");
      }

      return response.json();
    },

    onMutate: async (data) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["claims", data.claimId] });

      // Snapshot previous value
      const previousClaim = queryClient.getQueryData<ClaimWithItems>([
        "claims",
        data.claimId,
      ]);

      // Get the attachment being removed (for cleanup)
      const item = previousClaim?.items.find((i) => i.id === data.itemId);
      const removedAttachment = item?.attachments.find(
        (a) => a.id === data.attachmentId
      );

      // Optimistically remove attachment
      queryClient.setQueryData<ClaimWithItems>(
        ["claims", data.claimId],
        (old) => {
          if (!old) return old;
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
          };
        }
      );

      return { previousClaim, removedAttachment };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousClaim) {
        queryClient.setQueryData(
          ["claims", variables.claimId],
          context.previousClaim
        );
      }
    },

    onSettled: (data, error, variables, context) => {
      // Clean up object URL if it was a blob URL
      if (context?.removedAttachment?.url.startsWith("blob:")) {
        URL.revokeObjectURL(context.removedAttachment.url);
      }
    },
  });
}
