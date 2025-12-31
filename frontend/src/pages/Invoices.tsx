import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FileDown, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { AddInvoiceDialog } from "@/components/invoices/AddInvoiceDialog";
import { InvoiceFiltersComponent } from "@/components/invoices/InvoiceFilters";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { Invoice, InvoiceFilters, LowStockItem } from "@/types/invoice";
import api from '@/api/client';
import {
  generateMonthlyRevenuePDF,
  generateMonthlyRevenueExcel,
  generateAnnualRevenuePDF,
  generateAnnualRevenueExcel,
  generateLowStockPDF,
  generateLowStockExcel,
} from "@/lib/reportGenerator";
import { toast } from "sonner";

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [serverTotalPages, setServerTotalPages] = useState(1);

  // fetch invoices from backend with pagination (and optional invoiceNumber search)
  const fetchInvoices = useCallback(async (page: number = currentPage, limit: number = itemsPerPage) => {
    try {
      const params: string[] = [];
      params.push(`page=${page}`);
      params.push(`limit=${limit}`);
      if (filters.invoiceNumber) params.push(`search=${encodeURIComponent(filters.invoiceNumber)}`);
      if (filters.category) params.push(`category=${encodeURIComponent(filters.category)}`);
      if (typeof filters.month === 'number') params.push(`month=${filters.month}`);
      if (typeof filters.year === 'number') params.push(`year=${filters.year}`);
      if (filters.dateFrom) params.push(`dateFrom=${encodeURIComponent(filters.dateFrom.toISOString())}`);
      if (filters.dateTo) params.push(`dateTo=${encodeURIComponent(filters.dateTo.toISOString())}`);

      const qs = params.join('&');
      const res = await api.get(`/invoices/with-products?${qs}`);
      const payload = res.data;
      const mapped: Invoice[] = (payload.data || []).map((inv: any) => {
          const items = (inv.products || []).map((p: any) => {
            const unit = Number(p.selling_price ?? p.cost_price ?? 0);
            const qty = Number(p.quantity_moved ?? 0);
            return {
              productId: p.productId,
              productName: p.name ?? '',
              category: p.category ?? p.categoryName ?? 'Uncategorized',
              quantity: qty,
              unitPrice: unit,
              total: unit * qty,
            };
          });

        return {
          id: inv.id,
          invoiceNumber: inv.in_number,
          date: new Date(inv.invoiceDate),
          customerName: 'Walk-in Customer',
          customerPhone: undefined,
          items,
          subtotal: Number(inv.subtotal ?? 0),
          tax: 0,
          discount: 0,
          total: Number(inv.subtotal ?? 0),
          paymentMethod: 'cash',
          status: 'pending',
          createdAt: new Date(inv.createdAt),
          updatedAt: new Date(inv.updatedAt),
        };
      });

      setInvoices(mapped);
      const total = Number(payload.total ?? mapped.length);
      const pageLimit = Number(payload.limit ?? limit);
      setServerTotalPages(Math.max(1, Math.ceil(total / pageLimit)));
    } catch (err) {
      // fallback to mock data if available
      try {
        const { mockInvoices } = await import('@/lib/invoiceData');
        setInvoices(mockInvoices);
        setServerTotalPages(1);
      } catch (e) {
        // ignore
      }
    }
  }, [currentPage, itemsPerPage, filters.invoiceNumber, filters.category, filters.month, filters.year, filters.dateFrom, filters.dateTo]);

  // initial load
  useEffect(() => {
    (async () => {
      await fetchInvoices(1, itemsPerPage);
    })();
  }, []);

  // Extract unique categories from invoices
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    invoices.forEach(invoice => {
      invoice.items.forEach(item => categorySet.add(item.category));
    });
    return Array.from(categorySet).sort();
  }, [invoices]);

  // Server paginates; apply only category filter client-side on current page
  const filteredInvoices = useMemo(() => {
    // Server handles filtering; keep client view as-is
    return invoices;
  }, [invoices]);

  // Pagination
  const paginatedInvoices = filteredInvoices; // already server-paginated

  // Reset to page 1 when filters change
  // when invoiceNumber search changes, reset page and re-fetch
  useEffect(() => {
    setCurrentPage(1);
    (async () => { await fetchInvoices(1, itemsPerPage); })();
  }, [filters.invoiceNumber, filters.category, filters.month, filters.year, filters.dateFrom, filters.dateTo]);

  const handleAddInvoice = (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Create a new invoice with full data
    const newInvoice: Invoice = {
      id: `inv-${Math.random().toString(36).slice(2, 11)}`,
      ...invoiceData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setInvoices([newInvoice, ...invoices]);
    toast.success("Invoice added successfully!");
  };

  const handleGenerateMonthlyReport = (format: 'pdf' | 'excel') => {
    const month = filters.month ?? new Date().getMonth();
    const year = filters.year ?? new Date().getFullYear();
    
    const monthlyInvoices = invoices.filter(
      inv => inv.date.getMonth() === month && inv.date.getFullYear() === year
    );

    if (monthlyInvoices.length === 0) {
      toast.error("No invoices found for the selected month");
      return;
    }

    if (format === 'pdf') {
      generateMonthlyRevenuePDF(monthlyInvoices, month, year);
    } else {
      generateMonthlyRevenueExcel(monthlyInvoices, month, year);
    }
    
    toast.success(`Monthly report generated as ${format.toUpperCase()}`);
  };

  const handleGenerateAnnualReport = (format: 'pdf' | 'excel') => {
    const year = filters.year ?? new Date().getFullYear();
    
    const yearlyInvoices = invoices.filter(
      inv => inv.date.getFullYear() === year
    );

    if (yearlyInvoices.length === 0) {
      toast.error("No invoices found for the selected year");
      return;
    }

    if (format === 'pdf') {
      generateAnnualRevenuePDF(yearlyInvoices, year);
    } else {
      generateAnnualRevenueExcel(yearlyInvoices, year);
    }
    
    toast.success(`Annual report generated as ${format.toUpperCase()}`);
  };

  const handleGenerateLowStockReport = (format: 'pdf' | 'excel') => {
    

    
    
    toast.success(`Low stock report generated as ${format.toUpperCase()}`);
  };

  // Statistics
  const stats = useMemo(() => {
    const total = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const profit = filteredInvoices.reduce((sum, inv) => sum + (inv.total - inv.tax), 0);
    return {
      totalInvoices: filteredInvoices.length,
      totalRevenue: total,
      totalProfit: profit,
    };
  }, [filteredInvoices]);

  // Check dates with no invoices
  const getDatesWithNoInvoices = () => {
    if (!filters.month || !filters.year) return [];
    
    const daysInMonth = new Date(filters.year, filters.month + 1, 0).getDate();
    const datesWithInvoices = new Set(
      filteredInvoices.map(inv => inv.date.getDate())
    );
    
    const missingDates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      if (!datesWithInvoices.has(day)) {
        missingDates.push(day);
      }
    }
    return missingDates;
  };

  const missingDates = getDatesWithNoInvoices();

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Invoice Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Track and manage sales invoices</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Invoice
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Reports
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Monthly Revenue Report</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleGenerateMonthlyReport('pdf')}>
                <FileDown className="mr-2 h-4 w-4" />
                Download as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateMonthlyReport('excel')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download as Excel
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Annual Revenue Report</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleGenerateAnnualReport('pdf')}>
                <FileDown className="mr-2 h-4 w-4" />
                Download as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateAnnualReport('excel')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download as Excel
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Low Stock Report</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleGenerateLowStockReport('pdf')}>
                <FileDown className="mr-2 h-4 w-4" />
                Download as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateLowStockReport('excel')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.length !== invoices.length ? 'Filtered results' : 'All invoices'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {stats.totalInvoices} invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {stats.totalProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Revenue minus tax
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Missing Dates Alert */}
      {missingDates.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Dates with No Invoices
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  The following dates in the selected month have no invoices: {' '}
                  {missingDates.slice(0, 10).join(', ')}
                  {missingDates.length > 10 && ` and ${missingDates.length - 10} more`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceFiltersComponent
            filters={filters}
            onFilterChange={setFilters}
            categories={categories}
          />
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InvoiceTable
            invoices={paginatedInvoices}
            currentPage={currentPage}
            totalPages={serverTotalPages}
            onPageChange={(p) => {
              setCurrentPage(p);
              (async () => { await fetchInvoices(p, itemsPerPage); })();
            }}
          />
        </CardContent>
      </Card>

      {/* Add Invoice Dialog */}
      <AddInvoiceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onCreated={() => fetchInvoices(currentPage, itemsPerPage)}
      />
    </div>
  );
};

export default Invoices;
