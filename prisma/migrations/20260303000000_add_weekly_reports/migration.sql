-- CreateEnum
CREATE TYPE "public"."WeeklyReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REVIEWED');

-- CreateTable
CREATE TABLE "public"."weekly_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "developer" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "project" TEXT NOT NULL,
    "purpose" TEXT,
    "activeDays" INTEGER,
    "status" "public"."WeeklyReportStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT,
    "metrics" JSONB,
    "plannedItems" JSONB,
    "dailyTasks" JSONB,
    "areasUpdated" JSONB,
    "risks" JSONB,
    "blockers" JSONB,
    "nextWeekPlan" JSONB,
    "timeAllocation" JSONB,
    "references" JSONB,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weekly_reports_createdById_idx" ON "public"."weekly_reports"("createdById");

-- CreateIndex
CREATE INDEX "weekly_reports_periodStart_periodEnd_idx" ON "public"."weekly_reports"("periodStart", "periodEnd");

-- AddForeignKey
ALTER TABLE "public"."weekly_reports" ADD CONSTRAINT "weekly_reports_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "public"."users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
