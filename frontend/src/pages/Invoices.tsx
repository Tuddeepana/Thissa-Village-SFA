import { useState, useMemo } from "react";
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
import { mockInvoices } from "@/lib/invoiceData";
import { Invoice, InvoiceFilters, LowStockItem } from "@/types/invoice";
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
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extract unique categories from invoices
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    invoices.forEach(invoice => {
      invoice.items.forEach(item => categorySet.add(item.category));
    });
    return Array.from(categorySet).sort();
  }, [invoices]);

  // Filter invoices based on active filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Invoice Number filter
      if (filters.invoiceNumber && !invoice.invoiceNumber.toLowerCase().includes(filters.invoiceNumber.toLowerCase())) {
        return false;
      }

      // Date Range filter
      if (filters.dateFrom && invoice.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && invoice.date > filters.dateTo) {
        return false;
      }

      // Month filter
      if (filters.month !== undefined && invoice.date.getMonth() !== filters.month) {
        return false;
      }

      // Year filter
      if (filters.year !== undefined && invoice.date.getFullYear() !== filters.year) {
        return false;
      }

      // Category filter
      if (filters.category) {
        const hasCategory = invoice.items.some(item => item.category === filters.category);
        if (!hasCategory) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleAddInvoice = (invoiceNumber: string, date: Date) => {
    // Create a new invoice with minimal data
    const newInvoice: Invoice = {
      id: `inv-${Math.random().toString(36).substr(2, 9)}`,
      invoiceNumber,
      date,
      customerName: "New Customer",
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      paymentMethod: "cash",
      status: "pending",
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
    // Mock low stock data for demonstration
    const lowStockItems: LowStockItem[] = [
      {
        productId: "prod-001",
        productName: "Coca Cola",
        category: "Beverages",
        currentStock: 5,
        minStock: 20,
        reorderQuantity: 50,
      },
      {
        productId: "prod-002",
        productName: "Bread",
        category: "Bakery",
        currentStock: 8,
        minStock: 15,
        reorderQuantity: 30,
      },
      {
        productId: "prod-003",
        productName: "Milk",
        category: "Dairy",
        currentStock: 3,
        minStock: 25,
        reorderQuantity: 40,
      },
    ];

    if (format === 'pdf') {
      generateLowStockPDF(lowStockItems);
    } else {
      generateLowStockExcel(lowStockItems);
    }
    
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
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Add Invoice Dialog */}
      <AddInvoiceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddInvoice}
      />
    </div>
  );
};

export default Invoices;
