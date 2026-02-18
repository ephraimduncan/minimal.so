-- AlterTable
ALTER TABLE "bookmark" ADD COLUMN "lastCapturedAt" DATETIME;
ALTER TABLE "bookmark" ADD COLUMN "normalizedUrl" TEXT;
ALTER TABLE "bookmark" ADD COLUMN "primarySource" TEXT;
ALTER TABLE "bookmark" ADD COLUMN "sourceHistory" TEXT;

-- CreateIndex
CREATE INDEX "bookmark_userId_normalizedUrl_idx" ON "bookmark"("userId", "normalizedUrl");
