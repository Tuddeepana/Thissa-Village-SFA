import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Crown, Hotel, Calendar, User, Phone, Clock, Eye, MapPin, LogOut, Filter, X } from "lucide-react";
import { roomService } from "@/api/services/roomService";
import { roomBookingService } from "@/api/services/roomBookingService";
import type { ExpandedRoomItem } from "@/types/room.types";
import type { RoomBooking } from "@/types/room-booking.types";
import { useQuery } from "@tanstack/react-query";
import LocalLoader from "@/components/common/LocalLoader";
import { PaymentDialog } from "@/components/pos/PaymentDialog";
import { format, differenceInHours, differenceInDays, isToday, startOfDay, endOfDay } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface RoomWithBooking extends ExpandedRoomItem {
  booking?: RoomBooking;
  status: 'available' | 'booked';
}

const RoomStatus = () => {
  const [roomsWithStatus, setRoomsWithStatus] = useState<RoomWithBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [bookingToRelease, setBookingToRelease] = useState<RoomBooking | null>(null);

  // Payment settlement states
  const currentUser = {
    name: (() => {
      try {
        const raw = localStorage.getItem("authUser");
        if (!raw) return "Cashier";
        const user = JSON.parse(raw);
        return user?.name ?? "Cashier";
      } catch {
        return "Cashier";
      }
    })(),
  };
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [bookingToSettle, setBookingToSettle] = useState<RoomBooking | null>(null);

  // Filter states
  const [roomStatusFilter, setRoomStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [todayFilter, setTodayFilter] = useState(true);

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
      return { type: 'Short Time', duration: `${hours} hour${hours !== 1 ? 's' : ''}` };
    } else {
      const nights = days > 0 ? days : 1;
      return { type: 'Full Time', duration: `${nights} night${nights !== 1 ? 's' : ''}` };
    }
  };

  // Filter rooms based on filters
  const filteredRooms = useMemo(() => {
    let filtered = [...roomsWithStatus];

    // Room status filter
    if (roomStatusFilter !== "all") {
      filtered = filtered.filter(room => room.status === roomStatusFilter);
    }

    // Date filter
    if (todayFilter) {
      filtered = filtered.filter(room => {
        if (!room.booking) return true; // Show available rooms
        const checkIn = new Date(room.booking.checkInDate);
        const checkOut = new Date(room.booking.checkOutDate);
        const now = new Date();
        return isToday(checkIn) || isToday(checkOut) || (checkIn < now && checkOut > now);
      });
    } else if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(room => {
        if (!room.booking) return false; // Hide available rooms when specific date is selected
        const checkIn = new Date(room.booking.checkInDate);
        const checkOut = new Date(room.booking.checkOutDate);
        return checkIn <= endOfDay(filterDate) && checkOut >= startOfDay(filterDate);
      });
    }

    return filtered;
  }, [roomsWithStatus, roomStatusFilter, dateFilter, todayFilter]);

  const handleViewDetails = (booking: RoomBooking) => {
    setSelectedBooking(booking);
    setDetailsDialogOpen(true);
  };

  const handleReleaseRoom = (booking: RoomBooking) => {
    setBookingToRelease(booking);
    setReleaseDialogOpen(true);
  };

  const confirmReleaseRoom = async () => {
    if (!bookingToRelease) return;

    try {
      await roomBookingService.checkOut(bookingToRelease.id);
      toast.success("Room released successfully");
      setReleaseDialogOpen(false);
      setBookingToRelease(null);
      // Refetch data
      window.location.reload();
    } catch (error) {
      console.error("Failed to release room:", error);
      toast.error("Failed to release room");
    }
  };

  const clearFilters = () => {
    setRoomStatusFilter("all");
    setDateFilter("");
    setTodayFilter(true);
  };

  const handleSettleBalance = (booking: RoomBooking) => {
    setBookingToSettle(booking);
    setPaymentDialogOpen(true);
  };

  const confirmSettleBalance = async (
    paymentMethod: 'cash' | 'card' | 'credit',
    amountPaid: number,
    creditDescription?: string
  ) => {
    if (!bookingToSettle) return;

    try {
      const result = await roomBookingService.settleBalance(bookingToSettle.id, {
        paymentMethod: paymentMethod.toUpperCase(),
        cashGiven: amountPaid,
        cashierName: currentUser.name,
      });

      toast.success("Balance settled successfully", {
        description: `Bill #${result.bill.bill_number} created`,
      });
      setPaymentDialogOpen(false);
      setBookingToSettle(null);
      // Refetch data
      window.location.reload();
    } catch (error) {
      console.error("Failed to settle balance:", error);
      toast.error("Failed to settle balance");
    }
  };

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Room Status</h1>
        <p className="text-sm md:text-base text-muted-foreground">View and manage room availability and bookings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Hotel className="h-4 w-4" />
              Total Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{roomsWithStatus.length}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Hotel className="h-4 w-4" />
              Available Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{availableCount}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <Hotel className="h-4 w-4" />
              Booked Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">{bookedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Room Status Filter */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Room Status</Label>
              <Select value={roomStatusFilter} onValueChange={setRoomStatusFilter}>
                <SelectTrigger className="h-9 md:h-10">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Today Filter Checkbox */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Date Filter</Label>
              <div className="flex items-center space-x-2 h-9 md:h-10">
                <Checkbox
                  id="today"
                  checked={todayFilter}
                  onCheckedChange={(checked) => {
                    setTodayFilter(!!checked);
                    if (checked) setDateFilter("");
                  }}
                />
                <label
                  htmlFor="today"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Today
                </label>
              </div>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Select Date</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  if (e.target.value) setTodayFilter(false);
                }}
                disabled={todayFilter}
                className="h-9 md:h-10"
              />
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm hidden md:block">&nbsp;</Label>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="h-9 md:h-10 w-full gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Room Details ({filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LocalLoader loaderKey="room-status">
            {loadingRooms || loadingBookings ? (
              <p className="text-center text-muted-foreground py-8">Loading room status...</p>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Hotel className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No rooms found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Room Number</TableHead>
                      <TableHead className="font-semibold">Room Type</TableHead>
                      <TableHead className="font-semibold">From Date</TableHead>
                      <TableHead className="font-semibold">To Date</TableHead>
                      <TableHead className="font-semibold">Booking Type</TableHead>
                      <TableHead className="font-semibold">Payment Status</TableHead>
                      <TableHead className="font-semibold">Room Status</TableHead>
                      <TableHead className="text-center font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRooms.map((room) => (
                      <TableRow key={room.id}>
                        {/* Room Number */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Hotel className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{room.displayName}</span>
                          </div>
                        </TableCell>

                        {/* Room Type */}
                        <TableCell>
                          {room.room_type === 'VIP' ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                              <Crown className="h-3 w-3 mr-1" />
                              VIP
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Normal</Badge>
                          )}
                        </TableCell>

                        {/* From Date */}
                        <TableCell>
                          {room.booking ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(room.booking.checkInDate), "MMM dd, yyyy HH:mm")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* To Date */}
                        <TableCell>
                          {room.booking ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(room.booking.checkOutDate), "MMM dd, yyyy HH:mm")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Booking Type */}
                        <TableCell>
                          {room.booking ? (
                            (() => {
                              const bookingInfo = getBookingType(room.booking);
                              return bookingInfo.type === 'Short Time' ? (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {bookingInfo.type}
                                </Badge>
                              ) : (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {bookingInfo.type}
                                </Badge>
                              );
                            })()
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Payment Status */}
                        <TableCell>
                          {room.booking ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="w-fit text-xs">
                                {room.booking.paymentType === 'FULL_PAYMENT' ? 'Full' :
                                 room.booking.paymentType === 'ADVANCE_PAYMENT' ? 'Advance' : 'On-Call'}
                              </Badge>
                              {room.booking.paymentType !== 'FULL_PAYMENT' && room.booking.paidAmount < room.booking.totalAmount && (
                                <span className="text-xs text-red-600 font-medium whitespace-nowrap">
                                  Due: Rs. {(room.booking.totalAmount - room.booking.paidAmount).toFixed(2)}
                                </span>
                              )}
                              {room.booking.paidAmount >= room.booking.totalAmount && (
                                <span className="text-xs text-green-600 font-medium">Fully Paid</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Room Status */}
                        <TableCell>
                          {room.status === 'available' ? (
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              Available
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-300">
                              Booked
                            </Badge>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            {room.booking && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDetails(room.booking!)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {room.booking.paidAmount < room.booking.totalAmount && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleSettleBalance(room.booking!)}
                                    title="Settle Balance"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <span className="text-lg leading-none">💰</span>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReleaseRoom(room.booking!)}
                                  title="Release Room"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <LogOut className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {!room.booking && (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </LocalLoader>
        </CardContent>
      </Card>

      {/* Release Room Confirmation Dialog */}
      <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-600" />
              Release Room
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to release this room? This action will mark the booking as checked out.
            </DialogDescription>
          </DialogHeader>

          {bookingToRelease && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Customer:</span>
                  <span className="font-medium">{bookingToRelease.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rooms:</span>
                  <span className="font-medium">{bookingToRelease.bookedRooms.length} room(s)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount:</span>
                  <span className="font-medium">Rs. {Number(bookingToRelease.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReleaseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmReleaseRoom}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Release Room
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                  return bookingInfo.type === 'Short Time' ? (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                      <Clock className="h-4 w-4 mr-1" />
                      Short Time - {bookingInfo.duration}
                    </Badge>
                  ) : (
                    <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                      <Calendar className="h-4 w-4 mr-1" />
                      Full Time - {bookingInfo.duration}
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
                        Rs. {Number(room.pricePerNight).toFixed(2)}
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
                        Rs. {Number(selectedBooking.totalAmount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">💳</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Status</p>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {selectedBooking.paymentType === 'FULL_PAYMENT' ? 'Full Payment' :
                           selectedBooking.paymentType === 'ADVANCE_PAYMENT' ? 'Advance Payment' : 'On-Call Booking'}
                        </span>
                        {selectedBooking.paidAmount < selectedBooking.totalAmount ? (
                          <span className="text-sm text-red-600">
                            Due: Rs. {(selectedBooking.totalAmount - selectedBooking.paidAmount).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm text-green-600">Fully Paid</span>
                        )}
                      </div>
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
      {/* Payment Dialog for Settling Balance */}
      {bookingToSettle && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          total={bookingToSettle.totalAmount - bookingToSettle.paidAmount}
          onConfirmPayment={confirmSettleBalance}
        />
      )}
    </div>
  );
};

export default RoomStatus;

