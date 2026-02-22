import { useState, useMemo, useEffect } from "react";
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
  Monitor,
} from "lucide-react";
import { format } from "date-fns";
import { Bill } from "@/types/pos";
import api from '@/api/client';
import { PaymentDialog } from "@/components/pos/PaymentDialog";
import { printBillNewWindow } from "@/lib/billPrinter";
import { STORAGE_KEYS } from "@/utils/constants";
import LocalLoader from "@/components/common/LocalLoader";
import { Skeleton } from "@/components/ui/skeleton";

const Bills = () => {
  // Server-driven state
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [serverCard, setServerCard] = useState<any | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterToday, setFilterToday] = useState(false);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [terminalIdFilter, setTerminalIdFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoadingBill, setIsLoadingBill] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [billForPayment, setBillForPayment] = useState<Bill | null>(null);
  const itemsPerPage = 15;

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

  // Pagination values from server
  const totalPages = Math.max(1, Math.ceil((totalRecords || 0) / itemsPerPage));
  const paginatedBills = bills; // server already returns paginated page

  // Statistics - prefer server card summary when available
  const stats = useMemo(() => {
    const totalRevenue = serverCard ? Number(serverCard.totalRevenue || 0) : bills.reduce((sum, b) => sum + b.total, 0);
    const totalBills = serverCard ? serverCard.totalBills || totalRecords : totalRecords || bills.length;
    const cashBills = bills.filter((b) => b.paymentMethod === 'cash').length;
    const cardBills = bills.filter((b) => b.paymentMethod === 'card').length;
    const creditBills = bills.filter((b) => b.paymentMethod === 'credit').length;
    return { totalRevenue, totalBills, cashBills, cardBills, creditBills };
  }, [serverCard, bills, totalRecords]);

  // Clear all filters
  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setFilterToday(false);
    setPaymentMethodFilter('all');
    setTerminalIdFilter('all');
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Fetch bills from server (debounced for search)
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params: any = {
          page: currentPage,
          pageSize: itemsPerPage,
        };
        if (searchQuery) params.search = searchQuery;
        if (paymentMethodFilter && paymentMethodFilter !== 'all') params.paymentMethod = paymentMethodFilter.toUpperCase();
        if (filterToday) params.today = true;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

  const resp = await api.get('/bills', { params, signal: controller.signal, meta: { showLoader: 'local', loaderKey: 'bills' } });
        const respData = resp.data;
        const list = respData?.billsResponse?.data ?? respData?.data ?? [];
        const pagination = respData?.billsResponse?.pagination ?? {};
        const card = respData?.card ?? null;

        // Map backend DTOs to frontend Bill shape (shallow - items will be fetched when viewing)
        const mapped: Bill[] = (list as any[]).map((b: any) => ({
          id: b.id,
          billNumber: b.bill_number ?? b.billNo ?? undefined,
          items: new Array(b.item_count || 0).fill({} as any),
          subtotal: Number(b.total || 0) - Number(b.tax || 0),
          tax: b.tax !== undefined && b.tax !== null ? Number(b.tax) : 0,
          taxRate: 0,
          discount: 0,
          discountRate: 0,
          total: Number(b.total || 0),
          customerName: b.cashier_name ?? b.customer_name ?? undefined,
          customerPhone: undefined,
          paymentMethod: (String(b.payment_method || 'other').toLowerCase() as any),
          amountPaid: b.cash_given !== undefined && b.cash_given !== null ? Number(b.cash_given) : Number(b.total || 0),
          change: b.balance_given !== undefined && b.balance_given !== null ? Number(b.balance_given) : 0,
          creditDescription: b.credit_note ?? undefined,
          createdAt: b.date ? new Date(b.date) : new Date(b.createdAt),
        }));

        if (!cancelled) {
          setBills(mapped);
          setTotalRecords(pagination.totalRecords ?? respData?.total ?? 0);
          setServerCard(card);
        }
      } catch (err) {
        if (!cancelled) console.error('Failed to fetch bills', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchQuery, filterToday, dateFrom, dateTo, paymentMethodFilter, currentPage]);

  // Fetch bill details from backend and map to local shape used by this page
  const handleViewBill = async (bill: Bill) => {
    setIsLoadingBill(true);
    setSelectedBill(null);
    setIsViewDialogOpen(true);

    try {
      const resp = await api.get(`/bills/${encodeURIComponent(bill.id)}`);
      const data = resp.data?.data ?? resp.data;

      // If backend returns the detailed shape (dateTime, PaymentMethod, customer, creditNote, Items, Subtotal, Tax, Total)
      const detailed = data;

      if (detailed && detailed.Items) {
        // Map to the frontend Bill shape used in the modal
        const mappedItems = (detailed.Items || []).map((it: any) => {
          const qty = Math.abs(Number(it.quantity_moved || 0));
          // Use the price that was used for this sale (could be foreigner or local)
          const price = it.unit_price !== undefined && it.unit_price !== null
            ? Number(it.unit_price)
            : (it.foreigner_price !== undefined ? Number(it.foreigner_price) : 0);
          return {
            product: {
              id: it.productId || it.productId || 'unknown',
              name: it.name || it.productName || 'Unknown Product',
              category: it.categoryName || it.category || 'General',
              foreignerPrice: it.foreigner_price !== undefined ? Number(it.foreigner_price) : price,
              localPrice: it.local_price !== undefined ? Number(it.local_price) : price,
              cost: it.cost_price !== undefined && it.cost_price !== null ? Number(it.cost_price) : price * 0.7,
              stock: 0,
              minStock: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            quantity: qty,
            subtotal: +(price * qty),
          };
        });

        const subtotalNum = Number(detailed.Subtotal ?? mappedItems.reduce((s: number, it: any) => s + it.subtotal, 0));
        const taxNum = Number(detailed.Tax ?? 0);
        const totalNum = Number(detailed.Total ?? (subtotalNum + taxNum));

        const mappedBill = {
          id: detailed.id || bill.id,
          billNumber: detailed.bill_number || detailed.billNo || bill.billNumber,
          items: mappedItems,
          subtotal: subtotalNum,
          tax: taxNum,
          taxRate: mappedItems.length ? Math.round((taxNum / (subtotalNum || 1)) * 100) : 0,
          discount: 0,
          discountRate: 0,
          total: totalNum,
          customerName: detailed.cashier_name ?? detailed.customer ?? undefined,
          customerPhone: undefined,
          paymentMethod: (String(detailed.PaymentMethod || bill.paymentMethod || '').toLowerCase()),
          amountPaid: detailed.PaymentMethod && String(detailed.PaymentMethod).toLowerCase() === 'credit' ? 0 : totalNum,
          change: 0,
          creditDescription: detailed.creditNote ?? undefined,
          createdAt: detailed.dateTime ? new Date(detailed.dateTime) : bill.createdAt,
        };

        setSelectedBill(mappedBill);
      } else {
        // Fallback - use the existing mock bill data
        setSelectedBill(bill);
      }
    } catch (err) {
      console.error('Failed to fetch bill details', err);
      // Fallback to mock bill
      setSelectedBill(bill);
    } finally {
      setIsLoadingBill(false);
    }
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

  const handleConfirmPayment = (
    paymentMethod: 'cash' | 'card' | 'credit' | 'other',
    amountPaid: number,
    creditDescription?: string
  ) => {
    if (!billForPayment) return;
    const now = new Date();
    const change = paymentMethod === 'credit' ? 0 : amountPaid - billForPayment.total;
    // Persist payment update to backend
    (async () => {
      try {
        const payload: any = {
          payment_method: paymentMethod.toUpperCase(),
          cash_given: paymentMethod === 'credit' ? 0 : amountPaid,
          balance_given: paymentMethod === 'credit' ? 0 : Math.max(0, change),
          credit_note: paymentMethod === 'credit' ? (creditDescription || null) : null,
          customer_name: billForPayment.customerName || null,
        };
        await api.patch(`/bills/${encodeURIComponent(billForPayment.id)}/payment`, payload);
        // Optimistically update list UI
        setBills((prev) => prev.map((b) => b.id === billForPayment.id ? {
          ...b,
          paymentMethod,
          amountPaid,
          change: Math.max(0, change),
          creditDescription: paymentMethod === 'credit' ? (creditDescription || null as any) : null as any,
        } : b));
      } catch (e) {
        console.error('Failed updating bill payment, proceeding to print locally', e);
      }
      const printable: Bill = {
        id: billForPayment.id,
        items: billForPayment.items,
        subtotal: billForPayment.subtotal,
        tax: billForPayment.tax,
        taxRate: billForPayment.taxRate,
        discount: billForPayment.discount ?? 0,
        discountRate: billForPayment.discountRate ?? 0,
        total: billForPayment.total,
        customerName: billForPayment.customerName,
        customerPhone: billForPayment.customerPhone,
        paymentMethod,
        amountPaid,
        change,
        creditDescription,
        createdAt: now,
      };
      printBillNewWindow(printable);
      setIsPaymentDialogOpen(false);
      setBillForPayment(null);
    })();
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

      {/* Statistics Cards with Loader */}
      <LocalLoader
        loaderKey="bills"
        renderSkeleton={() => (
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
        )}
      >
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
      </LocalLoader>

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

            {/* Terminal ID */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Terminal ID</Label>
              <Select value={terminalIdFilter} onValueChange={setTerminalIdFilter}>
                <SelectTrigger className="h-9 md:h-10">
                  <SelectValue placeholder="All Terminals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terminals</SelectItem>
                  {/* Terminal options will be populated from API later */}
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
          <LocalLoader loaderKey="bills">
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
          </LocalLoader>

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
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Bill Details
            </DialogTitle>
            <DialogDescription>
              {selectedBill?.billNumber || selectedBill?.id}
            </DialogDescription>
          </DialogHeader>

          {isLoadingBill ? (
            <div className="py-8 flex items-center justify-center">
              <div>Loading bill...</div>
            </div>
          ) : selectedBill ? (
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
                      {selectedBill.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.product.name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">Rs.{item.product.foreignerPrice?.toFixed(2) ?? '0.00'}</TableCell>
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
          ) : (
            <div className="py-8 text-center text-muted-foreground">No bill selected</div>
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

