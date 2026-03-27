-- Persist applied service charge on each bill
ALTER TABLE "bills"
  ADD COLUMN IF NOT EXISTS "service_charge_percentage" DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "service_charge_amount" DECIMAL(10,2);
