-- CreateEnum
CREATE TYPE "TableType" AS ENUM ('VIP', 'NORMAL');

-- CreateTable
CREATE TABLE "restaurant_tables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "table_type" "TableType" NOT NULL DEFAULT 'NORMAL',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_tables_name_key" ON "restaurant_tables"("name");

