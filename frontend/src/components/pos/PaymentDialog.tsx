import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirmPayment: (
    paymentMethod: 'cash' | 'card' | 'credit',
    amountPaid: number,
    creditDescription?: string
  ) => void;
  isPrinting?: boolean;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirmPayment,
  isPrinting = false,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [amountPaid, setAmountPaid] = useState(total.toString());
  const [creditDescription, setCreditDescription] = useState("");

  useEffect(() => {
    if (open) {
      setAmountPaid(total.toString());
      setCreditDescription("");
      setPaymentMethod('cash');
    }
  }, [open, total]);

  const amountPaidNum = parseFloat(amountPaid) || 0;
  const change = Math.max(0, amountPaidNum - total);
  const isCredit = paymentMethod === 'credit';
  const creditMissing = isCredit && creditDescription.trim() === '';

  const handleConfirm = () => {
    if (isCredit || amountPaidNum >= total) {
      onConfirmPayment(
        paymentMethod,
        isCredit ? 0 : amountPaidNum,
        isCredit ? creditDescription || undefined : undefined
      );
      // Reset form
      setAmountPaid(total.toString());
      setCreditDescription("");
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
          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card' | 'credit')}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>

              </SelectContent>
            </Select>
          </div>

          {/* Credit Description - Only show when Credit is selected */}
          {isCredit && (
            <div className="space-y-2">
              <Label htmlFor="creditDescription">Credit Description</Label>
              <Textarea
                id="creditDescription"
                placeholder="Enter credit details (e.g., customer account, due date, terms...)"
                value={creditDescription}
                onChange={(e) => setCreditDescription(e.target.value)}
                rows={3}
              />
              {creditMissing && (
                <p className="text-sm text-red-500">Credit note is required for credit payments</p>
              )}
            </div>
          )}

          {/* Total Amount */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount:</span>
              <span className="text-primary">Rs. {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Amount Paid - Hide for Credit */}
          {!isCredit && (
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
          )}

          {/* Quick Amount Buttons */}
          {paymentMethod === 'cash' && (
            <div className="space-y-2">
              <Label>Quick Amount</Label>
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 2000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant={amountPaid === amount.toString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickAmount(amount)}
                    disabled={amount < total}
                  >
                    Rs. {amount}
                  </Button>
                ))}
                <Button
                  variant={amountPaid === total.toString() ? "default" : "outline"}
                  className={amountPaid === total.toString() ? "bg-green-600 hover:bg-green-700" : ""}
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
          {!isCredit && amountPaidNum < total && (
            <p className="text-sm text-red-500">
              Amount paid must be at least Rs. {total.toFixed(2)}
            </p>
          )}

          {/* Credit Info Message */}
          {isCredit && (
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Credit Sale:</strong> This transaction will be recorded as credit.
                No payment is required at this time.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPrinting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={(!isCredit && amountPaidNum < total) || creditMissing || isPrinting}
            aria-disabled={(!isCredit && amountPaidNum < total) || creditMissing || isPrinting}
          >
            {isPrinting ? "Printing..." : (isCredit ? "Confirm Credit Sale" : "Confirm & Print Bill")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
