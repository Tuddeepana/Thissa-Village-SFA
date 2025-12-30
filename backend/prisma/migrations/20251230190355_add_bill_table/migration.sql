-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "bill_number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "customer_name" TEXT,
    "total" DECIMAL(10,2) NOT NULL,
    "cashier_name" TEXT NOT NULL,
    "item_count" INTEGER NOT NULL,
    "credit_note" TEXT,
    "cash_given" DECIMAL(10,2) NOT NULL,
    "balance_given" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bills_bill_number_key" ON "bills"("bill_number");
