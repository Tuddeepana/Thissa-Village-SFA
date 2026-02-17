import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crown, Hotel, Calendar, User, Phone, Clock, Eye, MapPin } from "lucide-react";
import { roomService } from "@/api/services/roomService";
import { roomBookingService } from "@/api/services/roomBookingService";
import type { ExpandedRoomItem } from "@/types/room.types";
import type { RoomBooking } from "@/types/room-booking.types";
import { useQuery } from "@tanstack/react-query";
import LocalLoader from "@/components/common/LocalLoader";
import { format, differenceInHours, differenceInDays } from "date-fns";

interface RoomWithBooking extends ExpandedRoomItem {
  booking?: RoomBooking;
  status: 'available' | 'booked';
}

const RoomStatus = () => {
  const [roomsWithStatus, setRoomsWithStatus] = useState<RoomWithBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch all expanded rooms
  const { data: expandedRoomsData, isLoading: loadingRooms } = useQuery({
    queryKey: ["rooms-expanded"],
    queryFn: async () => {
      const response = await roomService.getExpanded();
      return response.rooms;
    },
    staleTime: 10_000,
    refetchInterval: 30_000, // Refresh every 30 seconds
  });

  // Fetch all active bookings
  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ["room-bookings-active"],
    queryFn: async () => {
      const response = await roomBookingService.list("ACTIVE");
      return response.bookings;
    },
    staleTime: 10_000,
    refetchInterval: 30_000, // Refresh every 30 seconds
  });

  // Combine rooms with their booking status
  useEffect(() => {
    if (expandedRoomsData && bookingsData) {
      const now = new Date();

      const roomsWithBookingStatus: RoomWithBooking[] = expandedRoomsData.map(room => {
        // Find if this room has an active booking
        const booking = bookingsData.find(b => {
          const checkIn = new Date(b.checkInDate);
          const checkOut = new Date(b.checkOutDate);

          // Check if current time is within booking period
          const isWithinBookingPeriod = now >= checkIn && now <= checkOut;

          // Check if any of the booked rooms matches this room
          const hasThisRoom = b.bookedRooms.some(br => br.roomName === room.displayName);

          return isWithinBookingPeriod && hasThisRoom;
        });

        return {
          ...room,
          booking,
          status: booking ? 'booked' : 'available'
        };
      });

      setRoomsWithStatus(roomsWithBookingStatus);
    }
  }, [expandedRoomsData, bookingsData]);

  const availableCount = roomsWithStatus.filter(r => r.status === 'available').length;
  const bookedCount = roomsWithStatus.filter(r => r.status === 'booked').length;

  // Helper function to determine if booking is short time or full day
  const getBookingType = (booking: RoomBooking) => {
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const hours = differenceInHours(checkOut, checkIn);
    const days = differenceInDays(checkOut, checkIn);

    // If less than 24 hours and same day, it's short time
    if (hours <= 6 && days === 0) {
      return { type: 'short_time', duration: `${hours} hour${hours !== 1 ? 's' : ''}` };
    } else {
      const nights = days > 0 ? days : 1;
      return { type: 'full_day', duration: `${nights} night${nights !== 1 ? 's' : ''}` };
    }
  };

  const handleViewDetails = (booking: RoomBooking) => {
    setSelectedBooking(booking);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Room Status</h1>
        <p className="text-sm md:text-base text-muted-foreground">View current room availability and bookings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomsWithStatus.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Booked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{bookedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Room Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">All Rooms ({roomsWithStatus.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LocalLoader loaderKey="room-status">
            {loadingRooms || loadingBookings ? (
              <p className="text-center text-muted-foreground py-8">Loading room status...</p>
            ) : roomsWithStatus.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No rooms available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {roomsWithStatus.map((room) => (
                  <Card
                    key={room.id}
                    className={`${
                      room.status === 'booked'
                        ? 'border-red-300 bg-red-50'
                        : room.room_type === 'VIP'
                        ? 'border-amber-200 bg-amber-50/50'
                        : 'border-green-300 bg-green-50/50'
                    }`}
                  >
                    <CardContent className="p-4">
                      {/* Room Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Hotel className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-semibold text-base">{room.displayName}</h3>
                        </div>
                        {room.room_type === 'VIP' && (
                          <Crown className="h-4 w-4 text-amber-600" />
                        )}
                      </div>

                      {/* Room Type Badge */}
                      <div className="mb-3">
                        {room.room_type === 'VIP' ? (
                          <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                            <Crown className="h-3 w-3 mr-1" />
                            VIP Room
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Normal Room</Badge>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="mb-3">
                        {room.status === 'available' ? (
                          <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
                            Available
                          </Badge>
                        ) : (
                          <Badge className="text-xs bg-red-100 text-red-700 border-red-300">
                            Booked
                          </Badge>
                        )}
                      </div>

                      {/* Booking Details (if booked) */}
                      {room.booking && (
                        <div className="space-y-2 pt-3 border-t">
                          {/* Booking Type Badge */}
                          <div className="mb-2">
                            {(() => {
                              const bookingInfo = getBookingType(room.booking);
                              return bookingInfo.type === 'short_time' ? (
                                <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Short Time ({bookingInfo.duration})
                                </Badge>
                              ) : (
                                <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Full Day ({bookingInfo.duration})
                                </Badge>
                              );
                            })()}
                          </div>

                          <div className="flex items-start gap-2 text-xs">
                            <User className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="font-medium">{room.booking.customerName}</p>
                              {room.booking.customerPhone && (
                                <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Phone className="h-3 w-3" />
                                  {room.booking.customerPhone}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-start gap-2 text-xs">
                            <Calendar className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="text-muted-foreground">
                                In: {format(new Date(room.booking.checkInDate), "MMM dd, HH:mm")}
                              </p>
                              <p className="text-muted-foreground">
                                Out: {format(new Date(room.booking.checkOutDate), "MMM dd, HH:mm")}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t">
                            <p className="text-xs font-semibold mb-2">
                              Total: ${Number(room.booking.totalAmount).toFixed(2)}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs"
                              onClick={() => handleViewDetails(room.booking!)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Full Details
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </LocalLoader>
        </CardContent>
      </Card>

      {/* Full Details Dialog */}
      {selectedBooking && (
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                Booking Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Booking Type */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Booking Type</h3>
                {(() => {
                  const bookingInfo = getBookingType(selectedBooking);
                  return bookingInfo.type === 'short_time' ? (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                      <Clock className="h-4 w-4 mr-1" />
                      Short Time - {bookingInfo.duration}
                    </Badge>
                  ) : (
                    <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                      <Calendar className="h-4 w-4 mr-1" />
                      Full Day (Holiday) - {bookingInfo.duration}
                    </Badge>
                  );
                })()}
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="font-semibold text-sm mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Customer Name</p>
                      <p className="font-medium">{selectedBooking.customerName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{selectedBooking.customerPhone}</p>
                    </div>
                  </div>

                  {selectedBooking.customerNic && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">NIC</p>
                        <p className="font-medium">{selectedBooking.customerNic}</p>
                      </div>
                    </div>
                  )}

                  {selectedBooking.customerAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="font-medium">{selectedBooking.customerAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Period */}
              <div>
                <h3 className="font-semibold text-sm mb-3">Booking Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Check-in</p>
                      <p className="font-medium">
                        {format(new Date(selectedBooking.checkInDate), "PPP 'at' p")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Check-out</p>
                      <p className="font-medium">
                        {format(new Date(selectedBooking.checkOutDate), "PPP 'at' p")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booked Rooms */}
              <div>
                <h3 className="font-semibold text-sm mb-3">
                  Rooms Booked ({selectedBooking.bookedRooms.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedBooking.bookedRooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-3 border rounded-lg bg-muted/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Hotel className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{room.roomName}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ${Number(room.pricePerNight).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Information */}
              <div>
                <h3 className="font-semibold text-sm mb-3">Booking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Booked By</p>
                      <p className="font-medium">{selectedBooking.cashierName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Booking Date</p>
                      <p className="font-medium">
                        {format(new Date(selectedBooking.createdAt), "PPP 'at' p")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">💰</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        {selectedBooking.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">💵</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="font-bold text-lg text-primary">
                        ${Number(selectedBooking.totalAmount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => setDetailsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RoomStatus;

