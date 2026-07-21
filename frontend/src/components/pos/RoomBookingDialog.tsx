import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Crown, Hotel, Loader2, X } from "lucide-react";
import { roomBookingService } from "@/api/services/roomBookingService";
import { roomTypeService } from "@/api/services/roomTypeService";
import type { RoomTypeConfig } from '@/types/room-type.types';
import type { AvailableRoom } from "@/types/room-booking.types";
import { toast } from "sonner";
import { printRoomBill } from "@/lib/roomBillPrinter";

interface RoomBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashierName: string;
  onBookingSuccess: () => void;
}

export function RoomBookingDialog({ open, onOpenChange, cashierName, onBookingSuccess }: RoomBookingDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerNic, setCustomerNic] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [bookingType, setBookingType] = useState<"short_time" | "full_day">("full_day");
  const [shortTimeHours, setShortTimeHours] = useState(1);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CREDIT'>('CASH');
  const [cashGiven, setCashGiven] = useState(0);
  const [paymentType, setPaymentType] = useState<'FULL_PAYMENT' | 'ADVANCE_PAYMENT' | 'ON_CALL'>('FULL_PAYMENT');
  const [advanceAmount, setAdvanceAmount] = useState(0);

  // Room type support for per-selection override
  const [roomTypes, setRoomTypes] = useState<RoomTypeConfig[]>([]);
  const [roomToConfigure, setRoomToConfigure] = useState<AvailableRoom | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [chosenRoomTypes, setChosenRoomTypes] = useState<Record<string,string>>({});
  const [priceOverrides, setPriceOverrides] = useState<Record<string, { full: number; short: number }>>({});

  useEffect(() => {
    let cancelled = false;
    const fetchTypes = async () => {
      try {
        const { roomTypes } = await roomTypeService.list();
        if (!cancelled) setRoomTypes(roomTypes.map(r => ({ ...r, type: (r.type || '').toUpperCase() })));
      } catch (err) {
        console.error('Failed to load room types', err);
      }
    };
    fetchTypes();
    return () => { cancelled = true; };
  }, []);

  // Helper function to get average price for selected rooms
  const getAveragePrice = (priceType: 'full_day' | 'short_time') => {
    if (selectedRooms.size === 0) return 0;
    let totalPrice = 0;
    Array.from(selectedRooms).forEach(roomId => {
      const room = availableRooms.find(r => r.id === roomId);
      if (room) {
        const override = priceOverrides[roomId];
        const price = priceType === 'full_day' ? (override?.full ?? 0) : (override?.short ?? 0);
        totalPrice += price;
      }
    });
    return totalPrice / selectedRooms.size;
  };

  // Set default check-in date to today
  useEffect(() => {
    if (open) {
      const now = new Date();
      const today = new Date(now);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      setCheckInDate(today.toISOString().split('T')[0]);
      setCheckOutDate(tomorrow.toISOString().split('T')[0]);

      // Set current time for short time bookings
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      setCheckInTime(`${currentHour}:${currentMinute}`);

      // Set checkout time based on short time hours
      const checkoutTime = new Date(now.getTime() + shortTimeHours * 60 * 60 * 1000);
      setCheckOutTime(`${checkoutTime.getHours().toString().padStart(2, '0')}:${checkoutTime.getMinutes().toString().padStart(2, '0')}`);
    }
  }, [open, shortTimeHours]);

  const fetchAvailableRooms = useCallback(async () => {
    if (!checkInDate || (bookingType === 'full_day' && !checkOutDate)) return;
    if (bookingType === 'short_time' && !checkInTime) return;

    let checkInDateTime: Date;
    let checkOutDateTime: Date;

    if (bookingType === 'short_time') {
      // Short time: same day, specific hours
      checkInDateTime = new Date(`${checkInDate}T${checkInTime}`);
      checkOutDateTime = new Date(checkInDateTime.getTime() + shortTimeHours * 60 * 60 * 1000);
    } else {
      // Full day: date range
      checkInDateTime = new Date(checkInDate);
      checkOutDateTime = new Date(checkOutDate);

      if (checkOutDateTime <= checkInDateTime) {
        toast.error("Check-out date must be after check-in date");
        return;
      }
    }

    setLoadingRooms(true);
    try {
      const response = await roomBookingService.getAvailableRooms(
        checkInDateTime.toISOString(),
        checkOutDateTime.toISOString()
      );
      setAvailableRooms(response.rooms);
      setSelectedRooms(new Set()); // Clear selections when dates change
      setChosenRoomTypes({});
      setPriceOverrides({});
    } catch (error) {
      console.error("Failed to fetch available rooms:", error);
      toast.error("Failed to load available rooms");
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, [checkInDate, checkOutDate, checkInTime, bookingType, shortTimeHours]);

  // Fetch available rooms when dates change
  useEffect(() => {
    if (open) {
      if (bookingType === 'full_day' && checkInDate && checkOutDate) {
        fetchAvailableRooms();
      } else if (bookingType === 'short_time' && checkInDate && checkInTime) {
        fetchAvailableRooms();
      }
    }
  }, [checkInDate, checkOutDate, checkInTime, bookingType, shortTimeHours, open, fetchAvailableRooms]);

  const removeRoomSelection = (roomId: string) => {
    setSelectedRooms(prev => {
      const newSelection = new Set(prev);
      newSelection.delete(roomId);
      return newSelection;
    });
    setChosenRoomTypes(prev => {
      const newTypes = { ...prev };
      delete newTypes[roomId];
      return newTypes;
    });
    setPriceOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[roomId];
      return newOverrides;
    });
  };

  const handleRoomClick = (room: AvailableRoom) => {
    if (selectedRooms.has(room.id)) {
      removeRoomSelection(room.id);
      return;
    }

    // Auto select if only one type
    const roomTypesList = room.room_types || [];
    if (roomTypesList.length === 1) {
      const chosen = roomTypesList[0].toUpperCase();
      const rt = roomTypes.find(r => r.type.toUpperCase() === chosen);
      if (rt) {
        setChosenRoomTypes(prev => ({ ...prev, [room.id]: chosen }));
        setPriceOverrides(prev => ({ ...prev, [room.id]: { full: Number(rt.price_full_day), short: Number(rt.price_short_time) } }));
        setSelectedRooms(prev => new Set(Array.from(prev).concat([room.id])));
        return;
      }
    }

    // Otherwise, open configure dialog
    setSelectedRoomType(roomTypesList.length > 0 ? roomTypesList[0] : '');
    setRoomToConfigure(room);
  };

  const confirmConfigureRoom = () => {
    if (!roomToConfigure) return;
    const room = roomToConfigure;
    const chosen = (selectedRoomType || '').toUpperCase();

    const rt = roomTypes.find(r => r.type.toUpperCase() === chosen);
    if (!rt) {
      toast.error("Invalid room type selected");
      return;
    }

    // store chosen type
    setChosenRoomTypes(prev => ({ ...prev, [room.id]: chosen }));
    setPriceOverrides(prev => ({ ...prev, [room.id]: { full: Number(rt.price_full_day), short: Number(rt.price_short_time) } }));

    // mark as selected
    setSelectedRooms(prev => new Set(Array.from(prev).concat([room.id])));

    // reset
    setRoomToConfigure(null);
    setSelectedRoomType('');
  };

  const calculateTotal = () => {
    if (selectedRooms.size === 0) return 0;

    if (bookingType === 'short_time') {
      let total = 0;
      Array.from(selectedRooms).forEach(roomId => {
        const override = priceOverrides[roomId];
        const price = override?.short ?? 0;
        total += price * shortTimeHours;
      });
      return total;
    } else {
      if (!checkInDate || !checkOutDate) return 0;
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

      let total = 0;
      Array.from(selectedRooms).forEach(roomId => {
        const override = priceOverrides[roomId];
        const price = override?.full ?? 0;
        total += price * nights;
      });
      return total;
    }
  };

  const calculateNights = () => {
    if (bookingType === 'short_time') {
      return shortTimeHours; 
    }

    if (!checkInDate || !checkOutDate) return 0;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getCheckOutDateTime = () => {
    if (bookingType === 'short_time') {
      const checkIn = new Date(`${checkInDate}T${checkInTime}`);
      const checkOut = new Date(checkIn.getTime() + shortTimeHours * 60 * 60 * 1000);
      return checkOut.toISOString();
    } else {
      return new Date(checkOutDate).toISOString();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!customerPhone.trim()) {
      toast.error("Customer phone is required");
      return;
    }

    if (selectedRooms.size === 0) {
      toast.error("Please select at least one room");
      return;
    }

    setSubmitting(true);
    try {
      const rooms = Array.from(selectedRooms).map(roomId => {
        const room = availableRooms.find(r => r.id === roomId);
        const override = priceOverrides[roomId];
        const type = chosenRoomTypes[roomId];
        return {
          roomId: room?.baseRoomId || roomId.split('-')[0],
          roomName: room?.displayName || '',
          roomType: type,
          pricePerNight: Number(bookingType === 'short_time' 
            ? (override?.short ?? 0)
            : (override?.full ?? 0)),
        };
      });

      const checkInDateTime = bookingType === 'short_time'
        ? new Date(`${checkInDate}T${checkInTime}`).toISOString()
        : new Date(checkInDate).toISOString();

      const bookingPayload = {
        customerName,
        customerNic: customerNic || undefined,
        customerPhone,
        customerAddress: customerAddress || undefined,
        checkInDate: checkInDateTime,
        checkOutDate: getCheckOutDateTime(),
        totalAmount: calculateTotal(),
        cashierName,
        rooms,
        paymentType,
        advanceAmount: paymentType === 'ADVANCE_PAYMENT' ? advanceAmount : undefined,
        paymentMethod: paymentType !== 'ON_CALL' ? paymentMethod : undefined,
        cashGiven: paymentType !== 'ON_CALL' ? (cashGiven || (paymentType === 'ADVANCE_PAYMENT' ? advanceAmount : calculateTotal())) : undefined,
      };

      console.log('🏨 Creating room booking with payload:', bookingPayload);

      const result = await roomBookingService.create(bookingPayload);

      console.log('✅ Room booking result:', result);

      // Show success message with bill info if generated
      if (result.bill) {
        console.log('🧾 Bill generated:', result.bill.bill_number);
        toast.success("Room booking and bill created successfully!", {
          description: `${selectedRooms.size} room(s) booked. Bill #${result.bill.bill_number}`,
          duration: 5000,
        });
      } else {
        console.log('ℹ️ No bill generated');
        toast.success("Room booking created successfully!", {
          description: `${selectedRooms.size} room(s) booked for ${customerName}`,
        });
      }

      // Auto-print the bill / booking slip
      try {
        const booking = result.booking;
        const bill = result.bill;
        await printRoomBill({
          billNumber: bill?.bill_number,
          bookingId: booking.id,
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerNic: booking.customerNic,
          customerAddress: booking.customerAddress,
          cashierName: booking.cashierName || cashierName,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          bookedRooms: booking.bookedRooms.map(r => ({
            roomName: r.roomName,
            pricePerNight: Number(r.pricePerNight),
          })),
          totalAmount: booking.totalAmount,
          paidAmount: booking.paidAmount,
          paymentType: booking.paymentType,
          paymentMethod: bill?.payment_method || (bookingPayload.paymentType !== 'ON_CALL' ? bookingPayload.paymentMethod : undefined),
          cashGiven: bill?.cash_given ? Number(bill.cash_given) : bookingPayload.cashGiven,
          balanceGiven: bill?.balance_given ? Number(bill.balance_given) : undefined,
          createdAt: booking.createdAt,
        });
      } catch (printErr) {
        console.error("Auto-print failed:", printErr);
      }

      // Reset form
      setCustomerName("");
      setCustomerNic("");
      setCustomerPhone("");
      setCustomerAddress("");
      setSelectedRooms(new Set());
      setCashGiven(0);
      setPaymentMethod('CASH');
      setPaymentType('FULL_PAYMENT');
      setAdvanceAmount(0);
      setChosenRoomTypes({});
      setPriceOverrides({});
      onBookingSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create booking:", error);
      toast.error("Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            Book Room
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerNic">NIC</Label>
                <Input
                  id="customerNic"
                  value={customerNic}
                  onChange={(e) => setCustomerNic(e.target.value)}
                  placeholder="Enter NIC number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerAddress">Address</Label>
                <Input
                  id="customerAddress"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Enter address"
                />
              </div>
            </div>
          </div>

          {/* Booking Dates */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Booking Period
            </h3>

            {/* Booking Type Selection */}
            <div className="space-y-2">
              <Label>Booking Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={bookingType === "full_day" ? "default" : "outline"}
                  onClick={() => setBookingType("full_day")}
                >
                  Full Day (Holiday)
                </Button>
                <Button
                  type="button"
                  variant={bookingType === "short_time" ? "default" : "outline"}
                  onClick={() => setBookingType("short_time")}
                >
                  Short Time (Hourly)
                </Button>
              </div>
            </div>

            {bookingType === "short_time" ? (
              // Short Time Booking
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkInDate">Date *</Label>
                    <Input
                      id="checkInDate"
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkInTime">Check-in Time *</Label>
                    <Input
                      id="checkInTime"
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Duration (Hours) *</Label>
                    <Select
                      value={shortTimeHours.toString()}
                      onValueChange={(val) => setShortTimeHours(parseInt(val))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select hours" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Hour</SelectItem>
                        <SelectItem value="2">2 Hours</SelectItem>
                        <SelectItem value="3">3 Hours</SelectItem>
                        <SelectItem value="4">4 Hours</SelectItem>
                        <SelectItem value="5">5 Hours</SelectItem>
                        <SelectItem value="6">6 Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {checkInDate && checkInTime && (
                  <div className="text-sm p-3 bg-muted rounded-lg">
                    <p className="font-medium">Time Frame:</p>
                    <p className="text-muted-foreground">
                      Check-in: {checkInDate} at {checkInTime}
                    </p>
                    <p className="text-muted-foreground">
                      Check-out: {new Date(new Date(`${checkInDate}T${checkInTime}`).getTime() + shortTimeHours * 60 * 60 * 1000).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Duration: <strong>{shortTimeHours} hour{shortTimeHours !== 1 ? 's' : ''}</strong>
                    </p>
                  </div>
                )}
              </>
            ) : (
              // Full Day Booking
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkInDate">Check-in Date *</Label>
                    <Input
                      id="checkInDate"
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOutDate">Check-out Date *</Label>
                    <Input
                      id="checkOutDate"
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate}
                      required
                    />
                  </div>
                </div>
                {checkInDate && checkOutDate && calculateNights() > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Duration: <strong>{calculateNights()} night(s)</strong>
                  </p>
                )}
              </>
            )}
          </div>

          {/* Available Rooms */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Select Rooms</h3>
              {loadingRooms && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            {availableRooms.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {loadingRooms ? "Loading available rooms..." : "No rooms available for selected dates"}
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                {availableRooms.map((room) => {
                  const hasVIP = (room.room_types || []).includes('VIP');
                  return (
                    <Card
                      key={room.id}
                      className={`cursor-pointer transition-all ${
                        selectedRooms.has(room.id)
                          ? hasVIP
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-primary bg-primary/10'
                          : hasVIP
                          ? 'border-amber-200 hover:border-amber-400'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleRoomClick(room)}
                    >
                      <div className="p-3 text-center">
                        {hasVIP && (
                          <Crown className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                        )}
                        <p className="font-semibold text-sm">{room.displayName}</p>
                        
                        {selectedRooms.has(room.id) ? (
                          <div className="mt-1">
                            <Badge className="text-xs">{chosenRoomTypes[room.id]}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Rs. {bookingType === 'short_time' ? priceOverrides[room.id]?.short : priceOverrides[room.id]?.full}/{bookingType === 'short_time' ? 'hour' : 'night'}
                            </p>
                            <Badge className="mt-2 bg-green-100 text-green-700 hover:bg-green-200">Selected</Badge>
                          </div>
                        ) : (
                          <div className="mt-1 flex flex-col gap-1">
                            <div className="flex flex-wrap justify-center gap-1">
                              {(room.room_types || []).map(rt => (
                                <span key={rt} className="text-[10px] bg-secondary px-1 rounded-sm text-muted-foreground">{rt}</span>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 text-center">
                              Select to view prices
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {roomToConfigure && (
            <Dialog open={true} onOpenChange={(v) => { if (!v) setRoomToConfigure(null); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configure Room Type</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <p className="font-medium">{roomToConfigure.displayName}</p>
                  <div className="space-y-2">
                    <Label>Select Room Type</Label>
                    <Select value={selectedRoomType} onValueChange={(v) => setSelectedRoomType(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {(roomToConfigure.room_types || []).map(rt => (
                          <SelectItem key={rt} value={rt}>{rt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setRoomToConfigure(null)}>Cancel</Button>
                    <Button type="button" onClick={confirmConfigureRoom} disabled={!selectedRoomType}>Select Type</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            )}

            {selectedRooms.size > 0 && (
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedRooms).map(roomId => {
                  const room = availableRooms.find(r => r.id === roomId);
                  const type = chosenRoomTypes[roomId];
                  return room ? (
                    <Badge key={roomId} variant="secondary" className="gap-1 flex items-center">
                      {room.displayName} ({type})
                      <X
                        className="h-3 w-3 cursor-pointer ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRoomSelection(roomId);
                        }}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Booking Summary */}
          {selectedRooms.size > 0 && calculateNights() > 0 && (
            <>
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-sm">Booking Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Rooms:</span>
                    <span>{selectedRooms.size}</span>
                  </div>
                  {bookingType === 'short_time' ? (
                    <>
                      <div className="flex justify-between">
                        <span>Hours:</span>
                        <span>{shortTimeHours}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average price per hour:</span>
                        <span>Rs. {getAveragePrice('short_time').toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Nights:</span>
                        <span>{calculateNights()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average price per night:</span>
                        <span>Rs. {getAveragePrice('full_day').toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total Amount:</span>
                    <span>Rs. {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select value={paymentType} onValueChange={(value: 'FULL_PAYMENT' | 'ADVANCE_PAYMENT' | 'ON_CALL') => setPaymentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_PAYMENT">Full Payment (Generate Bill)</SelectItem>
                      <SelectItem value="ADVANCE_PAYMENT">Advance Payment (Partial Bill)</SelectItem>
                      <SelectItem value="ON_CALL">On-Call Booking (No Bill)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentType !== 'ON_CALL' && (
                  <div className="space-y-4">
                    {paymentType === 'ADVANCE_PAYMENT' && (
                      <div className="space-y-2">
                        <Label htmlFor="advanceAmount">Advance Amount *</Label>
                        <Input
                          id="advanceAmount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          max={calculateTotal()}
                          value={advanceAmount || ''}
                          onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                          placeholder="Enter advance amount"
                          required
                        />
                        {advanceAmount > 0 && (
                          <p className="text-sm mt-1">
                            <span className="text-muted-foreground">Due Amount: </span>
                            <strong className="text-red-600">Rs. {Math.max(0, calculateTotal() - advanceAmount).toFixed(2)}</strong>
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={(value: 'CASH' | 'CARD' | 'CREDIT') => setPaymentMethod(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="CARD">Card</SelectItem>
                          <SelectItem value="CREDIT">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentMethod === 'CASH' && paymentType !== 'ADVANCE_PAYMENT' && (
                      <div className="space-y-2">
                        <Label htmlFor="cashGiven">Cash Given</Label>
                        <Input
                          id="cashGiven"
                          type="number"
                          min="0"
                          step="0.01"
                          value={cashGiven || ''}
                          onChange={(e) => setCashGiven(parseFloat(e.target.value) || 0)}
                          placeholder="Enter cash amount"
                        />
                        {cashGiven > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Change: <strong>Rs. {(cashGiven - (paymentType === 'ADVANCE_PAYMENT' ? advanceAmount : calculateTotal())).toFixed(2)}</strong>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || selectedRooms.size === 0}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Book {selectedRooms.size} Room{selectedRooms.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

