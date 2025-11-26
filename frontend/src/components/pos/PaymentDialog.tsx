import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirmPayment: (
    paymentMethod: 'cash' | 'card' | 'other',
    amountPaid: number,
    customerName?: string,
    customerPhone?: string
  ) => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirmPayment,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [amountPaid, setAmountPaid] = useState(total.toString());
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const amountPaidNum = parseFloat(amountPaid) || 0;
  const change = Math.max(0, amountPaidNum - total);

  const handleConfirm = () => {
    if (amountPaidNum >= total) {
      onConfirmPayment(
        paymentMethod,
        amountPaidNum,
        customerName || undefined,
        customerPhone || undefined
      );
      // Reset form
      setAmountPaid(total.toString());
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMethod('cash');
    }
  };

  const handleQuickAmount = (amount: number) => {
    setAmountPaid(amount.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Enter payment details to complete the transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Information (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name (Optional)</Label>
            <Input
              id="customerName"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Customer Phone (Optional)</Label>
            <Input
              id="customerPhone"
              placeholder="Enter customer phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card' | 'other')}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Total Amount */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount:</span>
              <span className="text-primary">Rs. {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Amount Paid */}
          <div className="space-y-2">
            <Label htmlFor="amountPaid">Amount Paid</Label>
            <Input
              id="amountPaid"
              type="number"
              min={total}
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>

          {/* Quick Amount Buttons */}
          {paymentMethod === 'cash' && (
            <div className="space-y-2">
              <Label>Quick Amount</Label>
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 2000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(amount)}
                    disabled={amount < total}
                  >
                    Rs. {amount}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(total)}
                >
                  Exact
                </Button>
              </div>
            </div>
          )}

          {/* Change */}
          {paymentMethod === 'cash' && (
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Change to Return:</span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  Rs. {change.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Validation Message */}
          {amountPaidNum < total && (
            <p className="text-sm text-red-500">
              Amount paid must be at least Rs. {total.toFixed(2)}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={amountPaidNum < total}
          >
            Confirm & Print Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
