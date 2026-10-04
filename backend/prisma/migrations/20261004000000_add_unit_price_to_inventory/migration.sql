-- Migration: add_unit_price_to_inventory
-- Adds a nullable unit_price column to inventory to snapshot the sale-time price.
-- This prevents retroactive product price changes from affecting historical bills.

ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "unit_price" DECIMAL(10, 2);
