-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "parentQuoteId" INTEGER;

-- CreateIndex
CREATE INDEX "Quote_userId_name_createdAt_idx" ON "Quote"("userId", "name", "createdAt");
