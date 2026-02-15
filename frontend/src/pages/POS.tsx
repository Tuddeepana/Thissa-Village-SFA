import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { BillCart } from "@/components/pos/BillCart";
import { PaymentDialog } from "@/components/pos/PaymentDialog";
import api from "@/api/client";
import restaurantApi from "@/api/restaurantClient";
import { Product, BillItem, Bill, StockWarning } from "@/types/pos";
import { printBillNewWindow } from "@/lib/billPrinter";
import { toast } from "sonner";
import type { MyStockResponse, MyStockTableRow } from '@/types/mystock';
import type { RestaurantItemsResponse, RestaurantItem } from '@/types/restaurant';
import { Button } from "@/components/ui/button";
import LocalLoader from "@/components/common/LocalLoader";
import { Keyboard, Wine, UtensilsCrossed } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PAGE_SIZE = 50;

const POS = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [restaurantProducts, setRestaurantProducts] = useState<Product[]>([]);
  const [itemSource, setItemSource] = useState<'bar' | 'restaurant'>('bar');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [taxRate, setTaxRate] = useState(0);
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
        if (itemSource === 'bar') {
          const res = await api.get<MyStockResponse>('/mystock', {
            params: { page, pageSize: PAGE_SIZE },
            meta: { showLoader: 'local', loaderKey: 'pos-products' }
          });
          if (cancelled) return;
          const rows: MyStockTableRow[] = res.data.tableResponse?.data ?? [];
          const mapped: Product[] = rows.map((r) => ({
            id: r.productId,
            name: r.productName,
            category: r.category?.name ?? '',
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
            source: 'bar',
          }));
          setProducts(mapped);
          const pagination = res.data.tableResponse?.pagination;
          setTotalPages(pagination?.totalPages ?? 1);
        } else {
          // Fetch restaurant items
          const res = await restaurantApi.get<RestaurantItemsResponse>('/items', {
            params: { page, pageSize: PAGE_SIZE },
            meta: { showLoader: 'local', loaderKey: 'pos-products' }
          });
          if (cancelled) return;
          const items: RestaurantItem[] = res.data.items ?? [];
          const mapped: Product[] = items.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            price: item.price,
            cost: item.price,
            stock: item.available ? 999 : 0, // Restaurant items don't have stock tracking
            minStock: 0,
            bottleVolume: undefined,
            barcode: undefined,
            image: item.image,
            description: item.description,
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'restaurant',
          }));
          setRestaurantProducts(mapped);
          const pagination = res.data.pagination;
          setTotalPages(pagination?.totalPages ?? 1);
        }
      } catch (err) {
        console.error('Failed to load products for POS', err);
        toast.error(`Failed to load ${itemSource} items`);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };
    fetchProducts();
    return () => { cancelled = true; };
  }, [page, itemSource]);

  // Get the current list of products to display based on item source
  const displayProducts = useMemo(() => {
    return itemSource === 'bar' ? products : restaurantProducts;
  }, [itemSource, products, restaurantProducts]);

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

  // Handler functions
  const handleCompleteBill = useCallback(() => {
    if (billItems.length === 0) {
      toast.error("Add items to the bill first!");
      return;
    }
    setIsPaymentDialogOpen(true);
  }, [billItems.length]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or select
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' ||
                          target.tagName === 'TEXTAREA' ||
                          target.tagName === 'SELECT' ||
                          target.isContentEditable;

      // Allow shortcuts only if not in payment dialog and not typing in input fields
      if (isPaymentDialogOpen || isInputField) return;

      const key = e.key.toLowerCase();

      switch (key) {
        case 'b':
          // Navigate to Bills page
          e.preventDefault();
          navigate('/bills');
          toast.info('Navigating to Bills page...');
          break;

        case 's':
          // Focus on search bar
          e.preventDefault();
          searchInputRef.current?.focus();
          toast.info('Search bar focused');
          break;

        case 't':
          // Toggle tax (cycle through 0%, 5%, 10%, 15%)
          e.preventDefault();
          setTaxRate((prev) => {
            const rates = [0, 5, 10, 15];
            const currentIndex = rates.indexOf(prev);
            const nextIndex = (currentIndex + 1) % rates.length;
            const newRate = rates[nextIndex];
            toast.info(`Tax rate set to ${newRate}%`);
            return newRate;
          });
          break;

        case 'c':
          // Complete bill (open payment dialog)
          e.preventDefault();
          handleCompleteBill();
          break;

        case 'm':
          // Open payment dialog for payment method selection
          e.preventDefault();
          if (billItems.length > 0) {
            setIsPaymentDialogOpen(true);
            toast.info('Payment dialog opened');
          } else {
            toast.error('Add items to the bill first!');
          }
          break;

        case 'r':
        case 'w':
          // Toggle between bar and restaurant items
          e.preventDefault();
          setItemSource((prev) => {
            const newSource = prev === 'bar' ? 'restaurant' : 'bar';
            setPage(1); // Reset to first page
            toast.success(`Switched to ${newSource === 'bar' ? '🍷 Bar' : '🍴 Restaurant'} items`, {
              description: `Now viewing ${newSource} products`
            });
            return newSource;
          });
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate, isPaymentDialogOpen, billItems.length, handleCompleteBill]);

  const handleAddProduct = (product: Product) => {
    // Restaurant items don't have stock checking
    if (product.source === 'bar' && product.stock === 0) {
      toast.error("Product is out of stock!");
      return;
    }

    const existingItem = billItems.find((item) => item.product.id === product.id);

    if (existingItem) {
      // Check if we can add more (only for bar items)
      if (product.source === 'bar' && existingItem.quantity >= product.stock) {
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

    // Only check stock for bar items
    if (item.product.source === 'bar' && newQuantity > item.product.stock) {
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

    // Separate bar and restaurant items
    const barItems = billItems.filter(item => item.product.source === 'bar');
    // Restaurant items are handled separately - no backend call needed for them

    // Build payload for backend - only bar items go to our backend
    if (barItems.length > 0) {
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
        items: barItems.map((bi) => ({
          productId: bi.product.id,
          quantityMoved: bi.quantity,
        })),
      };

      // Call backend to persist bill and create inventory movements
      api
        .post('/bills', payload)
        .then(() => {
          // Update stock levels locally for bar items only
          const updatedProducts = products.map((product) => {
            const billItem = barItems.find((item) => item.product.id === product.id);
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

          completeBillProcess(billNumber, now, paymentMethod, amountPaid, change, customerName, customerPhone, creditDescription, updatedProducts);
        })
        .catch((err) => {
          console.error('Failed to complete bill', err);
          const msg = err?.response?.data?.message ?? 'Failed to complete bill';
          toast.error(msg);
        });
    } else {
      // Only restaurant items, no backend call needed for bar system
      completeBillProcess(billNumber, now, paymentMethod, amountPaid, change, customerName, customerPhone, creditDescription, products);
    }
  };

  const completeBillProcess = (
    billNumber: string,
    now: Date,
    paymentMethod: 'cash' | 'card' | 'credit' | 'other',
    amountPaid: number,
    change: number,
    customerName?: string,
    customerPhone?: string,
    creditDescription?: string,
    updatedProducts?: Product[]
  ) => {
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

    // Show low stock warnings after completing bill (only for bar items)
    if (updatedProducts) {
      setTimeout(() => {
        const lowStockProducts = updatedProducts.filter(
          (p) => p.stock > 0 && p.stock <= p.minStock && p.source === 'bar'
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
    }
  };

  return (
    <div className="space-y-2 md:space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">POS System</h1>
          <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
            Fast and efficient point of sale
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs md:text-sm">
              <Keyboard className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Shortcuts
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
              <DialogDescription>
                Use these keyboard shortcuts to navigate and work faster in the POS system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                <Badge variant="secondary" className="justify-center text-lg font-mono">B</Badge>
                <p className="text-sm">Navigate to <strong>Bills</strong> page</p>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                <Badge variant="secondary" className="justify-center text-lg font-mono">S</Badge>
                <p className="text-sm">Focus on <strong>Search</strong> bar</p>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                <Badge variant="secondary" className="justify-center text-lg font-mono">↑ ↓ ← →</Badge>
                <p className="text-sm">Navigate through <strong>products</strong> in all directions (2D grid navigation)</p>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                <Badge variant="secondary" className="justify-center text-lg font-mono">Enter</Badge>
                <p className="text-sm">Add selected <strong>product to cart</strong> (when product is highlighted)</p>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                <Badge variant="secondary" className="justify-center text-lg font-mono">T</Badge>
                <p className="text-sm">Toggle <strong>Tax</strong> rate (cycles: 0%, 5%, 10%, 15%)</p>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                <Badge variant="secondary" className="justify-center text-lg font-mono">C</Badge>
                <p className="text-sm"><strong>Complete</strong> bill (open payment dialog)</p>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                <Badge variant="secondary" className="justify-center text-lg font-mono">M</Badge>
                <p className="text-sm">Open payment <strong>Method</strong> selection dialog</p>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                <div className="flex gap-1">
                  <Badge variant="secondary" className="justify-center text-lg font-mono flex-1">R</Badge>
                  <Badge variant="secondary" className="justify-center text-lg font-mono flex-1">W</Badge>
                </div>
                <p className="text-sm">S<strong>w</strong>itch between <strong>Restaurant</strong> and Bar items</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p>💡 Tip: Use arrow keys (↑↓←→) after focusing search bar (press S) to navigate products like a 2D grid. Press Enter to add highlighted product to cart.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for switching between Bar and Restaurant items */}
      <Card>
        <CardContent className="p-2 md:p-4">
          <Tabs value={itemSource} onValueChange={(value) => {
            setItemSource(value as 'bar' | 'restaurant');
            setPage(1); // Reset to first page when switching
          }}>
            <TabsList className="grid w-full max-w-md grid-cols-2 h-8 md:h-10">
              <TabsTrigger value="bar" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <Wine className="h-3 w-3 md:h-4 md:w-4" />
                Bar Items
              </TabsTrigger>
              <TabsTrigger value="restaurant" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <UtensilsCrossed className="h-3 w-3 md:h-4 md:w-4" />
                Restaurant Items
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4">
        {/* Product Search - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="text-xs md:text-sm text-muted-foreground">
                  Showing {itemSource === 'bar' ? 'Bar' : 'Restaurant'} items - Page {page} of {totalPages}
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs md:text-sm h-7 md:h-9 px-2 md:px-4">Prev</Button>
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-xs md:text-sm h-7 md:h-9 px-2 md:px-4">Next</Button>
                </div>
              </div>
              <LocalLoader loaderKey="pos-products">
                <ProductSearch ref={searchInputRef} products={displayProducts} onAddProduct={handleAddProduct} />
              </LocalLoader>
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
