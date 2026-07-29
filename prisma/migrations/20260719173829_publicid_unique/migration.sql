/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Invoice_publicId_key" ON "Invoice"("publicId");
