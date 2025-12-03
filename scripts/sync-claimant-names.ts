import { PrismaClient } from '@prisma/client'

// Staging DB - where claimantName data exists
const stagingUrl = "postgresql://neondb_owner:npg_Ct4isAu3kcwQ@ep-nameless-dew-afjcar14.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"

// Production DB - where we need to sync data to
const productionUrl = "postgresql://neondb_owner:npg_Ct4isAu3kcwQ@ep-muddy-tooth-aftr8hdp.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"

const stagingDb = new PrismaClient({ datasources: { db: { url: stagingUrl } } })
const productionDb = new PrismaClient({ datasources: { db: { url: productionUrl } } })

async function main() {
  console.log('Syncing claimantName from staging to production...')
  console.log('')

  // Get all claims with claimantName from staging
  const stagingClaims = await stagingDb.$queryRaw<Array<{ claimNumber: string; claimantName: string | null }>>`
    SELECT "claimNumber", "claimantName"
    FROM "Claim"
    WHERE "claimantName" IS NOT NULL AND "claimantName" != ''
  `

  console.log(`Found ${stagingClaims.length} claims with claimantName in staging`)
  console.log('')

  let updated = 0
  let notFound = 0

  for (const claim of stagingClaims) {
    try {
      // Update production claim with matching claimNumber
      const result = await productionDb.$executeRaw`
        UPDATE "Claim"
        SET "claimantName" = ${claim.claimantName}
        WHERE "claimNumber" = ${claim.claimNumber}
      `

      if (result > 0) {
        console.log(`✓ Updated ${claim.claimNumber}: ${claim.claimantName}`)
        updated++
      } else {
        console.log(`- Skipped ${claim.claimNumber}: not found in production`)
        notFound++
      }
    } catch (error) {
      console.error(`✗ Error updating ${claim.claimNumber}:`, error)
    }
  }

  console.log('')
  console.log('Sync complete!')
  console.log(`  Updated: ${updated}`)
  console.log(`  Not found in production: ${notFound}`)
}

main()
  .catch(console.error)
  .finally(async () => {
    await stagingDb.$disconnect()
    await productionDb.$disconnect()
  })
