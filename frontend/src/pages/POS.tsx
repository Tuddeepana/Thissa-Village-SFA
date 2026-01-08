import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { BillCart } from "@/components/pos/BillCart";
import { PaymentDialog } from "@/components/pos/PaymentDialog";
import api from "@/api/client";
import { Product, BillItem, Bill, StockWarning } from "@/types/pos";
import { printBillNewWindow } from "@/lib/billPrinter";
import { toast } from "sonner";
import type { MyStockResponse, MyStockTableRow } from '@/types/mystock';
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 50;

const POS = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [taxRate, setTaxRate] = useState(15); // 15% default tax
  const [discountRate, setDiscountRate] = useState(0);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Fetch products from /api/mystock and map to POS Product shape
  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await api.get<MyStockResponse>('/mystock', { params: { page, pageSize: PAGE_SIZE } });
        if (cancelled) return;
        const rows: MyStockTableRow[] = res.data.tableResponse?.data ?? [];
        const mapped: Product[] = rows.map((r) => ({
          id: r.productId,
          name: r.productName,
          category: r.category?.name ?? '',
          // Use sellingPrice returned by mystock if present (fallback to 0)
          price: r.sellingPrice ?? 0,
          cost: r.sellingPrice ?? 0,
          stock: r.availableQuantity,
          minStock: r.minStock ?? 0,
          bottleVolume: r.bottle_size ?? undefined,
          barcode: undefined,
          image: undefined,
          description: undefined,
          createdAt: r.lastUpdatedAt ? new Date(r.lastUpdatedAt) : new Date(),
          updatedAt: r.lastUpdatedAt ? new Date(r.lastUpdatedAt) : new Date(),
        }));
        setProducts(mapped);
        const pagination = res.data.tableResponse?.pagination;
        setTotalPages(pagination?.totalPages ?? 1);
      } catch (err) {
        console.error('Failed to load products for POS', err);
        toast.error('Failed to load products');
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };
    fetchProducts();
    return () => { cancelled = true; };
  }, [page]);

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
    for (const item of billItems) {
      if (item.product.stock <= item.product.minStock) {
        warnings.push({
          product: item.product,
          currentStock: item.product.stock,
          minStock: item.product.minStock,
          requestedQuantity: item.quantity,
        });
      }
    }
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
  }, [stockWarnings]);

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
    paymentMethod: 'cash' | 'card' | 'credit' | 'other',
    amountPaid: number,
    customerName?: string,
    customerPhone?: string,
    creditDescription?: string
  ) => {
    const now = new Date();
    const change = paymentMethod === 'credit' ? 0 : amountPaid - total;
    const billNumber = `B-${Date.now()}`; // simple unique bill number
    const cashierName = (() => {
      try {
        const raw = localStorage.getItem('authUser');
        if (!raw) return 'Cashier';
        const user = JSON.parse(raw);
        return user?.name ?? 'Cashier';
      } catch {
        return 'Cashier';
      }
    })();

    // Build payload for backend as per API contract
    const payload = {
      bill_number: billNumber,
      date: now.toISOString(),
      payment_method: paymentMethod.toUpperCase(),
      customer_name: customerName ?? null,
      total: Number(total.toFixed(2)),
      cashier_name: cashierName,
      item_count: billItems.length,
      credit_note: creditDescription ?? null,
      cash_given: Number(amountPaid.toFixed(2)),
      balance_given: Number(change.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      items: billItems.map((bi) => ({
        productId: bi.product.id,
        quantityMoved: bi.quantity,
      })),
    };

    // Call backend to persist bill and create inventory movements
    api
      .post('/bills', payload)
      .then((res) => {
        // Update stock levels locally (reflect subtraction)
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

        // Prepare printable bill object
        const bill: Bill = {
          id: billNumber,
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
          change,
          creditDescription,
          createdAt: now,
        };
        printBillNewWindow(bill);

        // Clear bill & close dialog
        setBillItems([]);
        setDiscountRate(0);
        setIsPaymentDialogOpen(false);

        toast.success('Bill completed successfully!', {
          description: `Bill #${billNumber} - Total: Rs. ${total.toFixed(2)}`,
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
                .join(', '),
            });
          }
        }, 1000);
      })
      .catch((err) => {
        console.error('Failed to complete bill', err);
        const msg = err?.response?.data?.message ?? 'Failed to complete bill';
        toast.error(msg);
      });
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
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">Showing page {page} of {totalPages}</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              </div>
              <ProductSearch products={products} onAddProduct={handleAddProduct} />
              {loadingProducts && <p className="text-xs text-muted-foreground mt-2">Loading products...</p>}
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
