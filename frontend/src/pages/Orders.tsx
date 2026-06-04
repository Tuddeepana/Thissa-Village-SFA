import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Plus,
  Printer,
  Eye,
  User,
  Phone,
  Clock,
  UtensilsCrossed,
  Package,
  CreditCard,
  Search,
  RefreshCw,
  Check,
  X,
  Trash2,
  Globe,
  Users,
} from "lucide-react";
import { formatSL, startOfDaySL, endOfDaySL } from "@/utils/dateUtils";
import { toast } from "sonner";
import { orderService } from "@/api/services/orderService";
import api from "@/api/client";
import { OrderStatus, OrderType } from "@/types/order.types";
import type { Order, OrderStatus as OrderStatusType } from "@/types/order.types";
import type { MyStockResponse, MyStockTableRow } from "@/types/mystock";
import { printBillNewWindow } from "@/lib/billPrinter";
import { printKotSlip } from "@/lib/kotPrinter";
import type { Bill } from "@/types/pos";
import { kotService } from "@/api/services/kotService";
import { PaymentDialog } from "@/components/pos/PaymentDialog";
import { serviceChargeService } from "@/api/services/serviceChargeService";
import type { ServiceCharge } from "@/types/service-charge";

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("all");
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>("all");
  const [todayOnly, setTodayOnly] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [kotRemark, setKotRemark] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSendingKot, setIsSendingKot] = useState(false);
  const [kotSentOrderItemIds, setKotSentOrderItemIds] = useState<Set<string>>(new Set());
  const [serviceCharge, setServiceCharge] = useState<ServiceCharge | null>(null);


  // Products for adding items
  const [products, setProducts] = useState<MyStockTableRow[]>([]);

  // Add item form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

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
    terminalId: "T-001",
  };

  // Fetch orders — always fetches ALL statuses so stat cards can compute
  // per-status counts+amounts that respect the current orderType/customerType/date filters.
  // Status filter is applied client-side in filteredOrders.
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const queryParams: any = {
        // No status filter — fetch all statuses so cards are accurate
        order_type: orderTypeFilter !== "all" ? (orderTypeFilter as OrderType) : undefined,
        customer_type: customerTypeFilter !== "all" ? (customerTypeFilter as 'local' | 'foreigner') : undefined,
        pageSize: 500,
      };

      if (todayOnly) {
        queryParams.date_from = startOfDaySL().toISOString();
        queryParams.date_to = endOfDaySL().toISOString();
      }

      const result = await orderService.listOrders(queryParams);
      setOrders(result.orders);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for adding items
  const fetchProducts = async () => {
    try {
      const res = await api.get<MyStockResponse>('/mystock', { params: { page: 1, pageSize: 100 } });
      setProducts(res.data.tableResponse?.data ?? []);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  // Fetch service charge config
  const fetchServiceCharge = async () => {
    try {
      const sc = await serviceChargeService.get();
      if (!sc) return;
      setServiceCharge(sc);
    } catch (err) {
      console.error("Failed to fetch service charge config", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchServiceCharge();
  // statusFilter intentionally excluded — it is applied client-side so no re-fetch needed
  }, [orderTypeFilter, customerTypeFilter, todayOnly]);

  // Filter orders: apply status filter client-side + search query
  const filteredOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_phone.includes(searchQuery);
      return matchesStatus && matchesSearch;
    });

    // Sort: PENDING status first, then by creation time (newest first)
    return filtered.sort((a, b) => {
      if (a.status === OrderStatus.PENDING && b.status !== OrderStatus.PENDING) return -1;
      if (a.status !== OrderStatus.PENDING && b.status === OrderStatus.PENDING) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders, searchQuery, statusFilter]);

  // Per-status stats derived from the full orders list (already filtered by orderType/customerType/date)
  const pendingStats = useMemo(() => {
    const list = orders.filter(o => o.status === OrderStatus.PENDING);
    return { count: list.length, amount: list.reduce((s, o) => s + o.total, 0) };
  }, [orders]);

  const completedStats = useMemo(() => {
    const list = orders.filter(o => o.status === OrderStatus.COMPLETED);
    return { count: list.length, amount: list.reduce((s, o) => s + o.total, 0) };
  }, [orders]);

  const cancelledStats = useMemo(() => {
    const list = orders.filter(o => o.status === OrderStatus.CANCELLED);
    return { count: list.length, amount: list.reduce((s, o) => s + o.total, 0) };
  }, [orders]);

  // Calculate service charge for selected order (for display in view dialog)
  const selectedOrderServiceCharge = useMemo(() => {
    if (!selectedOrder || selectedOrder.order_type !== "DINE_IN" || !serviceCharge?.isActive) {
      return 0;
    }
    const pct = Number(serviceCharge.percentage || 0);
    if (!pct) return 0;
    const base = Math.max(0, selectedOrder.subtotal - selectedOrder.discount);
    return (base * pct) / 100;
  }, [selectedOrder, serviceCharge]);

  // Calculate total with service charge for display
  const selectedOrderTotalWithServiceCharge = useMemo(() => {
    if (!selectedOrder) return 0;
    return selectedOrder.total + selectedOrderServiceCharge;
  }, [selectedOrder, selectedOrderServiceCharge]);

  const handleViewOrder = async (order: Order) => {
    // Open dialog immediately with loading state (same approach as Bills page)
    setIsLoadingOrder(true);
    setSelectedOrder(null);
    setIsViewDialogOpen(true);
    setKotSentOrderItemIds(new Set());
    try {
      // Fetch full order details
      const fullOrder = await orderService.getOrderById(order.id);
      setSelectedOrder(fullOrder);
    } catch (error) {
      console.error("Failed to fetch order details", error);
      toast.error("Failed to load order details");
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const handleAddItemToOrder = async () => {
    if (!selectedOrder || !selectedProductId || quantity < 1) return;

    const product = products.find((p) => p.productId === selectedProductId);
    if (!product) return;

    setIsAddingItem(true);
    try {
      // Get the price based on the order's customer type
      const customerType = selectedOrder.customer_type as "local" | "foreigner";
      const priceToUse = customerType === "local" ? (product.localPrice ?? 0) : (product.foreignerPrice ?? 0);

      const updatedOrder = await orderService.addItemsToOrder(selectedOrder.id, {
        items: [
          {
            productId: product.productId,
            product_name: product.productName,
            quantity,
            unit_price: priceToUse,
          },
        ],
      });

      setOrders(orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      setSelectedOrder(updatedOrder);
      setIsAddItemDialogOpen(false);
      setSelectedProductId("");
      setQuantity(1);
      toast.success(`Added ${product.productName} to order`);
    } catch (error: any) {
      console.error("Failed to add item", error);
      const msg = error?.response?.data?.message ?? "Failed to add item";
      toast.error(msg);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItemFromOrder = async (itemId: string) => {
    if (!selectedOrder) return;

    try {
      const updatedOrder = await orderService.deleteItemFromOrder(selectedOrder.id, itemId);
      setOrders(orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      setSelectedOrder(updatedOrder);
      toast.success("Item removed from order");
    } catch (error: any) {
      console.error("Failed to delete item", error);
      const msg = error?.response?.data?.message ?? "Failed to delete item";
      toast.error(msg);
    }
  };

  const hasUnsentOrderItems = useMemo(() => {
    if (!selectedOrder) return false;
    return selectedOrder.items.some(item => !item.kot_sent && !kotSentOrderItemIds.has(item.id));
  }, [selectedOrder, kotSentOrderItemIds]);

  const handleSendOrderKot = async () => {
    if (!selectedOrder) return;
    const unsentItems = selectedOrder.items.filter(item => !item.kot_sent && !kotSentOrderItemIds.has(item.id));
    if (unsentItems.length === 0) {
      toast.error("All items have already been sent to the kitchen");
      return;
    }

    try {
      setIsSendingKot(true);
      const stewardName = selectedOrder.steward_name || currentUser.name;
      const tableName = selectedOrder.table_name || "Take Away";
      const kotItems = unsentItems.map(item => {
        const matchingProduct = products.find(p => p.productId === item.productId);
        return {
          orderItemId: item.id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: matchingProduct?.unitType || undefined
        };
      });

      // First save KOT to backend to get the generated KOT ID
      const kotLogResponse = await kotService.createKotLog({
        orderId: selectedOrder.id,
        steward: stewardName,
        table_name: tableName,
        order_type: selectedOrder.order_type,
        total_amount: selectedOrder.total,
        remark: kotRemark || undefined,
        items: kotItems,
      });

      // Then print KOT slip with the generated ID
      await printKotSlip({
        kotId: kotLogResponse.kotLog?.kot_number || undefined,
        tableName,
        orderType: selectedOrder.order_type,
        stewardName,
        cashierName: currentUser.name,
        customerName: selectedOrder.customer_name || undefined,
        remark: kotRemark || undefined,
        items: kotItems,
      });

      setKotSentOrderItemIds(prev => {
        const newSet = new Set(prev);
        unsentItems.forEach(item => newSet.add(item.id));
        return newSet;
      });

      setKotRemark("");
      toast.success("KOT sent to kitchen successfully");
    } catch (err) {
      console.error("Failed to send KOT", err);
      toast.error("Failed to send KOT");
    } finally {
      setIsSendingKot(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatusType) => {
    if (newStatus === OrderStatus.CANCELLED) setIsCancellingOrder(true);
    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId, { status: newStatus });
      setOrders(orders.map((o) => (o.id === orderId ? updatedOrder : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error: any) {
      console.error("Failed to update status", error);
      const msg = error?.response?.data?.message ?? "Failed to update status";
      toast.error(msg);
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const handlePrintBill = async (order: Order) => {
    try {
      setIsPrinting(true);
      // Convert Order to Bill format for printing with new format (with image)
      const bill: Bill = {
        id: order.order_number,
        billNumber: order.order_number,
        items: order.items.map(item => {
          const matchingProduct = products.find(p => p.productId === item.productId);
          return {
            product: {
              id: item.id,
              name: item.product_name,
              category: '',
              product_type: undefined,
              unit: matchingProduct?.unitType ?? null,
              foreignerPrice: item.unit_price,
              localPrice: item.unit_price,
              cost: 0,
              stock: 0,
              minStock: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            quantity: item.quantity,
            subtotal: item.total,
          };
        }),
        subtotal: order.subtotal,
        tax: order.tax,
        taxRate: order.tax > 0 ? (order.tax / order.subtotal) * 100 : 0,
        discount: order.discount,
        discountRate: order.discount > 0 ? (order.discount / order.subtotal) * 100 : 0,
        serviceCharge: order.order_type === "DINE_IN" && serviceCharge?.isActive ? ((Math.max(0, order.subtotal - order.discount) * Number(serviceCharge.percentage || 0)) / 100) : 0,
        serviceChargeRate: order.order_type === "DINE_IN" && serviceCharge?.isActive ? Number(serviceCharge.percentage || 0) : 0,
        total: order.total + (order.order_type === "DINE_IN" && serviceCharge?.isActive ? ((Math.max(0, order.subtotal - order.discount) * Number(serviceCharge.percentage || 0)) / 100) : 0),
        customerName: order.customer_name || undefined,
        cashierName: order.cashier_name || currentUser.name,
        customerPhone: order.customer_phone,
        paymentMethod: 'cash',
        amountPaid: 0,
        change: 0,
        createdAt: new Date(order.createdAt),
      };

      // Use the new bill format (with image at top) same as POS "Print & Pay"
      await printBillNewWindow(bill);
      toast.success("Bill sent to printer");
    } catch (error) {
      console.error('Error printing bill:', error);
      toast.error("Failed to print bill");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleConfirmPayment = async (
    paymentMethod: 'cash' | 'card' | 'credit',
    amountPaid: number,
    creditDescription?: string
  ) => {
    if (!selectedOrder) return;

    const change = paymentMethod === "credit" ? 0 : amountPaid - selectedOrder.total;
    if (paymentMethod !== "credit" && change < 0) {
      toast.error("Amount paid is less than total!");
      return;
    }

    setIsPrinting(true);
    try {
      const now = new Date();

      // Calculate service charge only for DINE_IN orders, NOT for TAKE_AWAY
      let serviceChargePercentage = 0;
      let serviceChargeAmount = 0;
      if (selectedOrder.order_type === "DINE_IN" && serviceCharge?.isActive) {
        serviceChargePercentage = Number(serviceCharge.percentage || 0);
        // Apply service charge on (subtotal - discount) (common approach)
        const base = Math.max(0, selectedOrder.subtotal - selectedOrder.discount);
        serviceChargeAmount = (base * serviceChargePercentage) / 100;
      }

      // Calculate new total including service charge
      const totalWithServiceCharge = Number((selectedOrder.total + serviceChargeAmount).toFixed(2));

      // Calculate change with the updated total
      const changeWithServiceCharge = paymentMethod === "credit" ? 0 : amountPaid - totalWithServiceCharge;
      if (paymentMethod !== "credit" && changeWithServiceCharge < 0) {
        toast.error("Amount paid is less than total!");
        setIsPrinting(false);
        return;
      }

      // Build payload for backend — same approach as POS page
      const payload = {
        date: now.toISOString(),
        payment_method: paymentMethod.toUpperCase(),
        customer_name: selectedOrder.customer_name,
        customer_type: selectedOrder.customer_type,
        service_charge_percentage: serviceChargePercentage,
        service_charge_amount: Number(serviceChargeAmount.toFixed(2)),
        total: totalWithServiceCharge,
        cashier_name: currentUser.name,
        terminal_id: currentUser.terminalId,
        order_type: selectedOrder.order_type === "DINE_IN" ? "dine_in" : "take_away",
        table_number: selectedOrder.table_id ?? null,
        item_count: selectedOrder.items.length,
        credit_note: paymentMethod === 'credit' ? (creditDescription || null) : null,
        cash_given: paymentMethod === "credit" ? 0 : Number(amountPaid.toFixed(2)),
        balance_given: Number(changeWithServiceCharge.toFixed(2)),
        tax: Number(selectedOrder.tax.toFixed(2)),
        items: selectedOrder.items.map((item) => ({
          productId: item.productId,
          quantityMoved: item.quantity,
        })),
      };

      // Create bill via backend (persists bill + creates inventory movements)
      const res = await api.post('/bills', payload);
      const createdBillNumber =
        res?.data?.data?.bill?.bill_number ||
        res?.data?.data?.billNumber ||
        res?.data?.data?.bill_number ||
        selectedOrder.order_number;

      // Build printable bill object — same structure as POS page
      const bill: Bill = {
        id: createdBillNumber,
        items: selectedOrder.items.map((item) => {
          const matchingProduct = products.find(p => p.productId === item.productId);
          return {
            product: {
              id: item.productId,
              name: item.product_name,
              category: '',
              product_type: undefined,
              unit: matchingProduct?.unitType ?? null,
              foreignerPrice: item.unit_price,
              localPrice: item.unit_price,
              cost: 0,
              stock: 0,
              minStock: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            quantity: item.quantity,
            subtotal: item.total,
          };
        }),
        subtotal: selectedOrder.subtotal,
        tax: selectedOrder.tax,
        taxRate: selectedOrder.tax > 0 ? (selectedOrder.tax / selectedOrder.subtotal) * 100 : 0,
        discount: selectedOrder.discount,
        discountRate: selectedOrder.discount > 0 ? (selectedOrder.discount / selectedOrder.subtotal) * 100 : 0,
        serviceCharge: serviceChargeAmount,
        serviceChargeRate: serviceChargePercentage,
        total: totalWithServiceCharge,
        customerName: selectedOrder.customer_name || undefined,
        cashierName: selectedOrder.cashier_name || currentUser.name,
        customerPhone: selectedOrder.customer_phone,
        paymentMethod,
        amountPaid: paymentMethod === "credit" ? 0 : amountPaid,
        change: Math.max(0, changeWithServiceCharge),
        creditDescription: paymentMethod === 'credit' ? (creditDescription || null) : null,
        createdAt: now,
      };

      // Print bill using the same approach as POS page
      await printBillNewWindow(bill);

      // Update order status to completed
      await handleUpdateOrderStatus(selectedOrder.id, OrderStatus.COMPLETED);

      // Close dialogs and reset
      setIsPaymentDialogOpen(false);
      setIsViewDialogOpen(false);

      toast.success('Payment completed successfully!', {
        description: `Bill #${createdBillNumber} - Total: Rs. ${totalWithServiceCharge.toFixed(2)}`,
      });
    } catch (err: any) {
      console.error('Failed to complete payment', err);
      const msg = err?.response?.data?.message ?? 'Failed to complete payment';
      toast.error(msg);
    } finally {
      setIsPrinting(false);
    }
  };

  const getStatusBadge = (status: OrderStatusType) => {
    const styles: Record<OrderStatusType, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Orders</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage restaurant orders • Terminal: {currentUser.terminalId} • Cashier: {currentUser.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={`cursor-pointer transition-all ${statusFilter === "PENDING" ? "ring-2 ring-yellow-400" : ""}`} onClick={() => setStatusFilter(statusFilter === "PENDING" ? "all" : "PENDING")}>
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{pendingStats.count}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Rs. {pendingStats.amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${statusFilter === "COMPLETED" ? "ring-2 ring-green-400" : ""}`} onClick={() => setStatusFilter(statusFilter === "COMPLETED" ? "all" : "COMPLETED")}>
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{completedStats.count}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Rs. {completedStats.amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${statusFilter === "CANCELLED" ? "ring-2 ring-red-400" : ""}`} onClick={() => setStatusFilter(statusFilter === "CANCELLED" ? "all" : "CANCELLED")}>
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-sm font-medium text-red-600">Cancelled</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{cancelledStats.count}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Rs. {cancelledStats.amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number, customer name, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Order Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DINE_IN">Dine In</SelectItem>
                <SelectItem value="TAKE_AWAY">Take Away</SelectItem>
              </SelectContent>
            </Select>
            <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="foreigner">Foreigner</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm font-medium whitespace-nowrap cursor-pointer">
              <input
                type="checkbox"
                checked={todayOnly}
                onChange={(e) => setTodayOnly(e.target.checked)}
                className="rounded border-gray-300 w-4 h-4 cursor-pointer"
              />
              Today
            </label>
            <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("PENDING"); setOrderTypeFilter("all"); setCustomerTypeFilter("all"); setTodayOnly(true); fetchOrders(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Active Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Customer Type</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customer_name}</div>
                            <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={order.customer_type === "foreigner"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-green-50 text-green-700 border-green-200"
                            }
                          >
                            {order.customer_type === "foreigner" ? (
                              <><Globe className="h-3 w-3 mr-1" /> Foreigner</>
                            ) : (
                              <><Users className="h-3 w-3 mr-1" /> Local</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {order.order_type === "DINE_IN" ? (
                              <><UtensilsCrossed className="h-3 w-3 mr-1" /> Dine In</>
                            ) : (
                              <><Package className="h-3 w-3 mr-1" /> Take Away</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.table_name ? order.table_name : order.order_type === "DINE_IN" ? "Table -" : "-"}
                        </TableCell>
                        <TableCell>{order.items.length} items</TableCell>
                        <TableCell className="font-medium">Rs.{order.total.toFixed(0)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                                        {formatSL(new Date(order.createdAt), "HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePrintBill(order)}
                              disabled={isPrinting}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Order Details{selectedOrder ? ` - ${selectedOrder.order_number}` : ''}
            </DialogTitle>
            <DialogDescription>
              View and manage order details
            </DialogDescription>
          </DialogHeader>

          {isLoadingOrder && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <p className="text-sm">Loading order details...</p>
            </div>
          )}

          {!isLoadingOrder && selectedOrder && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedOrder.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedOrder.customer_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedOrder.order_type === "DINE_IN" ? (
                    <><UtensilsCrossed className="h-4 w-4 text-muted-foreground" /> Dine In - Table {selectedOrder.table_number}</>
                  ) : (
                    <><Package className="h-4 w-4 text-muted-foreground" /> Take Away</>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatSL(new Date(selectedOrder.createdAt), "dd/MM/yyyy HH:mm")}</span>
                </div>
              </div>

              {/* Status Update */}
              <div className="flex items-center gap-4">
                <Label>Status:</Label>
                {getStatusBadge(selectedOrder.status)}
                {selectedOrder.status === "PENDING" && (
                  <div className="flex gap-2 ml-auto">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, OrderStatus.CANCELLED)}
                      disabled={isCancellingOrder}
                    >
                      {isCancellingOrder ? (
                        <><RefreshCw className="h-4 w-4 mr-1 animate-spin" />Cancelling...</>
                      ) : (
                        <><X className="h-4 w-4 mr-1" />Cancel Order</>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-semibold">Order Items</Label>
                  {selectedOrder.status === "PENDING" && (
                    <Button size="sm" variant="outline" onClick={() => setIsAddItemDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add Item
                    </Button>
                  )}
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px] text-center">KOT</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        {selectedOrder.status === "PENDING" && <TableHead className="text-right">Action</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-center">
                            {(item.kot_sent || kotSentOrderItemIds.has(item.id)) ? (
                              <Check className="h-4 w-4 mx-auto text-green-500" title="KOT Sent" />
                            ) : (
                              <Clock className="h-4 w-4 mx-auto text-orange-500" title="Pending KOT" />
                            )}
                          </TableCell>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">Rs.{item.unit_price.toFixed(0)}</TableCell>
                          <TableCell className="text-right">Rs.{item.total.toFixed(0)}</TableCell>
                          {selectedOrder.status === "PENDING" && (
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteItemFromOrder(item.id)}
                                disabled={item.kot_sent || kotSentOrderItemIds.has(item.id)}
                                title={item.kot_sent || kotSentOrderItemIds.has(item.id) ? "Cannot remove item after KOT is sent" : undefined}
                              >
                                <Trash2 className={`h-4 w-4 ${item.kot_sent || kotSentOrderItemIds.has(item.id) ? 'text-muted-foreground' : 'text-red-500'}`} />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>Rs.{selectedOrder.subtotal.toFixed(0)}</span>
                </div>
                {selectedOrder.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span>Rs.{selectedOrder.tax.toFixed(0)}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="text-green-600">-Rs.{selectedOrder.discount.toFixed(0)}</span>
                  </div>
                )}
                {selectedOrderServiceCharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Charge ({serviceCharge?.percentage}%):</span>
                    <span>Rs.{selectedOrderServiceCharge.toFixed(0)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>Rs.{selectedOrderTotalWithServiceCharge.toFixed(0)}</span>
                </div>
              </div>

              {/* Terminal Info */}
              <div className="text-xs text-muted-foreground">
                <p>Terminal ID: {selectedOrder.terminal_id} | Cashier: {selectedOrder.cashier_name}</p>
              </div>

              {selectedOrder?.status === "PENDING" && hasUnsentOrderItems && (
                <div className="pt-2 border-t space-y-2 mt-4">
                  <Label htmlFor="kot-remark" className="text-xs">
                    Remark for Kitchen (for unsent items)
                  </Label>
                  <Input
                    id="kot-remark"
                    placeholder="E.g., Less spicy, no onions"
                    value={kotRemark}
                    onChange={(e) => setKotRemark(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedOrder?.status === "PENDING" && (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white disabled:bg-orange-500 disabled:opacity-100"
                onClick={handleSendOrderKot}
                disabled={isSendingKot || isPrinting}
              >
                <UtensilsCrossed className="h-4 w-4 mr-2" />
                {isSendingKot ? "Sending..." : (hasUnsentOrderItems ? "Send KOT" : "KOT Sent ✓")}
              </Button>
            )}
            <Button variant="outline" onClick={() => handlePrintBill(selectedOrder!)} disabled={isPrinting}>
              <Printer className="h-4 w-4 mr-2" /> {isPrinting ? "Printing..." : "Print Bill"}
            </Button>
            {selectedOrder?.status === "PENDING" && (
              <Button onClick={() => setIsPaymentDialogOpen(true)} disabled={isPrinting || hasUnsentOrderItems} title={hasUnsentOrderItems ? "Send KOT first" : undefined}>
                <CreditCard className="h-4 w-4 mr-2" /> Complete Payment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item to Order</DialogTitle>
            <DialogDescription>
              Select a product to add to this order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => {
                    const customerType = selectedOrder?.customer_type as "local" | "foreigner";
                    const priceToShow = customerType === "local" ? (product.localPrice ?? 0) : (product.foreignerPrice ?? 0);
                    return (
                      <SelectItem key={product.productId} value={product.productId}>
                        {product.productName} - Rs.{priceToShow.toFixed(0)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)} disabled={isAddingItem}>
              Cancel
            </Button>
            <Button onClick={handleAddItemToOrder} disabled={!selectedProductId || isAddingItem}>
              {isAddingItem ? (
                <><RefreshCw className="h-4 w-4 mr-1 animate-spin" />Adding...</>
              ) : (
                'Add Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog for Order Details */}
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        total={selectedOrderTotalWithServiceCharge || 0}
        onConfirmPayment={handleConfirmPayment}
        isPrinting={isPrinting}
      />
    </div>
  );
};

export default Orders;
