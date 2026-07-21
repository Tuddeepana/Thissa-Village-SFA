-- Add bill_seq for stable incremental numbering and backfill existing rows
-- 1) Add column (identity) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'bill_seq'
  ) THEN
    ALTER TABLE "bills" ADD COLUMN "bill_seq" BIGSERIAL;
  END IF;
END $$;

-- 2) Backfill any null bill_seq values (should be rare)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, id ASC) AS rn
  FROM "bills"
)
UPDATE "bills" b
SET "bill_seq" = r.rn
FROM ranked r
WHERE b.id = r.id AND b."bill_seq" IS NULL;

-- 3) Make not null
ALTER TABLE "bills" ALTER COLUMN "bill_seq" SET NOT NULL;

-- 4) Unique index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'bills' AND indexname = 'bills_bill_seq_key'
  ) THEN
    CREATE UNIQUE INDEX "bills_bill_seq_key" ON "bills"("bill_seq");
  END IF;
END $$;

-- 5) Set sequence to max(bill_seq)
SELECT setval(pg_get_serial_sequence('"bills"', 'bill_seq'), (SELECT COALESCE(MAX("bill_seq"), 1) FROM "bills"));

