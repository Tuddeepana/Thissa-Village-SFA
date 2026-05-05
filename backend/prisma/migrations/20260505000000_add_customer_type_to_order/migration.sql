-- Add customer_type to orders table
ALTER TABLE "orders"
ADD COLUMN "customer_type" TEXT NOT NULL DEFAULT 'local';

-- Add check constraint for valid customer types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'orders_customer_type_check'
  ) THEN
    ALTER TABLE "orders"
    ADD CONSTRAINT orders_customer_type_check
    CHECK ("customer_type" IN ('local','foreigner'));
  END IF;
END $$;
