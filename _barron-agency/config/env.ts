// Environment variables with type safety
// This provides a centralized place to access env vars with validation

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key]
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value || defaultValue || ''
}

export const env = {
  // App
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL', ''),

  // Auth (example for Clerk)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: getEnvVar('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', ''),
  CLERK_SECRET_KEY: getEnvVar('CLERK_SECRET_KEY', ''),

  // Add more environment variables as needed
} as const

export type Env = typeof env
