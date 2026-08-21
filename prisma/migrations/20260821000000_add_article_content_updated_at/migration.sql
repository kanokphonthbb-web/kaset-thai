ALTER TABLE "Article" ADD COLUMN "contentUpdatedAt" DATETIME;

UPDATE "Article"
SET "contentUpdatedAt" = COALESCE("publishedAt", "createdAt")
WHERE "status" = 'published' AND "contentUpdatedAt" IS NULL;
