import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Receipt,
  Search,
  Calendar,
  Eye,
  Download,
  Filter,
  CreditCard,
  Banknote,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { Bill, BillItem } from "@/types/pos";

// Mock bills data - in real app, this would come from API
const generateMockBills = (): Bill[] => {
  const paymentMethods: Array<'cash' | 'card' | 'credit' | 'other'> = ['cash', 'card', 'credit', 'other'];
  const bills: Bill[] = [];

  // Generate bills for the last 30 days
  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));

    const itemCount = Math.floor(Math.random() * 5) + 1;
    const items: BillItem[] = [];
    let subtotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const price = Math.floor(Math.random() * 500) + 100;
      const quantity = Math.floor(Math.random() * 3) + 1;
      const itemSubtotal = price * quantity;
      subtotal += itemSubtotal;

      items.push({
        product: {
          id: `prod-${j}`,
          name: `Product ${j + 1}`,
          category: 'General',
          price: price,
          cost: price * 0.7,
          stock: 100,
          minStock: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        quantity: quantity,
        subtotal: itemSubtotal,
      });
    }

    const taxRate = 10;
    const tax = subtotal * (taxRate / 100);
    const discountRate = Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 5 : 0;
    const discount = subtotal * (discountRate / 100);
    const total = subtotal + tax - discount;
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

    bills.push({
      id: `BILL-${Date.now() - i * 100000}`,
      items,
      subtotal,
      tax,
      taxRate,
      discount,
      discountRate,
      total,
      customerName: Math.random() > 0.5 ? `Customer ${i + 1}` : undefined,
      customerPhone: Math.random() > 0.6 ? `+94 77 ${Math.floor(Math.random() * 9000000) + 1000000}` : undefined,
      paymentMethod,
      amountPaid: paymentMethod === 'credit' ? 0 : total + (paymentMethod === 'cash' ? Math.floor(Math.random() * 500) : 0),
      change: paymentMethod === 'credit' ? 0 : Math.floor(Math.random() * 500),
      creditDescription: paymentMethod === 'credit' ? `Credit sale - Due in 30 days` : undefined,
      createdAt: date,
    });
  }

  return bills.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

