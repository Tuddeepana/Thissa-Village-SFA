-- Add bill_seq column for sequential bill numbering
-- IMPORTANT: bill_seq is auto-incrementing and unique

ALTER TABLE "bills"
ADD COLUMN "bill_seq" SERIAL;

-- Backfill existing rows deterministically (order by createdAt, then bill_number)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "bill_number" ASC) AS rn
  FROM "bills"
)
UPDATE "bills" b
SET "bill_seq" = r.rn
FROM ranked r
WHERE b.id = r.id;

ALTER TABLE "bills"
ALTER COLUMN "bill_seq" SET NOT NULL;

CREATE UNIQUE INDEX "bills_bill_seq_key" ON "bills"("bill_seq");

-- Optional but recommended: normalize existing bill numbers to the new format
UPDATE "bills"
SET "bill_number" = 'B-' || LPAD("bill_seq"::text, 12, '0');
