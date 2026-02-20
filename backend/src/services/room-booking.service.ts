import prisma from '../lib/prisma';

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

export const createRoomBooking = async (payload: CreateBookingPayload) => {
  const { rooms, ...bookingData } = payload;

  const booking = await prisma.roomBooking.create({
    data: {
      ...bookingData,
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

  return booking;
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
        });
      }
    }
  });

  return availableRooms;
};

