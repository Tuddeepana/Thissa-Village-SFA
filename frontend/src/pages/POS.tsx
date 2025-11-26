import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { BillCart } from "@/components/pos/BillCart";
import { PaymentDialog } from "@/components/pos/PaymentDialog";
import { mockProducts } from "@/lib/productData";
import { Product, BillItem, Bill, StockWarning } from "@/types/pos";
import { printBillNewWindow } from "@/lib/billPrinter";
import { toast } from "sonner";

const POS = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [taxRate, setTaxRate] = useState(15); // 15% default tax
  const [discountRate, setDiscountRate] = useState(0);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Calculate totals
  const subtotal = useMemo(() => {
    return billItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [billItems]);

  const tax = useMemo(() => {
    return (subtotal * taxRate) / 100;
  }, [subtotal, taxRate]);

  const discount = useMemo(() => {
    return (subtotal * discountRate) / 100;
  }, [subtotal, discountRate]);

  const total = useMemo(() => {
    return subtotal + tax - discount;
  }, [subtotal, tax, discount]);

  // Check for stock warnings
  const stockWarnings = useMemo(() => {
    const warnings: StockWarning[] = [];
    billItems.forEach((item) => {
      if (item.product.stock <= item.product.minStock) {
        warnings.push({
          product: item.product,
          currentStock: item.product.stock,
          minStock: item.product.minStock,
          requestedQuantity: item.quantity,
        });
      }
    });
    return warnings;
  }, [billItems]);

  // Show low stock warning on mount
  useEffect(() => {
    if (stockWarnings.length > 0) {
      toast.warning(`${stockWarnings.length} item(s) have low stock!`, {
        description: stockWarnings
          .map((w) => `${w.product.name}: ${w.currentStock} units`)
          .join(", "),
      });
    }
  }, [stockWarnings.length]);

  const handleAddProduct = (product: Product) => {
    if (product.stock === 0) {
      toast.error("Product is out of stock!");
      return;
    }

    const existingItem = billItems.find((item) => item.product.id === product.id);

    if (existingItem) {
      // Check if we can add more
      if (existingItem.quantity >= product.stock) {
        toast.error("Cannot add more than available stock!");
        return;
      }
      handleUpdateQuantity(product.id, existingItem.quantity + 1);
    } else {
      // Add new item
      const newItem: BillItem = {
        product,
        quantity: 1,
        subtotal: product.price,
      };
      setBillItems([...billItems, newItem]);
      toast.success(`${product.name} added to bill`);
    }
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const item = billItems.find((item) => item.product.id === productId);
    if (!item) return;

    if (newQuantity > item.product.stock) {
      toast.error("Cannot exceed available stock!");
      return;
    }

    setBillItems(
      billItems.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: item.product.price * newQuantity,
            }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setBillItems(billItems.filter((item) => item.product.id !== productId));
    toast.info("Item removed from bill");
  };

  const handleClearBill = () => {
    if (billItems.length === 0) return;
    setBillItems([]);
    setDiscountRate(0);
    toast.info("Bill cleared");
  };

  const handleCompleteBill = () => {
    if (billItems.length === 0) {
      toast.error("Add items to the bill first!");
      return;
    }
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmPayment = (
    paymentMethod: 'cash' | 'card' | 'other',
    amountPaid: number,
    customerName?: string,
    customerPhone?: string
  ) => {
    // Generate bill ID
    const billId = `BILL-${Date.now()}`;
    const now = new Date();

    const bill: Bill = {
      id: billId,
      items: billItems,
      subtotal,
      tax,
      taxRate,
      discount,
      discountRate,
      total,
      customerName,
      customerPhone,
      paymentMethod,
      amountPaid,
      change: amountPaid - total,
      createdAt: now,
    };

    // Update stock levels (auto-reduce stock)
    const updatedProducts = products.map((product) => {
      const billItem = billItems.find((item) => item.product.id === product.id);
      if (billItem) {
        const newStock = product.stock - billItem.quantity;
        return {
          ...product,
          stock: newStock,
          updatedAt: now,
        };
      }
      return product;
    });

    setProducts(updatedProducts);

    // Print bill
    printBillNewWindow(bill);

    // Clear bill
    setBillItems([]);
    setDiscountRate(0);
    setIsPaymentDialogOpen(false);

    // Show success message
    toast.success("Bill completed successfully!", {
      description: `Bill #${billId} - Total: Rs. ${total.toFixed(2)}`,
    });

    // Show low stock warnings after completing bill
    setTimeout(() => {
      const lowStockProducts = updatedProducts.filter(
        (p) => p.stock > 0 && p.stock <= p.minStock
      );
      if (lowStockProducts.length > 0) {
        toast.warning(`${lowStockProducts.length} product(s) are now low in stock!`, {
          description: lowStockProducts
            .slice(0, 3)
            .map((p) => `${p.name}: ${p.stock} units`)
            .join(", "),
        });
      }
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">POS System</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Fast and efficient point of sale
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product Search - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <ProductSearch products={products} onAddProduct={handleAddProduct} />
            </CardContent>
          </Card>
        </div>

        {/* Bill Cart - Takes 1 column on large screens */}
        <div className="lg:col-span-1">
          <BillCart
            items={billItems}
            subtotal={subtotal}
            tax={tax}
            taxRate={taxRate}
            discount={discount}
            discountRate={discountRate}
            total={total}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onUpdateTaxRate={setTaxRate}
            onUpdateDiscountRate={setDiscountRate}
            onClearBill={handleClearBill}
            onCompleteBill={handleCompleteBill}
            stockWarnings={stockWarnings}
          />
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        total={total}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
};

export default POS;