const Bills = () => {
  const [bills] = useState<Bill[]>(generateMockBills());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterToday, setFilterToday] = useState(false);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const itemsPerPage = 15;

  // Filter bills
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !bill.id.toLowerCase().includes(query) &&
          !bill.customerName?.toLowerCase().includes(query) &&
          !bill.customerPhone?.includes(query)
        ) {
          return false;
        }
      }

      // Today filter
      if (filterToday) {
        const today = new Date();
        const billDate = new Date(bill.createdAt);
        if (
          billDate.getDate() !== today.getDate() ||
          billDate.getMonth() !== today.getMonth() ||
          billDate.getFullYear() !== today.getFullYear()
        ) {
          return false;
        }
      }

      // Date from filter
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (new Date(bill.createdAt) < fromDate) {
          return false;
        }
      }

      // Date to filter
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(bill.createdAt) > toDate) {
          return false;
        }
      }

      // Payment method filter
      if (paymentMethodFilter !== "all" && bill.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      return true;
    });
  }, [bills, searchQuery, filterToday, dateFrom, dateTo, paymentMethodFilter]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, filterToday, dateFrom, dateTo, paymentMethodFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);
  const paginatedBills = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBills.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBills, currentPage]);

  // Statistics
  const stats = useMemo(() => {
    const totalRevenue = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
    const totalBills = filteredBills.length;
    const cashBills = filteredBills.filter((b) => b.paymentMethod === "cash").length;
    const cardBills = filteredBills.filter((b) => b.paymentMethod === "card").length;
    const creditBills = filteredBills.filter((b) => b.paymentMethod === "credit").length;
    return { totalRevenue, totalBills, cashBills, cardBills, creditBills };
  }, [filteredBills]);

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setFilterToday(false);
    setPaymentMethodFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsViewDialogOpen(true);
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "cash":
        return <Badge className="bg-green-100 text-green-800"><Banknote className="h-3 w-3 mr-1" />Cash</Badge>;
      case "card":
        return <Badge className="bg-blue-100 text-blue-800"><CreditCard className="h-3 w-3 mr-1" />Card</Badge>;
      case "credit":
        return <Badge className="bg-yellow-100 text-yellow-800"><Receipt className="h-3 w-3 mr-1" />Credit</Badge>;
      default:
        return <Badge variant="secondary">{method}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Bills Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View and manage all sales bills
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Bills
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Bills
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.totalBills}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-green-600">
              Rs.{stats.totalRevenue.toFixed(0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Cash
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.cashBills}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Card
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.cardBills}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Credit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-yellow-600">{stats.creditBills}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Filter className="h-4 w-4 md:h-5 md:w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4">
            {/* Search */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs md:text-sm">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Bill ID, Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 md:h-10"
                />
              </div>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setFilterToday(false);
                }}
                className="h-9 md:h-10"
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setFilterToday(false);
                }}
                className="h-9 md:h-10"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Payment Method</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="h-9 md:h-10">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Today & Clear */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">&nbsp;</Label>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 border rounded-md px-3 h-9 md:h-10">
                  <Checkbox
                    id="filterToday"
                    checked={filterToday}
                    onCheckedChange={(checked) => {
                      setFilterToday(checked as boolean);
                      if (checked) {
                        setDateFrom("");
                        setDateTo("");
                      }
                    }}
                  />
                  <Label htmlFor="filterToday" className="text-xs md:text-sm cursor-pointer">
                    Today
                  </Label>
                </div>
                <Button variant="outline" onClick={clearFilters} className="h-9 md:h-10">
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Receipt className="h-4 w-4 md:h-5 md:w-5" />
            Bills ({filteredBills.length})
            {totalPages > 1 && (
              <span className="text-xs md:text-sm font-normal text-muted-foreground">
                - Page {currentPage} of {totalPages}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          {/* Desktop Table */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Payment</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Receipt className="h-12 w-12" />
                        <p>No bills found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono text-sm">{bill.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(bill.createdAt, "MMM dd, yyyy")}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(bill.createdAt, "hh:mm a")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {bill.customerName || <span className="text-muted-foreground">Walk-in</span>}
                      </TableCell>
                      <TableCell>{bill.items.length} items</TableCell>
                      <TableCell className="text-right font-semibold">
                        Rs.{bill.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getPaymentMethodBadge(bill.paymentMethod)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewBill(bill)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {paginatedBills.length === 0 ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
                <Receipt className="h-12 w-12" />
                <p>No bills found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              paginatedBills.map((bill) => (
                <div
                  key={bill.id}
                  className="border rounded-lg p-3 space-y-2 bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm font-medium">{bill.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(bill.createdAt, "MMM dd, yyyy hh:mm a")}
                      </p>
                    </div>
                    {getPaymentMethodBadge(bill.paymentMethod)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Customer</p>
                      <p className="font-medium">{bill.customerName || "Walk-in"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Total</p>
                      <p className="font-semibold text-green-600">Rs.{bill.total.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-muted-foreground">{bill.items.length} items</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewBill(bill)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-4">
              <div className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredBills.length)} of{" "}
                {filteredBills.length} bills
              </div>

              {/* Mobile Pagination */}
              <div className="flex md:hidden items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Desktop Pagination */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bill Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Bill Details
            </DialogTitle>
            <DialogDescription>
              {selectedBill?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedBill && (
            <div className="space-y-4">
              {/* Bill Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Date & Time
                  </p>
                  <p className="font-medium">
                    {format(selectedBill.createdAt, "MMMM dd, yyyy hh:mm a")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  {getPaymentMethodBadge(selectedBill.paymentMethod)}
                </div>
              </div>

              {/* Customer Info */}
              {(selectedBill.customerName || selectedBill.customerPhone) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {selectedBill.customerName && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Customer Name
                        </p>
                        <p className="font-medium">{selectedBill.customerName}</p>
                      </div>
                    )}
                    {selectedBill.customerPhone && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          Phone
                        </p>
                        <p className="font-medium">{selectedBill.customerPhone}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Credit Description */}
              {selectedBill.paymentMethod === 'credit' && selectedBill.creditDescription && (
                <>
                  <Separator />
                  <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Credit Note:</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">{selectedBill.creditDescription}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Items Table */}
              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBill.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product.name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">Rs.{item.product.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">Rs.{item.subtotal.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>Rs.{selectedBill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({selectedBill.taxRate}%)</span>
                  <span>Rs.{selectedBill.tax.toFixed(2)}</span>
                </div>
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount ({selectedBill.discountRate}%)</span>
                    <span className="text-red-600">-Rs.{selectedBill.discount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">Rs.{selectedBill.total.toFixed(2)}</span>
                </div>

                {selectedBill.paymentMethod !== 'credit' && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span>Rs.{selectedBill.amountPaid.toFixed(2)}</span>
                    </div>
                    {selectedBill.change > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Change</span>
                        <span>Rs.{selectedBill.change.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bills;

