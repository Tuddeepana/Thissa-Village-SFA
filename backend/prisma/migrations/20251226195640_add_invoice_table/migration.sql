-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "in_number" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_in_number_key" ON "invoices"("in_number");
