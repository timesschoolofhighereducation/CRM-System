# Promotion Codes Migration Guide

This guide will help you apply the promotion codes schema changes to your Supabase database.

## Files Created

1. **`prisma/migrations/20250119000000_add_promotion_codes/migration.sql`** - Prisma migration file
2. **`scripts/migrate-promotion-codes-to-supabase.sql`** - Standalone SQL script for Supabase

## Option 1: Using Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file `scripts/migrate-promotion-codes-to-supabase.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute

This script includes safety checks (IF NOT EXISTS) so it's safe to run multiple times.

## Option 2: Using Prisma Migrate

If you have your database connection configured locally:

```bash
# Make sure your .env file has DATABASE_URL and DIRECT_URL set
npx prisma migrate deploy
```

## What This Migration Does

### Creates `promotion_codes` Table
- Stores promotion code information
- Fields:
  - `id` - Unique identifier
  - `code` - Unique promotion code (A0001, A0002, etc.)
  - `promoterName` - Name of the promoter
  - `promoterAddress` - Address of the promoter
  - `promoterPhone` - Phone number of the promoter
  - `promoterIdNumber` - ID number of the promoter
  - `discountAmountLKR` - Discount given to child in LKR
  - `paymentAmountLKR` - Amount paid to promoter per registration in LKR
  - `isActive` - Whether the code is active
  - `totalInquiries` - Total inquiries using this code
  - `totalRegistrations` - Total registrations using this code
  - `totalPaidLKR` - Total amount paid to promoter
  - `createdAt` - Creation timestamp
  - `updatedAt` - Last update timestamp
  - `createdById` - User who created the code

### Updates `seekers` Table
- Adds `promotionCodeId` column to link seekers to promotion codes
- Creates foreign key relationship
- Creates index for better query performance

## Verification

After running the migration, verify it worked:

```sql
-- Check if promotion_codes table exists
SELECT * FROM promotion_codes LIMIT 1;

-- Check if seekers table has promotionCodeId column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'seekers' 
AND column_name = 'promotionCodeId';

-- Check foreign key constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'seekers'
  AND kcu.column_name = 'promotionCodeId';
```

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove foreign key constraint
ALTER TABLE "seekers" DROP CONSTRAINT IF EXISTS "seekers_promotionCodeId_fkey";

-- Remove column from seekers
ALTER TABLE "seekers" DROP COLUMN IF EXISTS "promotionCodeId";

-- Drop promotion_codes table
DROP TABLE IF EXISTS "promotion_codes";
```

## Next Steps

After applying the migration:

1. Regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```

2. Test the promotion codes feature in your application

3. Create your first promotion code through the UI at `/promotion-codes`

## Notes

- The migration uses `IF NOT EXISTS` checks, so it's safe to run multiple times
- All existing data in the `seekers` table will remain intact
- The `promotionCodeId` column is nullable, so existing seekers won't be affected
- The migration includes helpful comments on the columns
