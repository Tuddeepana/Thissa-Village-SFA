-- CreateTable
CREATE TABLE "service_charges" (
    "id" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_charges_pkey" PRIMARY KEY ("id")
);

-- Insert default service charge record
INSERT INTO "service_charges" ("id", "percentage", "is_active", "created_at", "updated_at")
VALUES ('default', 10.00, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

