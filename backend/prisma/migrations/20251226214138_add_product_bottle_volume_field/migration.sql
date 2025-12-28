-- CreateEnum
CREATE TYPE "BottleVolume" AS ENUM ('L', 'ML');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "bottle_volume" "BottleVolume" NOT NULL DEFAULT 'ML';
