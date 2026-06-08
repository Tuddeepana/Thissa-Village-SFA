import prisma from '../lib/prisma';
import { billService } from './bill.service';

interface BookedRoomInput {
  roomId: string;
  roomName: string;
  pricePerNight: number;
}

interface CreateBookingPayload {
  customerName: string;
  customerNic?: string;
  customerPhone: string;
  customerAddress?: string;
  checkInDate: Date;
  checkOutDate: Date;
  totalAmount: number;
  cashierName: string;
  rooms: BookedRoomInput[];
  paymentType?: 'FULL_PAYMENT' | 'ADVANCE_PAYMENT' | 'ON_CALL';
  advanceAmount?: number;
  paymentMethod?: string;
  cashGiven?: number;
  generateBill?: boolean;
}

interface UpdateBookingPayload {
  customerName?: string;
  customerNic?: string;
  customerPhone?: string;
  customerAddress?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  totalAmount?: number;
  status?: string;
}

interface SettleBalancePayload {
  paymentMethod: string;
  cashGiven?: number;
  cashierName: string;
}

export const createRoomBooking = async (payload: CreateBookingPayload) => {
  const { rooms, generateBill, paymentMethod, cashGiven, paymentType = 'FULL_PAYMENT', advanceAmount, ...bookingData } = payload;

  return await prisma.$transaction(async (tx) => {
    // Determine paidAmount and whether to generate a bill based on paymentType
    let paidAmount = 0;
    let shouldGenerateBill = false;
    let billAmount = 0;

    switch (paymentType) {
      case 'FULL_PAYMENT':
        paidAmount = Number(payload.totalAmount);
        shouldGenerateBill = true;
        billAmount = Number(payload.totalAmount);
        break;
      case 'ADVANCE_PAYMENT':
        paidAmount = Number(advanceAmount || 0);
        shouldGenerateBill = true;
        billAmount = paidAmount;
        break;
      case 'ON_CALL':
        paidAmount = 0;
        shouldGenerateBill = false;
        billAmount = 0;
        break;
    }

    // Create the room booking
    const booking = await tx.roomBooking.create({
      data: {
        ...bookingData,
        paymentType,
        paidAmount,
        bookedRooms: {
          create: rooms.map(room => ({
            roomId: room.roomId,
            roomName: room.roomName,
            pricePerNight: room.pricePerNight,
          })),
        },
      },
      include: {
        bookedRooms: {
          include: {
            room: true,
          },
        },
      },
    });

    let bill = null;

    // Generate bill if applicable
    if (shouldGenerateBill && billAmount > 0) {
      console.log(`🧾 Generating bill for room booking (${paymentType})...`);
      const billNumber = `ROOM-${Date.now()}`;
      const cash = cashGiven || billAmount;
      const balance = cash - billAmount;

      const creditNote = paymentType === 'ADVANCE_PAYMENT'
        ? `Advance Payment - Room Booking: ${rooms.map(r => r.roomName).join(', ')}`
        : `Room Booking: ${rooms.map(r => r.roomName).join(', ')}`;

      console.log('Bill details:', {
        billNumber,
        billAmount,
        cash,
        balance,
        paymentMethod: paymentMethod || 'CASH',
        paymentType,
      });

      // Create bill using the bill service
      bill = await billService.createBill({
        bill_number: billNumber,
        date: new Date(),
        payment_method: paymentMethod || 'CASH',
        customer_name: payload.customerName,
        total: billAmount,
        cashier_name: payload.cashierName,
        item_count: rooms.length,
        credit_note: creditNote,
        cash_given: cash,
        balance_given: balance,
        tax: 0,
      });

      console.log('✅ Bill created successfully:', bill.bill_number);
    } else {
      console.log(`ℹ️ Bill generation skipped (paymentType = ${paymentType})`);
    }

    return { booking, bill };
  });
};

export const getRoomBookingById = async (id: string) => {
  return await prisma.roomBooking.findUnique({
    where: { id },
    include: {
      bookedRooms: {
        include: {
          room: true,
        },
      },
    },
  });
};

