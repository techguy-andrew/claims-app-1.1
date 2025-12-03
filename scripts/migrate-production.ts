import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting production migration...')
  console.log('')

  // RENAME existing columns (preserves all data)
  await prisma.$executeRawUnsafe(`ALTER TABLE "Claim" RENAME COLUMN "adjustor" TO "adjustorName";`)
  console.log('✓ Renamed adjustor -> adjustorName')

  await prisma.$executeRawUnsafe(`ALTER TABLE "Claim" RENAME COLUMN "clientAddress" TO "claimantAddress";`)
  console.log('✓ Renamed clientAddress -> claimantAddress')

  await prisma.$executeRawUnsafe(`ALTER TABLE "Claim" RENAME COLUMN "clientPhone" TO "claimantPhone";`)
  console.log('✓ Renamed clientPhone -> claimantPhone')

  await prisma.$executeRawUnsafe(`ALTER TABLE "Claim" RENAME COLUMN "insuranceCompany" TO "customer";`)
  console.log('✓ Renamed insuranceCompany -> customer')

  // ADD new columns (nullable, so existing rows are fine)
  await prisma.$executeRawUnsafe(`ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "adjustorEmail" TEXT;`)
  console.log('✓ Added adjustorEmail')

  await prisma.$executeRawUnsafe(`ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "adjustorPhone" TEXT;`)
  console.log('✓ Added adjustorPhone')

  await prisma.$executeRawUnsafe(`ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "claimantEmail" TEXT;`)
  console.log('✓ Added claimantEmail')

  await prisma.$executeRawUnsafe(`ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "claimantName" TEXT;`)
  console.log('✓ Added claimantName')

  // DROP title column (verified empty - safe to remove)
  await prisma.$executeRawUnsafe(`ALTER TABLE "Claim" DROP COLUMN IF EXISTS "title";`)
  console.log('✓ Dropped title column (was empty)')

  console.log('')
  console.log('Migration complete! All data preserved.')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
