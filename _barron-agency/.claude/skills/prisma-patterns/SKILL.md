---
name: prisma-patterns
description: Prisma ORM patterns for this project including queries, relations, transactions, and migrations. Use when working with database operations or schema changes.
---

# Prisma Patterns

Best practices for Prisma in this claims management application.

## Schema Conventions

### Model Structure

```prisma
model Claim {
  // 1. ID first
  id        String      @id @default(cuid())
  
  // 2. Core fields
  claimNumber String    @unique
  description String?
  amount      Decimal?
  status      ClaimStatus @default(PENDING)
  
  // 3. Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // 4. Foreign keys
  claimantId  String
  
  // 5. Relations
  claimant    User      @relation(fields: [claimantId], references: [id], onDelete: Cascade)
  items       Item[]
  
  // 6. Indexes at bottom
  @@index([claimNumber])
  @@index([claimantId])
  @@index([status, createdAt])
}
```

### ID Strategy

Use `cuid()` for all IDs:
- Shorter than UUID
- Sortable by creation time
- URL-safe

### Enums

```prisma
enum ClaimStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
  CLOSED
}
```

## Query Patterns

### Find with Relations

```typescript
// Eager load only what you need
const claim = await prisma.claim.findUnique({
  where: { id: claimId },
  include: {
    items: {
      include: {
        attachments: true,
      },
      orderBy: { order: 'asc' },
    },
  },
})
```

### Select Specific Fields

```typescript
// For list views, select only needed fields
const claims = await prisma.claim.findMany({
  where: { claimantId: userId },
  select: {
    id: true,
    claimNumber: true,
    status: true,
    createdAt: true,
    _count: {
      select: { items: true },
    },
  },
  orderBy: { createdAt: 'desc' },
})
```

### Pagination

```typescript
const page = 1
const perPage = 20

const [claims, total] = await Promise.all([
  prisma.claim.findMany({
    where: { claimantId: userId },
    skip: (page - 1) * perPage,
    take: perPage,
    orderBy: { createdAt: 'desc' },
  }),
  prisma.claim.count({ where: { claimantId: userId } }),
])

return {
  data: claims,
  pagination: {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  },
}
```

## Mutation Patterns

### Create with Relation

```typescript
const claim = await prisma.claim.create({
  data: {
    claimNumber: generateClaimNumber(),
    description: input.description,
    claimant: {
      connect: { id: userId },
    },
  },
})
```

### Update Safely

```typescript
// Use updateMany when you need to verify ownership
const result = await prisma.claim.updateMany({
  where: {
    id: claimId,
    claimantId: userId, // Ensures user owns this claim
  },
  data: {
    status: 'APPROVED',
  },
})

if (result.count === 0) {
  throw new Error('Claim not found or not authorized')
}
```

### Upsert Pattern

```typescript
const user = await prisma.user.upsert({
  where: { clerkId },
  update: {
    email,
    name,
    imageUrl,
  },
  create: {
    clerkId,
    email,
    name,
    imageUrl,
  },
})
```

## Transaction Patterns

### Sequential Operations

```typescript
const [claim, item] = await prisma.$transaction([
  prisma.claim.create({ data: claimData }),
  prisma.item.create({ data: itemData }),
])
```

### Interactive Transaction

```typescript
await prisma.$transaction(async (tx) => {
  // Delete all attachments from R2 first
  const attachments = await tx.attachment.findMany({
    where: { item: { claimId } },
  })
  
  await Promise.all(
    attachments.map((a) => deleteFromR2(a.publicId))
  )
  
  // Then delete the claim (cascades to items and attachments)
  await tx.claim.delete({ where: { id: claimId } })
})
```

## Reordering Items

```typescript
async function reorderItems(
  claimId: string,
  itemIds: string[]
): Promise<void> {
  await prisma.$transaction(
    itemIds.map((id, index) =>
      prisma.item.update({
        where: { id },
        data: { order: index },
      })
    )
  )
}
```

## Migration Workflow

### Development

```bash
# Create migration after schema change
pnpm prisma migrate dev --name add_adjustor_fields

# Reset database (warning: deletes data)
pnpm prisma migrate reset

# Generate client after schema changes
pnpm prisma generate
```

### Production

```bash
# Deploy pending migrations
pnpm prisma migrate deploy
```

### Safe Migration Strategy

For breaking changes:

1. Add new column as nullable
2. Deploy, run data migration script
3. Make column required in new migration
4. Deploy again

```prisma
// Step 1: Add nullable
adjustorEmail String?

// Step 3: Make required (after data migration)
adjustorEmail String
```

## Neon-Specific

### Connection Pooling

Use pooled connection for serverless:

```
DATABASE_URL="postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require&pgbouncer=true"
DATABASE_URL_UNPOOLED="postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
```

### Branching for Testing

1. Create branch in Neon dashboard
2. Copy branch connection string
3. Update local `.env` temporarily
4. Test migrations
5. Merge or delete branch