export const listRoomBookings = async (status?: string) => {
  const where = status ? { status } : {};

  const bookings = await prisma.roomBooking.findMany({
    where,
    include: {
      bookedRooms: {
        include: {
          room: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    bookings,
    total: bookings.length,
  };
};

export const updateRoomBooking = async (id: string, payload: UpdateBookingPayload) => {
  return await prisma.roomBooking.update({
    where: { id },
    data: payload,
    include: {
      bookedRooms: {
        include: {
          room: true,
        },
      },
    },
  });
};

export const checkOutBooking = async (id: string) => {
  return await prisma.roomBooking.update({
    where: { id },
    data: { status: 'CHECKED_OUT' },
    include: {
      bookedRooms: {
        include: {
          room: true,
        },
      },
    },
  });
};

export const cancelBooking = async (id: string) => {
  return await prisma.roomBooking.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: {
      bookedRooms: {
        include: {
          room: true,
        },
      },
    },
  });
};

export const settleBookingBalance = async (id: string, payload: SettleBalancePayload) => {
  const booking = await prisma.roomBooking.findUnique({
    where: { id },
    include: {
      bookedRooms: true,
    },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  const totalAmount = Number(booking.totalAmount);
  const paidAmount = Number(booking.paidAmount);
  const remainingAmount = totalAmount - paidAmount;

  if (remainingAmount <= 0) {
    throw new Error('No remaining balance to settle');
  }

  return await prisma.$transaction(async (tx) => {
    // Create a bill for the remaining amount
    const billNumber = `ROOM-BAL-${Date.now()}`;
    const cash = payload.cashGiven || remainingAmount;
    const balance = cash - remainingAmount;

    console.log(`🧾 Settling balance for booking ${id}...`);
    console.log('Settlement details:', {
      totalAmount,
      previouslyPaid: paidAmount,
      remainingAmount,
      cash,
      balance,
    });

    const bill = await billService.createBill({
      bill_number: billNumber,
      date: new Date(),
      payment_method: payload.paymentMethod || 'CASH',
      customer_name: booking.customerName,
      total: remainingAmount,
      cashier_name: payload.cashierName,
      item_count: booking.bookedRooms.length,
      credit_note: `Balance Settlement - Room Booking: ${booking.bookedRooms.map(r => r.roomName).join(', ')}`,
      cash_given: cash,
      balance_given: balance,
      tax: 0,
    });

    // Update the booking's paidAmount to totalAmount
    const updatedBooking = await tx.roomBooking.update({
      where: { id },
      data: { paidAmount: totalAmount },
      include: {
        bookedRooms: {
          include: {
            room: true,
          },
        },
      },
    });

    console.log('✅ Balance settled successfully. Bill:', bill.bill_number);

    return { booking: updatedBooking, bill };
  });
};

// Get available rooms for a date range
export const getAvailableRooms = async (checkInDate: Date, checkOutDate: Date) => {
  // Get all expanded rooms
  const allRooms = await prisma.room.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  // Get all active bookings that overlap with the requested dates
  const overlappingBookings = await prisma.roomBooking.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        {
          AND: [
            { checkInDate: { lte: checkOutDate } },
            { checkOutDate: { gte: checkInDate } },
          ],
        },
      ],
    },
    include: {
      bookedRooms: true,
    },
  });

  // Get list of booked room IDs and names
  const bookedRoomIdentifiers = new Set<string>();
  overlappingBookings.forEach(booking => {
    booking.bookedRooms.forEach(br => {
      bookedRoomIdentifiers.add(br.roomName); // Use room display name
    });
  });

  // Expand rooms and filter out booked ones
  const availableRooms: Array<{
    id: string;
    displayName: string;
    room_type: string;
    baseRoomId: string;
    priceFullDay: number;
    priceShortTime: number;
  }> = [];

  allRooms.forEach(room => {
    for (let i = 1; i <= room.quantity; i++) {
      const displayName = `${room.name} ${i}`;
      if (!bookedRoomIdentifiers.has(displayName)) {
        availableRooms.push({
          id: `${room.id}-${i}`,
          displayName,
          room_type: room.room_type,
          baseRoomId: room.id,
          priceFullDay: Number(room.price_full_day),
          priceShortTime: Number(room.price_short_time),
        });
      }
    }
  });

  return availableRooms;
};
