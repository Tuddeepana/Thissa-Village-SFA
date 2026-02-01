-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('HANDMADE', 'PURCHASE');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "barcode" TEXT,
ADD COLUMN "unit_type" TEXT,
ADD COLUMN "product_type" "ProductType" NOT NULL DEFAULT 'PURCHASE';

