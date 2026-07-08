-- AlterTable
ALTER TABLE "bills" ADD COLUMN "roomBookingId" TEXT;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_roomBookingId_fkey" FOREIGN KEY ("roomBookingId") REFERENCES "room_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
