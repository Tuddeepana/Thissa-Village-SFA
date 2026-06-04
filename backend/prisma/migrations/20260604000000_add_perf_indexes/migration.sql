-- Performance indexes for slow GET endpoints
-- /api/bills: payment_method aggregation
CREATE INDEX IF NOT EXISTS "idx_bill_payment_method"
  ON "bills" ("payment_method");

-- /api/bills: composite for date + payment_method aggregation in one scan
CREATE INDEX IF NOT EXISTS "idx_bill_date_payment"
  ON "bills" ("date" DESC, "payment_method");

-- /api/bills: createdAt for ordering paginated results
CREATE INDEX IF NOT EXISTS "idx_bill_created_at"
  ON "bills" ("createdAt" DESC);

-- /api/orders/table-status: faster table_id + createdAt lookup
CREATE INDEX IF NOT EXISTS "idx_order_table_created"
  ON "orders" ("table_id", "createdAt" DESC);

-- restaurant_tables: deletedAt partial filter
CREATE INDEX IF NOT EXISTS "idx_restaurant_table_deleted"
  ON "restaurant_tables" ("deletedAt");
