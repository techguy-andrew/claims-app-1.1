export interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  file?: File // For local file handling before upload
}

export interface Item {
  id: string
  title: string
  description: string
  order: number
  attachments?: Attachment[]
}
