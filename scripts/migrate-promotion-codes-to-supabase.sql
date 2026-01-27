-- Migration script to add Promotion Codes to Supabase
-- Run this in your Supabase SQL Editor

-- CreateTable: promotion_codes
CREATE TABLE IF NOT EXISTS "promotion_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "promoterName" TEXT NOT NULL,
    "promoterAddress" TEXT NOT NULL,
    "promoterPhone" TEXT NOT NULL,
    "promoterIdNumber" TEXT NOT NULL,
    "discountAmountLKR" DOUBLE PRECISION NOT NULL,
    "paymentAmountLKR" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalInquiries" INTEGER NOT NULL DEFAULT 0,
    "totalRegistrations" INTEGER NOT NULL DEFAULT 0,
    "totalPaidLKR" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "promotion_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on code
CREATE UNIQUE INDEX IF NOT EXISTS "promotion_codes_code_key" ON "promotion_codes"("code");

-- AddForeignKey: Link to users table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'promotion_codes_createdById_fkey'
    ) THEN
        ALTER TABLE "promotion_codes" 
        ADD CONSTRAINT "promotion_codes_createdById_fkey" 
        FOREIGN KEY ("createdById") 
        REFERENCES "users"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- AddColumn: Add promotionCodeId to seekers table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seekers' 
        AND column_name = 'promotionCodeId'
    ) THEN
        ALTER TABLE "seekers" 
        ADD COLUMN "promotionCodeId" TEXT;
    END IF;
END $$;

-- AddForeignKey: Link seekers to promotion codes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'seekers_promotionCodeId_fkey'
    ) THEN
        ALTER TABLE "seekers" 
        ADD CONSTRAINT "seekers_promotionCodeId_fkey" 
        FOREIGN KEY ("promotionCodeId") 
        REFERENCES "promotion_codes"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateIndex: Index for better query performance
CREATE INDEX IF NOT EXISTS "seekers_promotionCodeId_idx" ON "seekers"("promotionCodeId");

-- Add comment to table
COMMENT ON TABLE "promotion_codes" IS 'Promotion codes for tracking referrals and discounts';

-- Add comments to columns
COMMENT ON COLUMN "promotion_codes"."code" IS 'Unique promotion code (e.g., A0001, A0002)';
COMMENT ON COLUMN "promotion_codes"."discountAmountLKR" IS 'Discount amount given to child in LKR';
COMMENT ON COLUMN "promotion_codes"."paymentAmountLKR" IS 'Amount paid to promoter per registration in LKR';
COMMENT ON COLUMN "promotion_codes"."totalInquiries" IS 'Total number of inquiries using this code';
COMMENT ON COLUMN "promotion_codes"."totalRegistrations" IS 'Total number of registrations using this code';
COMMENT ON COLUMN "promotion_codes"."totalPaidLKR" IS 'Total amount paid to promoter (calculated)';
