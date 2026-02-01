/*
  Warnings:

  - You are about to drop the column `bottle_volume` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `litres` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `selling_price` on the `products` table. All the data in the column will be lost.
  - Added the required column `foreigner_price` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `local_price` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "bottle_volume",
DROP COLUMN "litres",
DROP COLUMN "selling_price",
ADD COLUMN     "foreigner_price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "local_price" DECIMAL(10,2) NOT NULL,
ALTER COLUMN "low_stock" DROP NOT NULL;

-- DropEnum
DROP TYPE "BottleVolume";
