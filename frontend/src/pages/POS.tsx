import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { PaymentDialog } from "@/components/pos/PaymentDialog";
import { RoomBookingDialog } from "@/components/pos/RoomBookingDialog";
import api from "@/api/client";
import { tableService } from "@/api/services/tableService";
import { orderService } from "@/api/services/orderService";
import { serviceChargeService } from "@/api/services/serviceChargeService";
import { Product, BillItem, Bill, StockWarning } from "@/types/pos";
import { OrderType } from "@/types/order.types";
import { printBillNewWindow } from "@/lib/billPrinter";
import { toast } from "sonner";
import type { MyStockResponse, MyStockTableRow } from "@/types/mystock";
import type { ExpandedTableItem } from "@/types/table.types";
import LocalLoader from "@/components/common/LocalLoader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Phone,
  UtensilsCrossed,
  Package,
  Hotel,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Send,
  Printer,
  AlertTriangle,
  Crown,
  Globe,
  Users,
} from "lucide-react";

const PAGE_SIZE = 50;

// Table status for dine-in
interface TableInfo {
  id: string;
  displayName: string;
  baseName: string;
  tableNumber: number;
  table_type: 'VIP' | 'NORMAL';
  status: "free" | "occupied";
  orderId?: string;
}

const POS = () => {
  const navigate = useNavigate();
  
  // Customer Info State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerType, setCustomerType] = useState<"local" | "foreigner">("local");
  const [orderType, setOrderType] = useState<"dine_in" | "take_away">("dine_in");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);

  // Products and Cart
  const [products, setProducts] = useState<Product[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);
  const [serviceCharge, setServiceCharge] = useState<{ percentage: number; isActive: boolean } | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isRoomBookingDialogOpen, setIsRoomBookingDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Get current user info
  const currentUser = {
    name: (() => {
      try {
        const raw = localStorage.getItem("authUser");
        if (!raw) return "Cashier";
        const user = JSON.parse(raw);
        return user?.name ?? "Cashier";
      } catch {
        return "Cashier";
      }
    })(),
    terminalId: "T-001", // Hardcoded terminal ID
  };

  // Function to refresh table status from server
  const refreshTableStatus = async () => {
    try {
      // Get table status which includes occupancy information
      const statusResponse = await orderService.getTableStatus({ status: 'all' });

      // Extract table info from status response
      const tableStatusMap = new Map(
        (statusResponse.tables || []).map((t: any) => [t.table_id, t.status])
      );

      // Also get the base table structure
      const baseResponse = await tableService.getExpanded();
      
      const expandedTables: ExpandedTableItem[] = baseResponse.tables || [];
      const mappedTables: TableInfo[] = expandedTables.map((t) => ({
        id: t.id,
        displayName: t.displayName,
        baseName: t.baseName,
        tableNumber: t.tableNumber,
        table_type: t.table_type,
        status: (tableStatusMap.get(t.id) === 'occupied' ? 'occupied' : 'free') as 'free' | 'occupied',
        orderId: undefined,
      }));
      setTables(mappedTables);
    } catch (err) {
      console.error("Failed to refresh tables", err);
    }
  };

  // Fetch tables from API
  useEffect(() => {
    let cancelled = false;
    const fetchTables = async () => {
      try {
        // Get table status which includes occupancy information
        const statusResponse = await orderService.getTableStatus({ status: 'all' });
        if (cancelled) return;

        // Extract table info from status response
        const tableStatusMap = new Map(
          (statusResponse.tables || []).map((t: any) => [t.table_id, t.status])
        );

        // Also get the base table structure
        const baseResponse = await tableService.getExpanded();
        if (cancelled) return;
        
        const expandedTables: ExpandedTableItem[] = baseResponse.tables || [];
        const mappedTables: TableInfo[] = expandedTables.map((t) => ({
          id: t.id,
          displayName: t.displayName,
          baseName: t.baseName,
          tableNumber: t.tableNumber,
          table_type: t.table_type,
          status: (tableStatusMap.get(t.id) === 'occupied' ? 'occupied' : 'free') as 'free' | 'occupied',
          orderId: undefined,
        }));
        setTables(mappedTables);
      } catch (err) {
        console.error("Failed to load tables", err);
        toast.error("Failed to load tables");
      }
    };
    fetchTables();
    
    // Set up interval to refresh table status every 30 seconds to catch status changes
    const interval = setInterval(fetchTables, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Fetch products from /api/mystock and map to POS Product shape
  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
  const res = await api.get<MyStockResponse>('/mystock', { params: { page, pageSize: PAGE_SIZE }, meta: { showLoader: 'local', loaderKey: 'pos-products' } });
        if (cancelled) return;
        const rows: MyStockTableRow[] = res.data.tableResponse?.data ?? [];
        const mapped: Product[] = rows.map((r) => ({
          id: r.productId,
          name: r.productName,
          category: r.category?.name ?? '',
          product_type: r.productType,
          unit: r.unitType ?? null,
          foreignerPrice: r.foreignerPrice ?? 0,
          localPrice: r.localPrice ?? 0,
          cost: r.foreignerPrice ?? 0, // Use foreigner price as default for cost calculation
          stock: r.availableQuantity,
          minStock: r.minStock ?? 0,
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

  // Fetch service charge config (SFA setting)
  useEffect(() => {
    let cancelled = false;
    const fetchServiceCharge = async () => {
      try {
        const sc = await serviceChargeService.get();
        if (cancelled) return;
        setServiceCharge({ percentage: Number(sc.percentage || 0), isActive: !!sc.isActive });
      } catch (err) {
        // Non-blocking: if not configured, treat as 0
        if (!cancelled) setServiceCharge(null);
      }
    };
    fetchServiceCharge();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const serviceChargeAmount = useMemo(() => {
    if (!serviceCharge?.isActive) return 0;
    const pct = Number(serviceCharge.percentage || 0);
    if (!pct) return 0;
    // Apply service charge on (subtotal - discount) (common approach)
    const base = Math.max(0, subtotal - discount);
    return (base * pct) / 100;
  }, [serviceCharge, subtotal, discount]);

  const total = useMemo(() => {
    return subtotal + tax + serviceChargeAmount - discount;
  }, [subtotal, tax, discount, serviceChargeAmount]);

  // Check for stock warnings (exclude HANDMADE products)
  const stockWarnings = useMemo(() => {
    const warnings: StockWarning[] = [];
    for (const item of billItems) {
      // Skip handmade products from stock warnings
      if (item.product.product_type === 'HANDMADE') continue;
      
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

  // Free tables for selection
  const freeTables = useMemo(() => {
    return tables.filter((t) => t.status === "free");
  }, [tables]);

  // Update cart prices when customer type changes
  useEffect(() => {
    if (billItems.length > 0) {
      setBillItems(prevItems =>
        prevItems.map(item => {
          const priceToUse = customerType === "local" ? item.product.localPrice : item.product.foreignerPrice;
          return {
            ...item,
            subtotal: priceToUse * item.quantity,
          };
        })
      );
    }
  }, [customerType]);

  const handleAddProduct = (product: Product) => {
    // Skip stock validation for HANDMADE products
    const isHandmade = product.product_type === 'HANDMADE';
    
    if (!isHandmade && product.stock === 0) {
      toast.error("Product is out of stock!");
      return;
    }

    const existingItem = billItems.find((item) => item.product.id === product.id);
    const priceToUse = customerType === "local" ? product.localPrice : product.foreignerPrice;

    if (existingItem) {
      // Check if we can add more (skip check for handmade products)
      if (!isHandmade && existingItem.quantity >= product.stock) {
        toast.error("Cannot add more than available stock!");
        return;
      }
      handleUpdateQuantity(product.id, existingItem.quantity + 1);
    } else {
      // Add new item with appropriate price
      const newItem: BillItem = {
        product,
        quantity: 1,
        subtotal: priceToUse,
      };
      setBillItems([...billItems, newItem]);
      toast.success(`${product.name} added to order`);
    }
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const item = billItems.find((item) => item.product.id === productId);
    if (!item) return;

    // Skip stock validation for HANDMADE products
    const isHandmade = item.product.product_type === 'HANDMADE';
    
    if (!isHandmade && newQuantity > item.product.stock) {
      toast.error("Cannot exceed available stock!");
      return;
    }

    const priceToUse = customerType === "local" ? item.product.localPrice : item.product.foreignerPrice;

    setBillItems(
      billItems.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: priceToUse * newQuantity,
            }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setBillItems(billItems.filter((item) => item.product.id !== productId));
    toast.info("Item removed from order");
  };

  const handleClearOrder = () => {
    setBillItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerType("local");
    setOrderType("dine_in");
    setSelectedTable(null);
    setDiscountRate(0);
    toast.info("Order cleared");
  };

  const validateOrder = () => {
    if (billItems.length === 0) {
      toast.error("Please add items to the order");
      return false;
    }
    if (orderType === "dine_in" && !selectedTable) {
      toast.error("Please select a table for dine-in order");
      return false;
    }
    return true;
  };

  const handleCreateOrder = async () => {
    if (!validateOrder()) return;

    try {
      // Get table info for dine-in
      const selectedTableInfo = orderType === "dine_in" 
        ? tables.find(t => t.id === selectedTable)
        : null;

      // Create order via API
      const order = await orderService.createOrder({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_type: customerType,
        order_type: orderType === "dine_in" ? OrderType.DINE_IN : OrderType.TAKE_AWAY,
        table_id: selectedTableInfo?.id ?? null,
        table_name: selectedTableInfo?.displayName ?? null,
        table_number: selectedTableInfo?.tableNumber ?? null,
        tax: taxRate,
        discount: discountRate,
        terminal_id: currentUser.terminalId,
        cashier_name: currentUser.name,
        items: billItems.map(item => ({
          productId: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: customerType === "local" ? item.product.localPrice : item.product.foreignerPrice,
        })),
      });

      // Mark table as occupied (local state only)
      if (orderType === "dine_in" && selectedTable && selectedTableInfo) {
        setTables(
          tables.map((t) =>
            t.id === selectedTable ? { ...t, status: "occupied" as const, orderId: order.order_number } : t
          )
        );

        toast.success(`Order ${order.order_number} created successfully!`, {
          description: `${selectedTableInfo.displayName} - ${customerName}. Sent to kitchen.`,
        });
      } else {
        toast.success(`Order ${order.order_number} created successfully!`, {
          description: `Take Away - ${customerName}. Sent to kitchen.`,
        });
      }

      // Refresh table status from server to ensure it's up-to-date
      setTimeout(() => {
        refreshTableStatus();
      }, 500);

      // Navigate to orders page
      navigate("/orders");

      // Clear the form
      handleClearOrder();
    } catch (error: any) {
      console.error('Failed to create order', error);
      const msg = error?.response?.data?.message ?? 'Failed to create order';
      toast.error(msg);
    }
  };

  const handleTakeAwayPayment = () => {
    if (!validateOrder()) return;
    setIsPaymentDialogOpen(true);
  };

  const handleDineInPayment = () => {
    if (!validateOrder()) return;
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmPayment = (
    paymentMethod: 'cash' | 'card' | 'credit' | 'other',
    amountPaid: number,
    creditDescription?: string
  ) => {
    const now = new Date();
    const change = paymentMethod === 'credit' ? 0 : amountPaid - total;
    // Bill number is generated by backend now (B-000000000001 style)
    const billNumber = '';

    // Build payload for backend as per API contract
    const payload = {
      date: now.toISOString(),
      payment_method: paymentMethod.toUpperCase(),
      customer_name: customerName,
      customer_type: customerType,
      service_charge_percentage: serviceCharge?.isActive ? Number(serviceCharge.percentage || 0) : 0,
      service_charge_amount: Number(serviceChargeAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
      cashier_name: currentUser.name,
      terminal_id: currentUser.terminalId,
      order_type: orderType,
      table_number: orderType === "dine_in" ? selectedTable : null,
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
        const createdBillNumber = res?.data?.data?.bill?.bill_number || res?.data?.data?.billNumber || res?.data?.data?.bill_number || billNumber;
        // Prepare printable bill object
        const bill: Bill = {
          id: createdBillNumber,
          items: billItems,
          subtotal,
          tax,
          taxRate,
          discount,
          discountRate,
          // @ts-ignore - optional extra fields used by printer/UI
          serviceCharge: serviceChargeAmount,
          // @ts-ignore
          serviceChargeRate: serviceCharge?.isActive ? Number(serviceCharge.percentage || 0) : 0,
          total,
          customerName: currentUser.name,  // Cashier name shown on receipt
          customerPhone,
          paymentMethod,
          amountPaid,
          change,
          creditDescription,
          createdAt: now,
        };
        printBillNewWindow(bill);

        // Clear order & close dialog
        handleClearOrder();
        setIsPaymentDialogOpen(false);

        toast.success('Bill completed successfully!', {
          description: `Bill #${createdBillNumber} - Total: Rs. ${total.toFixed(2)}`,
        });
      })
      .catch((err) => {
        console.error('Failed to complete bill', err);
        const msg = err?.response?.data?.message ?? 'Failed to complete bill';
        toast.error(msg);
      });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">POS System</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Terminal: {currentUser.terminalId} • Cashier: {currentUser.name}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-sm px-3 py-1 ${
            customerType === "local" 
              ? "bg-green-100 text-green-700 border-green-300" 
              : "bg-blue-100 text-blue-700 border-blue-300"
          }`}
        >
          {customerType === "local" ? (
            <><Users className="h-4 w-4 mr-1.5" /> Local Pricing</>
          ) : (
            <><Globe className="h-4 w-4 mr-1.5" /> Foreigner Pricing</>
          )}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Section - Order Type Selection & Products */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Type Selection Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Type & Table Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Customer Type Selection */}
              <div className="space-y-2">
                <Label>Customer Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={customerType === "local" ? "default" : "outline"}
                    className={customerType === "local" ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setCustomerType("local")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Local
                  </Button>
                  <Button
                    variant={customerType === "foreigner" ? "default" : "outline"}
                    className={customerType === "foreigner" ? "bg-blue-600 hover:bg-blue-700" : ""}
                    onClick={() => setCustomerType("foreigner")}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Foreigner
                  </Button>
                </div>
              </div>

              {/* Order Type Selection */}
              <div className="space-y-2">
                <Label>Order Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={orderType === "dine_in" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setOrderType("dine_in")}
                  >
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    Dine In
                  </Button>
                  <Button
                    variant={orderType === "take_away" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => {
                      setOrderType("take_away");
                      setSelectedTable(null);
                    }}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Take Away
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsRoomBookingDialogOpen(true)}
                  >
                    <Hotel className="h-4 w-4 mr-2" />
                    Room
                  </Button>
                </div>
              </div>

              {/* Table Selection (for Dine In) */}
              {orderType === "dine_in" && (
                <div className="space-y-2">
                  <Label>Select Table</Label>
                  {tables.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tables available. Please create tables in Table Management.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {tables.map((table) => (
                        <Button
                          key={table.id}
                          variant={selectedTable === table.id ? "default" : "outline"}
                          className={`h-20 ${
                            table.status === "occupied"
                              ? "opacity-50 cursor-not-allowed bg-red-50 border-red-200"
                              : selectedTable === table.id
                              ? table.table_type === "VIP" 
                                ? "bg-amber-600 hover:bg-amber-700"
                                : ""
                              : table.table_type === "VIP"
                              ? "hover:bg-amber-50 hover:border-amber-300 border-amber-200"
                              : "hover:bg-green-50 hover:border-green-200"
                          }`}
                          disabled={table.status === "occupied"}
                          onClick={() => setSelectedTable(table.id)}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm">{table.displayName}</div>
                            <div className="flex flex-col gap-1 mt-1">
                              {table.table_type === "VIP" && (
                                <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                                  <Crown className="h-3 w-3 mr-1" />
                                  VIP
                                </Badge>
                              )}
                              {table.status === "occupied" ? (
                                <Badge variant="destructive" className="text-xs">Occupied</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Free</Badge>
                              )}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">
                  Showing page {page} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
              <LocalLoader loaderKey="pos-products">
                <ProductSearch
                  products={products}
                  onAddProduct={handleAddProduct}
                  customerType={customerType}
                />
              </LocalLoader>
              {loadingProducts && (
                <p className="text-xs text-muted-foreground mt-2">Loading products...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Section - Order Cart */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Current Order
                </span>
                {billItems.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearOrder}>
                    Clear All
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-y-auto">
              {/* Customer Information */}
              <div className="space-y-3 border-b pb-4 mb-4">
                <h3 className="font-semibold text-sm">Customer Information</h3>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="customer-name" className="flex items-center gap-2 text-xs">
                      <User className="h-3 w-3" /> Name
                    </Label>
                    <Input
                      id="customer-name"
                      placeholder="Enter customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customer-phone" className="flex items-center gap-2 text-xs">
                      <Phone className="h-3 w-3" /> Phone
                    </Label>
                    <Input
                      id="customer-phone"
                      placeholder="Enter phone number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>

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
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Order Items */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-[300px]">
                {billItems.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No items added yet
                  </div>
                ) : (
                  billItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Rs. {(customerType === "local" ? item.product.localPrice : item.product.foreignerPrice).toFixed(2)} each
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.product.id)}
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
                              handleUpdateQuantity(item.product.id, item.quantity - 1)
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
                              handleUpdateQuantity(item.product.id, item.quantity + 1)
                            }
                            disabled={
                              item.product.product_type !== 'HANDMADE' && 
                              item.quantity >= item.product.stock
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-bold">Rs. {item.subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Calculation Section */}
              {billItems.length > 0 && (
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
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
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
                      onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
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
                    {serviceCharge?.isActive && serviceChargeAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Service Charge ({Number(serviceCharge.percentage || 0).toFixed(2)}%):
                        </span>
                        <span>Rs. {serviceChargeAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="text-green-600">- Rs. {discount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>Rs. {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    {orderType === "dine_in" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button className="w-full" size="lg" variant="outline" onClick={handleCreateOrder}>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                        <Button className="w-full" size="lg" onClick={handleDineInPayment}>
                          <Printer className="h-4 w-4 mr-2" />
                          Print & Pay
                        </Button>
                      </div>
                    ) : (
                      <Button className="w-full" size="lg" onClick={handleTakeAwayPayment}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print & Pay
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog for Take Away */}
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        total={total}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Room Booking Dialog */}
      <RoomBookingDialog
        open={isRoomBookingDialogOpen}
        onOpenChange={setIsRoomBookingDialogOpen}
        cashierName={currentUser.name}
        onBookingSuccess={() => {
          toast.success("Room booking completed successfully!");
        }}
      />
    </div>
  );
};

export default POS;
