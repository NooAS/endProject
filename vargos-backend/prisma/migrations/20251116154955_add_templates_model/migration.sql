-- CreateTable
CREATE TABLE "Template" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "defaults" TEXT,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
