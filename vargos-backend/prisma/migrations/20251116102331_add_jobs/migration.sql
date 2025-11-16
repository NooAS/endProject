/*
  Warnings:

  - You are about to drop the column `defaultPriceNet` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `defaultVat` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Job` table. All the data in the column will be lost.
  - Added the required column `price` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "order" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "defaultPriceNet",
DROP COLUMN "defaultVat",
DROP COLUMN "description",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;
