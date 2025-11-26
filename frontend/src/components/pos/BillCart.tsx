import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus, Trash2, AlertTriangle } from "lucide-react";
import { BillItem, StockWarning } from "@/types/pos";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BillCartProps {
  items: BillItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  discountRate: number;
  total: number;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateTaxRate: (rate: number) => void;
  onUpdateDiscountRate: (rate: number) => void;
  onClearBill: () => void;
  onCompleteBill: () => void;
  stockWarnings: StockWarning[];
}

export function BillCart({
  items,
  subtotal,
  tax,
  taxRate,
  discount,
  discountRate,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateTaxRate,
  onUpdateDiscountRate,
  onClearBill,
  onCompleteBill,
  stockWarnings,
}: BillCartProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Current Bill</span>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearBill}>
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Stock Warnings */}
        {stockWarnings.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Low Stock Warning:</strong>
              <ul className="mt-2 space-y-1">
                {stockWarnings.map((warning, index) => (
                  <li key={index} className="text-sm">
                    {warning.product.name}: Only {warning.currentStock} units
                    available (Min: {warning.minStock})
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Bill Items */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No items added yet
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.product.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Rs. {item.product.price.toFixed(2)} each
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.product.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onUpdateQuantity(item.product.id, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-12 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onUpdateQuantity(item.product.id, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.product.stock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="font-bold">
                    Rs. {item.subtotal.toFixed(2)}
                  </span>
                </div>

                {item.quantity >= item.product.stock && (
                  <p className="text-xs text-red-500">Max stock reached</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Calculation Section */}
        {items.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            {/* Tax Rate */}
            <div className="flex items-center gap-2">
              <Label htmlFor="taxRate" className="text-sm w-20">
                Tax %:
              </Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxRate}
                onChange={(e) =>
                  onUpdateTaxRate(parseFloat(e.target.value) || 0)
                }
                className="w-20"
              />
              <span className="text-sm text-muted-foreground flex-1 text-right">
                Rs. {tax.toFixed(2)}
              </span>
            </div>

            {/* Discount Rate */}
            <div className="flex items-center gap-2">
              <Label htmlFor="discountRate" className="text-sm w-20">
                Discount %:
              </Label>
              <Input
                id="discountRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={discountRate}
                onChange={(e) =>
                  onUpdateDiscountRate(parseFloat(e.target.value) || 0)
                }
                className="w-20"
              />
              <span className="text-sm text-muted-foreground flex-1 text-right">
                Rs. {discount.toFixed(2)}
              </span>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax:</span>
                <span>Rs. {tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount:</span>
                <span className="text-green-600">- Rs. {discount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">Rs. {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Complete Bill Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={onCompleteBill}
              disabled={items.length === 0}
            >
              Complete Bill
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
