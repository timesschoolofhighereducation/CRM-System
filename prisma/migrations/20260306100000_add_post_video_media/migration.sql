-- AlterTable: add videoUrl, mediaType, assignedToId to social_media_posts
ALTER TABLE "public"."social_media_posts" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "public"."social_media_posts" ADD COLUMN IF NOT EXISTS "mediaType" TEXT;
ALTER TABLE "public"."social_media_posts" ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;

-- Add FK for assignedToId
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'social_media_posts_assignedToId_fkey'
  ) THEN
    ALTER TABLE "public"."social_media_posts" ADD CONSTRAINT "social_media_posts_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
