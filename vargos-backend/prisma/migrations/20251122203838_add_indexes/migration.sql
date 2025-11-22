-- CreateIndex
CREATE INDEX "Quote_userId_createdAt_idx" ON "Quote"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Quote_userId_name_idx" ON "Quote"("userId", "name");

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");
