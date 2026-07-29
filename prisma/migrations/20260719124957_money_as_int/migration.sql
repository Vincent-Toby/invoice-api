/*
  Warnings:

  - You are about to alter the column `discountAmount` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `subtotal` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `totalAmount` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `unitPrice` on the `InvoiceItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `price` on the `Item` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "discountAmount" SET DATA TYPE INTEGER,
ALTER COLUMN "subtotal" SET DATA TYPE INTEGER,
ALTER COLUMN "totalAmount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "InvoiceItem" ALTER COLUMN "unitPrice" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "price" SET DATA TYPE INTEGER;
