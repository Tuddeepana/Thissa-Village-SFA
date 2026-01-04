-- CreateEnum
CREATE TYPE "PaidStatus" AS ENUM ('PAID', 'PENDING');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paid_status" "PaidStatus" NOT NULL DEFAULT 'PENDING';
