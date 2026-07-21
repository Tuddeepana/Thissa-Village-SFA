-- Step 1: Add room_types column
ALTER TABLE "rooms" ADD COLUMN "room_types" TEXT[] DEFAULT ARRAY['NORMAL']::TEXT[];

-- Step 2: Migrate data
UPDATE "rooms" SET "room_types" = ARRAY["room_type"];

-- Step 3: Drop old columns
ALTER TABLE "rooms" DROP COLUMN "room_type";
ALTER TABLE "rooms" DROP COLUMN "price_full_day";
ALTER TABLE "rooms" DROP COLUMN "price_short_time";
