-- CreateTable
CREATE TABLE "Quote" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "room" TEXT,
    "job" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
