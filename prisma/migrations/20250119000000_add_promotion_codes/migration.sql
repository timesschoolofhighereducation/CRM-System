-- CreateTable
CREATE TABLE "promotion_codes" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "promotion_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promotion_codes_code_key" ON "promotion_codes"("code");

-- AddForeignKey
ALTER TABLE "promotion_codes" ADD CONSTRAINT "promotion_codes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "seekers" ADD COLUMN "promotionCodeId" TEXT;

-- AddForeignKey
ALTER TABLE "seekers" ADD CONSTRAINT "seekers_promotionCodeId_fkey" FOREIGN KEY ("promotionCodeId") REFERENCES "promotion_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "seekers_promotionCodeId_idx" ON "seekers"("promotionCodeId");
