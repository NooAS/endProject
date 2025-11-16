/*
  Warnings:

  - You are about to drop the column `isDefault` on the `Category` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "isDefault",
ALTER COLUMN "order" SET DEFAULT 0;
