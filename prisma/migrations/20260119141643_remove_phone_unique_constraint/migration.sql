-- DropIndex: Remove unique constraint on phone field in seekers table
-- This allows the same phone number to be used for multiple inquiries across different programs
DROP INDEX IF EXISTS "seekers_phone_key";

-- AlterTable: Remove @unique constraint from phone column
-- Note: The phone column itself remains, just the uniqueness constraint is removed
ALTER TABLE "seekers" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "seekers" ALTER COLUMN "phone" SET NOT NULL;
