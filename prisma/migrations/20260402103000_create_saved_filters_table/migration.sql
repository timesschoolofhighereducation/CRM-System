-- Create saved filters table
CREATE TABLE "saved_filters" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "entityType" TEXT NOT NULL DEFAULT 'inquiry',
  "filterData" JSONB NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "saved_filters_pkey" PRIMARY KEY ("id")
);

-- Relation to users
ALTER TABLE "saved_filters"
ADD CONSTRAINT "saved_filters_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Uniqueness and indexes
CREATE UNIQUE INDEX "saved_filters_userId_name_key" ON "saved_filters"("userId", "name");
CREATE INDEX "saved_filters_userId_entityType_idx" ON "saved_filters"("userId", "entityType");
CREATE INDEX "saved_filters_isDefault_idx" ON "saved_filters"("isDefault");
