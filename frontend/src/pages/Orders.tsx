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
  MapPin,
  Clock,
  UtensilsCrossed,
  Package,
  CreditCard,
  Search,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { orderService } from "@/api/services/orderService";
import api from "@/api/client";
import type { MyStockResponse, MyStockTableRow } from "@/types/mystock";

// Types for restaurant orders
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: "dine_in" | "take_away";
  tableNumber: number | null;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  terminalId: string;
  cashierName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Product type for adding items
interface Product {
  id: string;
  name: string;
  price: number;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Add item form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit">("cash");
  const [amountPaid, setAmountPaid] = useState(0);

  // Get current user info (hardcoded)
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

  // Fetch orders from backend
  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch products for add item dialog
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.list({});
      
      // Backend returns { success, data: [...orders], pagination }
      const ordersData = response.data || [];
      
      // Map backend response to frontend Order type
      const mappedOrders: Order[] = ordersData.map((order: any) => {
        // Extract table number from table name (handles "Table 1", "Table 2", or just "Table")
        let tableNumber: number | null = null;
        if (order.table?.name) {
          const match = order.table.name.match(/\d+/);
          tableNumber = match ? parseInt(match[0]) : null;
        }
        
        return {
          id: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          orderType: order.order_type.toLowerCase() as "dine_in" | "take_away",
          tableNumber,
          status: order.status.toLowerCase() as "pending" | "preparing" | "ready" | "completed" | "cancelled",
          items: order.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product_name,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unit_price),
            total: parseFloat(item.total),
          })),
          subtotal: parseFloat(order.subtotal),
          tax: parseFloat(order.tax),
          discount: parseFloat(order.discount),
          total: parseFloat(order.total),
          terminalId: order.terminal_id || "T-001",
          cashierName: order.cashier_name,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        };
      });

      setOrders(mappedOrders);
    } catch (error: any) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders", {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get<MyStockResponse>('/mystock', { 
        params: { page: 1, pageSize: 100 },
      });
      const rows: MyStockTableRow[] = res.data.tableResponse?.data ?? [];
      const mappedProducts: Product[] = rows.map((r) => ({
        id: r.productId,
        name: r.productName,
        price: r.foreignerPrice ?? 0,
      }));
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Failed to load products', error);
    }
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery);
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending").length;
    const preparing = orders.filter((o) => o.status === "preparing").length;
    const ready = orders.filter((o) => o.status === "ready").length;
    const completed = orders.filter((o) => o.status === "completed").length;
    return { pending, preparing, ready, completed };
  }, [orders]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleAddItemToOrder = async () => {
    if (!selectedOrder || !selectedProductId || quantity < 1) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    try {
      // Add item via backend API
      await orderService.addItem(selectedOrder.id, {
        productId: product.id,
        product_name: product.name,
        quantity,
        unit_price: product.price,
        total: product.price * quantity,
      });

      toast.success(`Added ${product.name} to order`);
      
      // Refresh orders and selected order
      await fetchOrders();
      const response = await orderService.getById(selectedOrder.id);
      const updatedOrder = response.data; // Extract data from response
      
      // Extract table number from table name
      let tableNumber: number | null = null;
      if (updatedOrder.table?.name) {
        const match = updatedOrder.table.name.match(/\d+/);
        tableNumber = match ? parseInt(match[0]) : null;
      }
      
      setSelectedOrder({
        id: updatedOrder.id,
        orderNumber: updatedOrder.order_number,
        customerName: updatedOrder.customer_name,
        customerPhone: updatedOrder.customer_phone,
        orderType: updatedOrder.order_type.toLowerCase() as "dine_in" | "take_away",
        tableNumber,
        status: updatedOrder.status.toLowerCase() as "pending" | "preparing" | "ready" | "completed" | "cancelled",
        items: updatedOrder.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          total: parseFloat(item.total),
        })),
        subtotal: parseFloat(updatedOrder.subtotal),
        tax: parseFloat(updatedOrder.tax),
        discount: parseFloat(updatedOrder.discount),
        total: parseFloat(updatedOrder.total),
        terminalId: updatedOrder.terminal_id || "T-001",
        cashierName: updatedOrder.cashier_name,
        createdAt: new Date(updatedOrder.createdAt),
        updatedAt: new Date(updatedOrder.updatedAt),
      });

      setIsAddItemDialogOpen(false);
      setSelectedProductId("");
      setQuantity(1);
    } catch (error: any) {
      console.error("Failed to add item:", error);
      toast.error("Failed to add item to order", {
        description: error.response?.data?.error || error.message,
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      // Update status via backend API
      await orderService.update(orderId, {
        status: newStatus.toUpperCase() as 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED',
      });

      toast.success(`Order status updated to ${newStatus}`);
      
      // Refresh orders
      await fetchOrders();
      
      // Update selected order if it's the one being updated
      if (selectedOrder?.id === orderId) {
        const response = await orderService.getById(orderId);
        const updatedOrder = response.data; // Extract data from response
        
        // Extract table number from table name
        let tableNumber: number | null = null;
        if (updatedOrder.table?.name) {
          const match = updatedOrder.table.name.match(/\d+/);
          tableNumber = match ? parseInt(match[0]) : null;
        }
        
        setSelectedOrder({
          id: updatedOrder.id,
          orderNumber: updatedOrder.order_number,
          customerName: updatedOrder.customer_name,
          customerPhone: updatedOrder.customer_phone,
          orderType: updatedOrder.order_type.toLowerCase() as "dine_in" | "take_away",
          tableNumber,
          status: updatedOrder.status.toLowerCase() as "pending" | "preparing" | "ready" | "completed" | "cancelled",
          items: updatedOrder.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product_name,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unit_price),
            total: parseFloat(item.total),
          })),
          subtotal: parseFloat(updatedOrder.subtotal),
          tax: parseFloat(updatedOrder.tax),
          discount: parseFloat(updatedOrder.discount),
          total: parseFloat(updatedOrder.total),
          terminalId: updatedOrder.terminal_id || "T-001",
          cashierName: updatedOrder.cashier_name,
          createdAt: new Date(updatedOrder.createdAt),
          updatedAt: new Date(updatedOrder.updatedAt),
        });
      }
    } catch (error: any) {
      console.error("Failed to update order status:", error);
      toast.error("Failed to update order status", {
        description: error.response?.data?.error || error.message,
      });
    }
  };

  const handlePrintBill = (order: Order) => {
    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - ${order.orderNumber}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 20px; }
          .header p { margin: 5px 0; font-size: 12px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .info { font-size: 12px; margin-bottom: 10px; }
          .items { width: 100%; font-size: 12px; }
          .items th, .items td { text-align: left; padding: 3px 0; }
          .items .qty { width: 30px; }
          .items .price { text-align: right; }
          .total { font-size: 14px; font-weight: bold; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>TASTY CORNER</h1>
          <p>Restaurant & Cafe</p>
          <p>Tel: 011-1234567</p>
        </div>
        <div class="divider"></div>
        <div class="info">
          <p><strong>Order:</strong> ${order.orderNumber}</p>
          <p><strong>Date:</strong> ${format(order.createdAt, "dd/MM/yyyy HH:mm")}</p>
          <p><strong>Customer:</strong> ${order.customerName}</p>
          <p><strong>Phone:</strong> ${order.customerPhone}</p>
          <p><strong>Type:</strong> ${order.orderType === "dine_in" ? `Dine In - Table ${order.tableNumber}` : "Take Away"}</p>
          <p><strong>Terminal:</strong> ${order.terminalId}</p>
          <p><strong>Cashier:</strong> ${order.cashierName}</p>
        </div>
        <div class="divider"></div>
        <table class="items">
          <tr>
            <th class="qty">Qty</th>
            <th>Item</th>
            <th class="price">Price</th>
          </tr>
          ${order.items
            .map(
              (item) => `
            <tr>
              <td class="qty">${item.quantity}</td>
              <td>${item.productName}</td>
              <td class="price">Rs.${item.total.toFixed(0)}</td>
            </tr>
          `
            )
            .join("")}
        </table>
        <div class="divider"></div>
        <div class="total">
          <p>Subtotal: Rs.${order.subtotal.toFixed(0)}</p>
          ${order.tax > 0 ? `<p>Tax: Rs.${order.tax.toFixed(0)}</p>` : ""}
          ${order.discount > 0 ? `<p>Discount: -Rs.${order.discount.toFixed(0)}</p>` : ""}
          <p>TOTAL: Rs.${order.total.toFixed(0)}</p>
        </div>
        <div class="divider"></div>
        <div class="footer">
          <p>Thank you for dining with us!</p>
          <p>Please come again</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    toast.success("Bill sent to printer");
  };

  const handleCompletePayment = async () => {
    if (!selectedOrder) return;

    const change = amountPaid - selectedOrder.total;
    if (paymentMethod !== "credit" && change < 0) {
      toast.error("Amount paid is less than total!");
      return;
    }

    try {
      // Complete order with payment via backend API
      await orderService.complete(selectedOrder.id, {
        payment_method: paymentMethod.toUpperCase(),
        cash_given: amountPaid,
        balance_given: change >= 0 ? change : 0,
      });

      toast.success("Payment completed successfully!");
      
      // Refresh orders list
      await fetchOrders();
      
      // Print bill
      handlePrintBill(selectedOrder);
      
      // Close dialogs and reset form
      setIsPaymentDialogOpen(false);
      setIsViewDialogOpen(false);
      setPaymentMethod("cash");
      setAmountPaid(0);
    } catch (error: any) {
      console.error("Failed to complete payment:", error);
      toast.error("Failed to complete payment", {
        description: error.response?.data?.error || error.message,
      });
    }
  };

  const getStatusBadge = (status: Order["status"]) => {
    const styles: Record<Order["status"], string> = {
      pending: "bg-yellow-100 text-yellow-800",
      preparing: "bg-blue-100 text-blue-800",
      ready: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return <Badge className={styles[status]}>{status.toUpperCase()}</Badge>;
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Preparing</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.preparing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Ready</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.ready}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.completed}</div>
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
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchOrders} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
              Clear
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Loading orders...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.orderType === "dine_in" ? (
                            <><UtensilsCrossed className="h-3 w-3 mr-1" /> Dine In</>
                          ) : (
                            <><Package className="h-3 w-3 mr-1" /> Take Away</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.tableNumber ? `Table ${order.tableNumber}` : "-"}
                      </TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell className="font-medium">Rs.{order.total.toFixed(0)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(order.createdAt, "HH:mm")}
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
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Order Details - {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              View and manage order details
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedOrder.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedOrder.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedOrder.orderType === "dine_in" ? (
                    <><UtensilsCrossed className="h-4 w-4 text-muted-foreground" /> Dine In - Table {selectedOrder.tableNumber}</>
                  ) : (
                    <><Package className="h-4 w-4 text-muted-foreground" /> Take Away</>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{format(selectedOrder.createdAt, "dd/MM/yyyy HH:mm")}</span>
                </div>
              </div>

              {/* Status Update */}
              <div className="flex items-center gap-4">
                <Label>Status:</Label>
                {getStatusBadge(selectedOrder.status)}
                {selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
                  <div className="flex gap-2 ml-auto">
                    {selectedOrder.status === "pending" && (
                      <Button size="sm" onClick={() => handleUpdateOrderStatus(selectedOrder.id, "preparing")}>
                        Start Preparing
                      </Button>
                    )}
                    {selectedOrder.status === "preparing" && (
                      <Button size="sm" onClick={() => handleUpdateOrderStatus(selectedOrder.id, "ready")}>
                        Mark Ready
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-semibold">Order Items</Label>
                  {selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
                    <Button size="sm" variant="outline" onClick={() => setIsAddItemDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add Item
                    </Button>
                  )}
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">Rs.{item.unitPrice.toFixed(0)}</TableCell>
                          <TableCell className="text-right">Rs.{item.total.toFixed(0)}</TableCell>
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
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>Rs.{selectedOrder.total.toFixed(0)}</span>
                </div>
              </div>

              {/* Terminal Info */}
              <div className="text-xs text-muted-foreground">
                <p>Terminal ID: {selectedOrder.terminalId} | Cashier: {selectedOrder.cashierName}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handlePrintBill(selectedOrder!)}>
              <Printer className="h-4 w-4 mr-2" /> Print Bill
            </Button>
            {selectedOrder?.status === "ready" && (
              <Button onClick={() => { setAmountPaid(selectedOrder.total); setIsPaymentDialogOpen(true); }}>
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
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - Rs.{product.price}
                    </SelectItem>
                  ))}
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
            <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItemToOrder} disabled={!selectedProductId}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Total Amount: Rs.{selectedOrder?.total.toFixed(0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(val: "cash" | "card" | "credit") => setPaymentMethod(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod !== "credit" && (
              <div className="space-y-2">
                <Label>Amount Paid</Label>
                <Input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                />
                {amountPaid > (selectedOrder?.total || 0) && (
                  <p className="text-sm text-green-600">
                    Change: Rs.{(amountPaid - (selectedOrder?.total || 0)).toFixed(0)}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompletePayment}>
              Complete Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
