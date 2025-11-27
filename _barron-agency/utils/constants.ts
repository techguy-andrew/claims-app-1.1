// Application-wide constants

export const APP_NAME = 'Agency Foundation'
export const APP_DESCRIPTION = 'Agency project template'

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_FILE_COUNT = 10

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
]

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const
