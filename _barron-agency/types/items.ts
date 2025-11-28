export interface Attachment {
  id: string
  name: string
  url: string
  thumbnailUrl?: string | null
  type: string
  size: number
  width?: number | null
  height?: number | null
  file?: File // For local file handling before upload
}

export interface Item {
  id: string
  title: string
  description: string
  order: number
  attachments?: Attachment[]
}
