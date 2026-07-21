-- Step 1: Create the room_type_configs table
CREATE TABLE IF NOT EXISTS "room_type_configs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price_full_day" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "price_short_time" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "room_type_configs_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create unique index on type
CREATE UNIQUE INDEX IF NOT EXISTS "room_type_configs_type_key" ON "room_type_configs"("type");

-- Step 3: Convert room_type from enum to text (preserving data)
ALTER TABLE "rooms" ALTER COLUMN "room_type" TYPE TEXT USING "room_type"::TEXT;
ALTER TABLE "rooms" ALTER COLUMN "room_type" SET DEFAULT 'NORMAL';

-- Step 4: Drop the RoomType enum (no longer needed)
DROP TYPE IF EXISTS "RoomType";
