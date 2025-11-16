/*
  Warnings:

  - The `defaults` column on the `Template` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `userId` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QuoteItem" ADD COLUMN     "laborPrice" DOUBLE PRECISION,
ADD COLUMN     "materialPrice" DOUBLE PRECISION,
ADD COLUMN     "templateId" INTEGER;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "defaults",
ADD COLUMN     "defaults" JSONB;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
