# Database
DATABASE_URL=""
DATABASE_URL_UNPOOLED=""

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Cloudflare R2 Storage (primary - for new uploads)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_api_token_access_key
R2_SECRET_ACCESS_KEY=your_r2_api_token_secret
R2_BUCKET_NAME=claims-files
R2_PUBLIC_DOMAIN=https://files.yourdomain.com
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com

# Legacy: Cloudinary credentials (keep for existing files during transition)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=