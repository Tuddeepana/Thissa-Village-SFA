-- Add customer_type to bills so we can render the correct (local vs foreigner) price list when viewing past bills
ALTER TABLE "bills"
ADD COLUMN IF NOT EXISTS "customer_type" TEXT NOT NULL DEFAULT 'local';

-- Optional: basic check constraint to limit values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'bills_customer_type_check'
  ) THEN
    ALTER TABLE "bills"
    ADD CONSTRAINT bills_customer_type_check
    CHECK ("customer_type" IN ('local','foreigner'));
  END IF;
END $$;
