import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus, AlertTriangle, Wine, UtensilsCrossed } from "lucide-react";
import { BillItem, StockWarning } from "@/types/pos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteButton } from "@/components/common";
import { Badge } from "@/components/ui/badge";

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
      <CardHeader className="p-3 md:p-6">
        <CardTitle className="flex justify-between items-center text-base md:text-lg">
          <span>Current Bill</span>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearBill} className="text-xs md:text-sm h-7 md:h-9">
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-3 md:p-6 pt-0">
        {/* Stock Warnings */}
        {stockWarnings.length > 0 && (
          <Alert variant="destructive" className="mb-3 md:mb-4">
            <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
            <AlertDescription className="text-xs md:text-sm">
              <strong>Low Stock Warning:</strong>
              <ul className="mt-1 md:mt-2 space-y-0.5 md:space-y-1">
                {stockWarnings.map((warning, index) => (
                  <li key={index} className="text-xs md:text-sm">
                    {warning.product.name}: Only {warning.currentStock} units
                    available (Min: {warning.minStock})
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Bill Items */}
        <div className="flex-1 overflow-y-auto space-y-1.5 md:space-y-2 mb-3 md:mb-4 pr-1">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-6 md:py-8 text-xs md:text-sm">
              No items added yet
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="border rounded-lg p-2 md:p-3 space-y-1.5 md:space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                      <h4 className="font-medium text-xs md:text-sm">{item.product.name}</h4>
                      {item.product.source && (
                        <Badge
                          variant={item.product.source === 'bar' ? 'default' : 'secondary'}
                          className="text-[10px] md:text-xs px-1 md:px-1.5 py-0 md:py-0.5 h-4 md:h-5"
                        >
                          {item.product.source === 'bar' ? (
                            <><Wine className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" /> Bar</>
                          ) : (
                            <><UtensilsCrossed className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" /> Restaurant</>
                          )}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      Rs. {item.product.price.toFixed(2)} each
                    </p>
                  </div>
                  <DeleteButton
                    onDelete={() => onRemoveItem(item.product.id)}
                    itemName={item.product.name}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onUpdateQuantity(item.product.id, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                      className="h-6 w-6 md:h-7 md:w-7 p-0"
                    >
                      <Minus className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    </Button>
                    <span className="w-8 md:w-12 text-center font-medium text-xs md:text-sm">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onUpdateQuantity(item.product.id, item.quantity + 1)
                      }
                      disabled={item.product.source === 'bar' && item.quantity >= item.product.stock}
                      className="h-6 w-6 md:h-7 md:w-7 p-0"
                    >
                      <Plus className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    </Button>
                  </div>
                  <span className="font-bold text-xs md:text-sm">
                    Rs. {item.subtotal.toFixed(2)}
                  </span>
                </div>

                {item.product.source === 'bar' && item.quantity >= item.product.stock && (
                  <p className="text-[10px] md:text-xs text-red-500">Max stock reached</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Calculation Section */}
        {items.length > 0 && (
          <div className="space-y-2.5 md:space-y-4 border-t pt-3 md:pt-4">
            {/* Tax Rate */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <Label htmlFor="taxRate" className="text-xs md:text-sm w-16 md:w-20">
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
                className="w-16 md:w-20 text-xs md:text-sm h-7 md:h-9"
              />
              <span className="text-xs md:text-sm text-muted-foreground flex-1 text-right">
                Rs. {tax.toFixed(2)}
              </span>
            </div>

            {/* Discount Rate */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <Label htmlFor="discountRate" className="text-xs md:text-sm w-16 md:w-20">
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
                className="w-16 md:w-20 text-xs md:text-sm h-7 md:h-9"
              />
              <span className="text-xs md:text-sm text-muted-foreground flex-1 text-right">
                Rs. {discount.toFixed(2)}
              </span>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-1.5 md:space-y-2">
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-muted-foreground">Tax:</span>
                <span>Rs. {tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-muted-foreground">Discount:</span>
                <span className="text-green-600">- Rs. {discount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base md:text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">Rs. {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Complete Bill Button */}
            <Button
              className="w-full text-xs md:text-sm h-9 md:h-10"
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
