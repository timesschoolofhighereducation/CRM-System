-- AlterTable: add videoUrl and mediaType to social_media_posts
ALTER TABLE "public"."social_media_posts" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "public"."social_media_posts" ADD COLUMN IF NOT EXISTS "mediaType" TEXT;
