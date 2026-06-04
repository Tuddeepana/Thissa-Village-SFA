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
import type { AvailableRoom } from "@/types/room-booking.types";
import { toast } from "sonner";

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
  const [generateBill, setGenerateBill] = useState(true);

  // Helper function to get average price for selected rooms
  const getAveragePrice = (priceType: 'full_day' | 'short_time') => {
    if (selectedRooms.size === 0) return 0;
    let totalPrice = 0;
    Array.from(selectedRooms).forEach(roomId => {
      const room = availableRooms.find(r => r.id === roomId);
      if (room) {
        totalPrice += priceType === 'full_day' ? room.priceFullDay : room.priceShortTime;
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

  const toggleRoomSelection = (roomId: string) => {
    const newSelection = new Set(selectedRooms);
    if (newSelection.has(roomId)) {
      newSelection.delete(roomId);
    } else {
      newSelection.add(roomId);
    }
    setSelectedRooms(newSelection);
  };

  const calculateTotal = () => {
    if (bookingType === 'short_time') {
      // Short time: sum of (room hourly price × hours) for each room
      let total = 0;
      Array.from(selectedRooms).forEach(roomId => {
        const room = availableRooms.find(r => r.id === roomId);
        if (room) {
          total += room.priceShortTime * shortTimeHours;
        }
      });
      return total;
    } else {
      // Full day: sum of (room nightly price × nights) for each room
      if (!checkInDate || !checkOutDate) return 0;

      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

      let total = 0;
      Array.from(selectedRooms).forEach(roomId => {
        const room = availableRooms.find(r => r.id === roomId);
        if (room) {
          total += room.priceFullDay * nights;
        }
      });
      return total;
    }
  };

  const calculateNights = () => {
    if (bookingType === 'short_time') {
      return shortTimeHours; // Return hours for short time
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
        return {
          roomId: room?.baseRoomId || roomId.split('-')[0],
          roomName: room?.displayName || '',
          pricePerNight: bookingType === 'short_time' 
            ? (room?.priceShortTime || 0)
            : (room?.priceFullDay || 0),
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
        paymentMethod,
        cashGiven: cashGiven || calculateTotal(),
        generateBill,
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

      // Reset form
      setCustomerName("");
      setCustomerNic("");
      setCustomerPhone("");
      setCustomerAddress("");
      setSelectedRooms(new Set());
      setCashGiven(0);
      setPaymentMethod('CASH');
      setGenerateBill(true);
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
                {availableRooms.map((room) => (
                  <Card
                    key={room.id}
                    className={`cursor-pointer transition-all ${
                      selectedRooms.has(room.id)
                        ? room.room_type === 'VIP'
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-primary bg-primary/10'
                        : room.room_type === 'VIP'
                        ? 'border-amber-200 hover:border-amber-400'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => toggleRoomSelection(room.id)}
                  >
                    <div className="p-3 text-center">
                      {room.room_type === 'VIP' && (
                        <Crown className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                      )}
                      <p className="font-semibold text-sm">{room.displayName}</p>
                      {room.room_type === 'VIP' && (
                        <Badge className="text-xs bg-amber-100 text-amber-800 mt-1">VIP</Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Rs. {bookingType === 'short_time' ? room.priceShortTime : room.priceFullDay}/{bookingType === 'short_time' ? 'hour' : 'night'}
                      </p>
                      {selectedRooms.has(room.id) && (
                        <Badge className="mt-2 bg-green-100 text-green-700">Selected</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {selectedRooms.size > 0 && (
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedRooms).map(roomId => {
                  const room = availableRooms.find(r => r.id === roomId);
                  return room ? (
                    <Badge key={roomId} variant="secondary" className="gap-1">
                      {room.displayName}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRoomSelection(roomId);
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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="generateBill"
                    checked={generateBill}
                    onChange={(e) => setGenerateBill(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="generateBill" className="font-semibold cursor-pointer">
                    Generate Bill (POS Receipt)
                  </Label>
                </div>

                {generateBill && (
                  <div className="space-y-4 pl-6">
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

                    {paymentMethod === 'CASH' && (
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
                            Change: <strong>Rs. {(cashGiven - calculateTotal()).toFixed(2)}</strong>
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

