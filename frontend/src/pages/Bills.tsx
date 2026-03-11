import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  DialogTrigger,
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
  Keyboard,
} from "lucide-react";
import { format } from "date-fns";
import { Bill } from "@/types/pos";
import {
  useGetBillsQuery,
  useGetBillByIdQuery,
  useUpdateBillPaymentMutation
} from "@/store/api/billsApi";
import { PaymentDialog } from "@/components/pos/PaymentDialog";
import { printBillNewWindow } from "@/lib/billPrinter";
import { STORAGE_KEYS } from "@/utils/constants";
import { Skeleton } from "@/components/ui/skeleton";

const Bills = () => {
  const navigate = useNavigate();

  // Default date to today (YYYY-MM-DD format for input[type="date"])
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter state
  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(todayStr);
  const [filterToday, setFilterToday] = useState(false);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // RTK Query hooks
  const {
    data: billsData,
    isLoading,
    refetch
  } = useGetBillsQuery({
    page: currentPage,
    pageSize: itemsPerPage, // Changed from 'limit' to match backend
    dateFrom: filterToday ? undefined : dateFrom,
    dateTo: filterToday ? undefined : dateTo,
    today: filterToday ? true : undefined, // Added to match backend
    paymentMethod: paymentMethodFilter === "all" ? undefined : paymentMethodFilter,
    search: searchQuery || undefined,
  });

  const [updateBillPayment] = useUpdateBillPaymentMutation();

  // Extract data from RTK Query response and memoize
  const bills = useMemo(() => billsData?.items ?? [], [billsData?.items]);
  const totalRecords = billsData?.total ?? 0;

  // Dialog state
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [billForPayment, setBillForPayment] = useState<Bill | null>(null);

  // Fetch detailed bill when selectedBillId is set
  const { data: detailedBill, isLoading: isLoadingBill } = useGetBillByIdQuery(
    selectedBillId || '',
    { skip: !selectedBillId }
  );

  // Update selectedBill when detailed bill is loaded
  useEffect(() => {
    if (detailedBill && !isLoadingBill) {
      setSelectedBill(detailedBill);
    }
  }, [detailedBill, isLoadingBill]);

  // Determine selected module safely (default to 'pos')
  const selectedModule = (() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.selectedModule) || 'pos';
    } catch {
      return 'pos';
    }
  })();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterToday, dateFrom, dateTo, paymentMethodFilter]);

  // Pagination values from RTK Query
  const totalPages = Math.max(1, Math.ceil((totalRecords || 0) / itemsPerPage));
  const paginatedBills = bills; // RTK Query already returns paginated results

  // Statistics - memoized to avoid recalculation
  const stats = useMemo(() => {
    const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
    const totalBills = totalRecords || bills.length;
    const cashBills = bills.filter((b) => b.paymentMethod === 'cash').length;
    const cardBills = bills.filter((b) => b.paymentMethod === 'card').length;
    const creditBills = bills.filter((b) => b.paymentMethod === 'credit').length;
    return { totalRevenue, totalBills, cashBills, cardBills, creditBills };
  }, [bills, totalRecords]);

  // Clear all filters
  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setFilterToday(false);
    setPaymentMethodFilter('all');
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Fetch bill details using RTK Query
  const handleViewBill = (bill: Bill) => {
    setSelectedBill(null); // Clear previous bill
    setSelectedBillId(bill.id); // Trigger fetch
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

  const handleOpenPayment = (bill: Bill) => {
    setBillForPayment(bill);
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async (
    paymentMethod: 'cash' | 'card' | 'credit' | 'other',
    amountPaid: number,
    customerName?: string,
    customerPhone?: string,
    creditDescription?: string
  ) => {
    if (!billForPayment) return;

    const now = new Date();
    const change = paymentMethod === 'credit' ? 0 : amountPaid - billForPayment.total;

    try {
      // Update payment using RTK Query mutation
      await updateBillPayment({
        id: billForPayment.id,
        paymentMethod,
        amountPaid: paymentMethod === 'credit' ? 0 : amountPaid,
        creditDescription: paymentMethod === 'credit' ? creditDescription : undefined,
      }).unwrap();

      // Create printable bill
      const printable: Bill = {
        id: billForPayment.id,
        items: billForPayment.items,
        subtotal: billForPayment.subtotal,
        tax: billForPayment.tax,
        taxRate: billForPayment.taxRate,
        discount: billForPayment.discount ?? 0,
        discountRate: billForPayment.discountRate ?? 0,
        total: billForPayment.total,
        customerName: customerName ?? billForPayment.customerName,
        customerPhone: customerPhone ?? billForPayment.customerPhone,
        paymentMethod,
        amountPaid,
        change,
        creditDescription,
        createdAt: now,
      };

      printBillNewWindow(printable);
      setIsPaymentDialogOpen(false);
      setBillForPayment(null);

      // Refetch bills to update the list
      refetch();
    } catch (error) {
      console.error('Failed to update bill payment:', error);
    }
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or select
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' ||
                          target.tagName === 'TEXTAREA' ||
                          target.tagName === 'SELECT' ||
                          target.isContentEditable;

      // Allow shortcuts only if not in dialog and not typing in input fields
      if (isViewDialogOpen || isPaymentDialogOpen || isInputField) return;

      const key = e.key.toLowerCase();

      switch (key) {
        case 'p':
          // Navigate to POS page
          e.preventDefault();
          navigate('/pos');
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate, isViewDialogOpen, isPaymentDialogOpen]);

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
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Keyboard className="h-4 w-4 mr-2" />
                Shortcuts
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Keyboard Shortcuts</DialogTitle>
                <DialogDescription>
                  Use these keyboard shortcuts to navigate faster
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-[80px_1fr] gap-4 items-center">
                  <Badge variant="secondary" className="justify-center text-lg font-mono">P</Badge>
                  <p className="text-sm">Navigate to <strong>POS System</strong> page</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>💡 Tip: Shortcuts are disabled when typing in input fields or when dialogs are open.</p>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Bills
          </Button>
        </div>
      </div>

      {/* Statistics Cards with Loader */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
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
      )}

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
            Bills ({totalRecords || 0})
            {totalPages > 1 && (
              <span className="text-xs md:text-sm font-normal text-muted-foreground">
                - Page {currentPage} of {totalPages}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          {isLoading ? (
            <div className="py-8 flex items-center justify-center">
              <div>Loading bills...</div>
            </div>
          ) : (
            <>
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
                      <TableCell className="font-mono text-sm">{bill.billNumber || bill.id}</TableCell>
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
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewBill(bill)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {selectedModule === 'pos' && bill.paymentMethod === 'credit' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleOpenPayment(bill)}
                              aria-label="Collect Payment"
                              title="Collect Payment"
                              className="p-2"
                            >
                              <Banknote className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
                          <p className="font-mono text-sm font-medium">{bill.billNumber || bill.id}</p>
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
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewBill(bill)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {selectedModule === 'pos' && bill.paymentMethod === 'credit' && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenPayment(bill)}
                              aria-label="Collect Payment"
                              title="Collect Payment"
                              className="p-2"
                            >
                              <Banknote className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-4">
              <div className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalRecords || 0)} of {totalRecords || 0} bills
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
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        setIsViewDialogOpen(open);
        if (!open) {
          setSelectedBillId(null); // Clear selected bill ID when closing
          setSelectedBill(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Bill Details
            </DialogTitle>
            <DialogDescription>
              {selectedBill?.billNumber || selectedBill?.id || 'Loading...'}
            </DialogDescription>
          </DialogHeader>

          {isLoadingBill || !selectedBill ? (
            <div className="py-8 flex items-center justify-center">
              <div>Loading bill details...</div>
            </div>
          ) : (
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
                        <TableHead className="text-right">Bottle Volume</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBill.items.map((item, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.product.name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">Rs.{item.product.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">Rs.{item.subtotal.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.product.bottleVolume ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                {(() => {
                  const totalLiters = (selectedBill.items || []).reduce((sum: number, item) => {
                    const label: string | undefined = item?.product?.bottleVolume;
                    if (!label) return sum;
                    const parts = String(label).trim().toLowerCase().split(/\s+/);
                    const val = parseFloat(parts[0]);
                    const unit = parts[1] || '';
                    if (isNaN(val)) return sum;
                    const litersPerUnit = unit === 'ml' ? val / 1000 : val;
                    return sum + litersPerUnit * Number(item.quantity || 0);
                  }, 0);
                  return (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Liters</span>
                      <span>{totalLiters.toFixed(2)} L</span>
                    </div>
                  );
                })()}
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

      {/* Payment Dialog for POS */}
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        total={billForPayment?.total || 0}
        onConfirmPayment={handleConfirmPayment}
      />
     </div>
   );
 };

 export default Bills;

