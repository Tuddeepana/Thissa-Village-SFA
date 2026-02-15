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
import { Textarea } from "@/components/ui/textarea";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirmPayment: (
    paymentMethod: 'cash' | 'card' | 'credit' | 'other',
    amountPaid: number,
    customerName?: string,
    customerPhone?: string,
    creditDescription?: string
  ) => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirmPayment,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit' | 'other'>('cash');
  const [amountPaid, setAmountPaid] = useState(total.toString());
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [creditDescription, setCreditDescription] = useState("");

  const amountPaidNum = parseFloat(amountPaid) || 0;
  const change = Math.max(0, amountPaidNum - total);
  const isCredit = paymentMethod === 'credit';
  const creditMissing = isCredit && creditDescription.trim() === '';

  const handleConfirm = () => {
    // For credit, amount paid can be 0, otherwise must be >= total
    if (isCredit || amountPaidNum >= total) {
      onConfirmPayment(
        paymentMethod,
        isCredit ? 0 : amountPaidNum,
        customerName || undefined,
        customerPhone || undefined,
        isCredit ? creditDescription || undefined : undefined
      );
      // Reset form
      setAmountPaid(total.toString());
      setCustomerName("");
      setCustomerPhone("");
      setCreditDescription("");
      setPaymentMethod('cash');
    }
  };

  const handleQuickAmount = (amount: number) => {
    setAmountPaid(amount.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Complete Payment</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Enter payment details to complete the transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 md:space-y-4 py-2 md:py-4">
          {/* Customer Information (Optional) */}
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="customerName" className="text-xs md:text-sm">Customer Name (Optional)</Label>
            <Input
              id="customerName"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="text-xs md:text-sm h-8 md:h-9"
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="customerPhone" className="text-xs md:text-sm">Customer Phone (Optional)</Label>
            <Input
              id="customerPhone"
              placeholder="Enter customer phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="text-xs md:text-sm h-8 md:h-9"
            />
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="paymentMethod" className="text-xs md:text-sm">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card' | 'credit' | 'other')}
            >
              <SelectTrigger id="paymentMethod" className="text-xs md:text-sm h-8 md:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash" className="text-xs md:text-sm">Cash</SelectItem>
                <SelectItem value="card" className="text-xs md:text-sm">Card</SelectItem>
                <SelectItem value="credit" className="text-xs md:text-sm">Credit</SelectItem>
                <SelectItem value="other" className="text-xs md:text-sm">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Credit Description - Only show when Credit is selected */}
          {isCredit && (
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="creditDescription" className="text-xs md:text-sm">Credit Description</Label>
              <Textarea
                id="creditDescription"
                placeholder="Enter credit details (e.g., customer account, due date, terms...)"
                value={creditDescription}
                onChange={(e) => setCreditDescription(e.target.value)}
                rows={3}
                className="text-xs md:text-sm"
              />
              {creditMissing && (
                <p className="text-xs md:text-sm text-red-500">Credit note is required for credit payments</p>
              )}
            </div>
          )}

          {/* Total Amount */}
          <div className="bg-muted p-3 md:p-4 rounded-lg">
            <div className="flex justify-between items-center text-base md:text-lg font-bold">
              <span>Total Amount:</span>
              <span className="text-primary">Rs. {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Amount Paid - Hide for Credit */}
          {!isCredit && (
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="amountPaid" className="text-xs md:text-sm">Amount Paid</Label>
              <Input
                id="amountPaid"
                type="number"
                min={total}
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="text-base md:text-lg font-semibold h-9 md:h-10"
              />
            </div>
          )}

          {/* Quick Amount Buttons */}
          {paymentMethod === 'cash' && (
            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-xs md:text-sm">Quick Amount</Label>
              <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                {[100, 500, 1000, 2000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(amount)}
                    disabled={amount < total}
                    className="text-xs md:text-sm h-7 md:h-8 px-1 md:px-3"
                  >
                    Rs. {amount}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(total)}
                  className="text-xs md:text-sm h-7 md:h-8 px-1 md:px-3"
                >
                  Exact
                </Button>
              </div>
            </div>
          )}

          {/* Change */}
          {paymentMethod === 'cash' && (
            <div className="bg-green-50 dark:bg-green-950 p-3 md:p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-xs md:text-sm font-medium">Change to Return:</span>
                <span className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">
                  Rs. {change.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Validation Message */}
          {!isCredit && amountPaidNum < total && (
            <p className="text-xs md:text-sm text-red-500">
              Amount paid must be at least Rs. {total.toFixed(2)}
            </p>
          )}

          {/* Credit Info Message */}
          {isCredit && (
            <div className="bg-yellow-50 dark:bg-yellow-950 p-3 md:p-4 rounded-lg">
              <p className="text-xs md:text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Credit Sale:</strong> This transaction will be recorded as credit.
                No payment is required at this time.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs md:text-sm h-8 md:h-9">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={(!isCredit && amountPaidNum < total) || creditMissing}
            aria-disabled={(!isCredit && amountPaidNum < total) || creditMissing}
            className="text-xs md:text-sm h-8 md:h-9"
          >
            {isCredit ? "Confirm Credit Sale" : "Confirm & Print Bill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
