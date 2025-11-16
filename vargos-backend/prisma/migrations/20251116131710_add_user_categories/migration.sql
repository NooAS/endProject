-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "QuoteItem" ALTER COLUMN "category" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
