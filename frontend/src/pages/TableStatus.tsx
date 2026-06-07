import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Utensils, Clock, Eye, Filter, X, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/api/services/orderService";
import LocalLoader from "@/components/common/LocalLoader";

// Mock data structure - replace with actual API calls
interface TableOrder {
  id: string;
  table_id: string;
  table_name: string;
  table_number: number;
  customer_name: string;
  customer_phone: string;
  order_type: 'DINE_IN' | 'TAKE_AWAY';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  order_number: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  cashier_name: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

interface TableWithStatus {
  table_number: number;
  table_name: string;
  status: 'available' | 'occupied' | 'reserved';
  current_order?: TableOrder;
  customer_name?: string;
  order_time?: string;
  total_amount?: number;
  item_count?: number;
}

const TableStatus = () => {
  const [tables, setTables] = useState<TableWithStatus[]>([]);
  const [summary, setSummary] = useState({ total: 0, occupied: 0, available: 0, reserved: 0 });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<TableOrder | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Fetch table status from API — real-time, no date filter
  const { data } = useQuery({
    queryKey: ["table-status", statusFilter],
    queryFn: async () => {
      const params: {
        status?: 'available' | 'occupied' | 'all';
      } = {};

      if (statusFilter !== "all") {
        params.status = statusFilter as 'available' | 'occupied';
      }

      return await orderService.getTableStatus(params);
    },
    staleTime: 30_000, // Refetch every 30 seconds
    refetchInterval: 30_000, // Auto-refetch every 30 seconds
  });

  useEffect(() => {
    if (data) {
      setTables(data.tables || []);
      setSummary(data.summary || { total: 0, occupied: 0, available: 0, reserved: 0 });
    }
  }, [data]);

  // Filtered tables - already filtered by backend, but we can add client-side filtering if needed
  const filteredTables = useMemo(() => {
    return tables;
  }, [tables]);

  const clearFilters = () => {
    setStatusFilter("all");
  };

  const handleViewOrder = async (table: TableWithStatus) => {
    if (table.current_order?.id) {
      try {
        // Fetch the full order details including items since getTableStatus payload is optimized
        const fullOrder = await orderService.getOrderById(table.current_order.id);
        setSelectedOrder(fullOrder as any);
        setViewDialogOpen(true);
      } catch (err) {
        toast.error("Failed to load full order details");
        console.error(err);
      }
    } else {
      toast.error("No active order for this table");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'occupied':
        return <Badge className="bg-red-100 text-red-700 border-red-300">🔴 Occupied</Badge>;
      case 'available':
        return <Badge className="bg-green-100 text-green-700 border-green-300">✅ Available</Badge>;
      case 'reserved':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">⏳ Reserved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Table Status</h1>
        <p className="text-sm md:text-base text-muted-foreground">Monitor restaurant table occupancy and orders</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-blue-600 font-medium">Total Tables</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-900">{summary.total}</p>
              </div>
              <Utensils className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-green-600 font-medium">Available</p>
                <p className="text-2xl md:text-3xl font-bold text-green-900">{summary.available}</p>
              </div>
              <Utensils className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-red-600 font-medium">Occupied</p>
                <p className="text-2xl md:text-3xl font-bold text-red-900">{summary.occupied}</p>
              </div>
              <Utensils className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-yellow-600 font-medium">Reserved</p>
                <p className="text-2xl md:text-3xl font-bold text-yellow-900">{summary.reserved}</p>
              </div>
              <Utensils className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Table Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Table Details ({filteredTables.length} {filteredTables.length === 1 ? 'table' : 'tables'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LocalLoader loaderKey="table-status">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order Time</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No tables found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTables.map((table, index) => (
                      <TableRow key={table.table_name ? `table-${table.table_name}` : index}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-muted-foreground" />
                            {table.table_name}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(table.status)}</TableCell>
                        <TableCell>
                          {table.customer_name ? (
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              {table.customer_name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {table.order_time ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {format(new Date(table.order_time), "MMM dd, yyyy HH:mm")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {table.item_count ? (
                            <Badge variant="secondary">{table.item_count} items</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {table.total_amount ? (
                            `Rs. ${table.total_amount.toFixed(2)}`
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {table.current_order && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewOrder(table)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </LocalLoader>
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Order Details
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Information */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-semibold">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Table</p>
                  <p className="font-semibold">{selectedOrder.table_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Type</p>
                  <Badge variant={selectedOrder.order_type === 'DINE_IN' ? 'default' : 'secondary'}>
                    {selectedOrder.order_type.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={
                    selectedOrder.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    selectedOrder.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }>
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-2">Order Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedOrder.items || []).map((item, index) => (
                      <TableRow key={item.id || `item-${index}`}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">Rs. {item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">Rs. {item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Subtotal:</span>
                    <span className="font-semibold">Rs. {selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">Tax:</span>
                      <span className="font-semibold">Rs. {selectedOrder.tax.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">Discount:</span>
                      <span className="font-semibold text-red-600">- Rs. {selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-lg">Rs. {selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cashier</p>
                  <p className="font-medium">{selectedOrder.cashier_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Order Time</p>
                  <p className="font-medium">{format(new Date(selectedOrder.createdAt), "PPpp")}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm p-2 bg-muted/50 rounded">{selectedOrder.notes}</p>
                </div>
              )}

              <Button onClick={() => setViewDialogOpen(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableStatus;

