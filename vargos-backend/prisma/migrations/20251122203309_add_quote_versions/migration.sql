-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "parentId" INTEGER,
ADD COLUMN "config" JSONB;

-- CreateTable
CREATE TABLE "QuoteVersion" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "config" JSONB,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteVersion_quoteId_version_idx" ON "QuoteVersion"("quoteId", "version");

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "QuoteItem" DROP CONSTRAINT "QuoteItem_quoteId_fkey";

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
