import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileDown, AlertTriangle } from "lucide-react";
import { AddInvoiceDialog } from "@/components/invoices/AddInvoiceDialog";
import { InvoiceFiltersComponent } from "@/components/invoices/InvoiceFilters";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { Invoice, InvoiceFilters } from "@/types/invoice";
import api from '@/api/client';
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { authService } from "@/api/services/authService";
import LocalLoader from "@/components/common/LocalLoader";

// API response shapes from backend for invoices and nested products
interface ApiProduct {
  productId: string;
  name?: string;
  category?: string;
  categoryName?: string;
  quantity_moved?: number;
  selling_price?: number;
  cost_price?: number;
  // Optional size fields from backend used for CSV export
  litres?: number | null;
  bottle_volume?: string | null;
}

interface ApiInvoice {
  id: string;
  in_number: string;
  invoiceDate: string | Date;
  subtotal?: number;
  discount?: number;
  paid_status?: 'PAID' | 'PENDING';
  createdAt: string | Date;
  updatedAt: string | Date;
  products?: ApiProduct[];
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [serverStats, setServerStats] = useState<{ totalInvoices: number; paidInvoices: number; pendingInvoices: number; totalCost: number } | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [serverTotalPages, setServerTotalPages] = useState(1);

  // Password confirmation state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingDeleteInvoice, setPendingDeleteInvoice] = useState<Invoice | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Open password confirmation after the initial "Are you sure" prompt
  const requestDeleteInvoice = (invoice: Invoice) => {
    setPendingDeleteInvoice(invoice);
    setDeletePassword("");
    setIsDeleteConfirmOpen(true);
  };

  // Confirm deletion by verifying the logged-in user's password, then delete
  const confirmDeleteWithPassword = async () => {
    if (!pendingDeleteInvoice) return;
    setIsConfirmingDelete(true);
    try {
      const me = await authService.me();
      const email = me?.email;
      if (!email) throw new Error('Missing user email');
      await authService.login({ email, password: deletePassword });

      // password verified, perform deletion
      const invoice = pendingDeleteInvoice;
      if (invoice.id) {
        await api.delete(`/invoices/${invoice.id}`);
      } else {
        await api.delete(`/invoices`, { data: { in_number: invoice.invoiceNumber } });
      }
      toast.success('Invoice deleted');
      setIsDeleteConfirmOpen(false);
      setPendingDeleteInvoice(null);
      setDeletePassword("");
      await fetchInvoices(currentPage, itemsPerPage);
    } catch (err) {
      console.error('Delete confirmation failed', err);
      toast.error('Invalid password or delete failed');
    } finally {
      setIsConfirmingDelete(false);
    }
  };

  // Download CSV for invoices: fetch all filtered rows (no pagination) and build two-section CSV
  const downloadInvoicesCSV = useCallback(async () => {
    try {
      const params: string[] = [];
      params.push(`page=1`);
      params.push(`limit=${itemsPerPage}`); // ignored when noPagination=true
      if (filters.invoiceNumber) params.push(`search=${encodeURIComponent(filters.invoiceNumber)}`);
      if (filters.category) params.push(`category=${encodeURIComponent(filters.category)}`);
      if (typeof filters.month === 'number') params.push(`month=${filters.month}`);
      if (typeof filters.year === 'number') params.push(`year=${filters.year}`);
      if (filters.dateFrom) params.push(`dateFrom=${encodeURIComponent(filters.dateFrom.toISOString())}`);
      if (filters.dateTo) params.push(`dateTo=${encodeURIComponent(filters.dateTo.toISOString())}`);
      params.push(`noPagination=true`);

    const qs = params.join('&');
    const res = await api.get(`/invoices/with-products?${qs}`, { meta: { showLoader: 'local', loaderKey: 'invoices' } });
    const all: ApiInvoice[] = res.data?.tableResponse?.data ?? res.data?.data ?? [];

      // Flatten product rows with required columns
      type Row = { date: string; category: string; product: string; quantity: number; sellingPrice: number; costPrice: number; bottleVolume: string; litersPerUnit: number };
      const rows: Row[] = [];

      for (const inv of all) {
        const invDate = inv.invoiceDate ? new Date(inv.invoiceDate) : new Date();
        for (const p of (inv.products || [])) {
          const qty = Number(p.quantity_moved ?? 0);
          const sp = Number(p.selling_price ?? 0);
          const cp = Number(p.cost_price ?? 0);
          const litresRaw = p.litres !== undefined && p.litres !== null ? Number(p.litres) : 0 as number;
          const unit = String(p.bottle_volume ?? '').toUpperCase();
          const bottleVolume = `${litresRaw} ${unit.toLowerCase()}`;
          const litersPerUnit = unit === 'ML' ? litresRaw / 1000 : litresRaw;
          rows.push({
            date: format(invDate, 'yyyy-MM-dd'),
            category: p.categoryName ?? 'Uncategorized',
            product: p.name ?? '',
            quantity: qty,
            sellingPrice: sp,
            costPrice: cp,
            bottleVolume,
            litersPerUnit,
          });
        }
      }

      const detailsHeaders = [
        'Date',
        'Category',
        'Product Name',
        'Quantity',
        'Selling Price',
        'Cost Price',
        'Bottle Volume',
      ];

      const detailsData = rows.map(r => [
        r.date,
        r.category,
        r.product,
        String(r.quantity),
        r.sellingPrice.toFixed(2),
        r.costPrice.toFixed(2),
        r.bottleVolume,
      ]);

      // Build category summary
      type Agg = { volumeL: number; selling: number; cost: number };
      const byCat = new Map<string, Agg>();
      for (const r of rows) {
        const a = byCat.get(r.category) ?? { volumeL: 0, selling: 0, cost: 0 };
        a.volumeL += r.quantity * r.litersPerUnit;
        a.selling += r.quantity * r.sellingPrice;
        a.cost += r.quantity * r.costPrice;
        byCat.set(r.category, a);
      }

      const summaryHeaders = ['Category', 'Total Volume (L)', 'Total Selling Price', 'Total Cost Price', 'Profit'];
      const summaryRows: string[][] = [];
      let totalVol = 0, totalSell = 0, totalCost = 0;
      for (const [cat, a] of Array.from(byCat.entries()).sort((a,b)=>a[0].localeCompare(b[0]))) {
        totalVol += a.volumeL; totalSell += a.selling; totalCost += a.cost;
        summaryRows.push([cat, a.volumeL.toFixed(2), a.selling.toFixed(2), a.cost.toFixed(2), (a.selling - a.cost).toFixed(2)]);
      }
      const grandRow = ['TOTAL', totalVol.toFixed(2), totalSell.toFixed(2), totalCost.toFixed(2), (totalSell - totalCost).toFixed(2)];

      const csvParts: string[] = [];
      csvParts.push(detailsHeaders.join(','));
      csvParts.push(...detailsData.map(row => row.map(cell => `"${cell}"`).join(',')));
      csvParts.push('');
      csvParts.push('Category Summary');
      csvParts.push(summaryHeaders.join(','));
      csvParts.push(...summaryRows.map(row => row.map(cell => `"${cell}"`).join(',')));
      csvParts.push(grandRow.map(cell => `"${cell}"`).join(','));

      // Product + Bottle Size Summary (total quantity of each product-bottle combination)
      const productBottleHeaders = ['Product', 'Bottle Size', 'Total Quantity', 'Total Selling Price', 'Total Cost Price', 'Profit'];
      const byProductBottle = new Map<string, { product: string; bottle: string; qty: number; selling: number; cost: number }>();
      for (const r of rows) {
        const key = `${r.product}||${r.bottleVolume}`;
        const cur = byProductBottle.get(key) ?? { product: r.product, bottle: r.bottleVolume, qty: 0, selling: 0, cost: 0 };
        cur.qty += r.quantity;
        cur.selling += r.quantity * r.sellingPrice;
        cur.cost += r.quantity * r.costPrice;
        byProductBottle.set(key, cur);
      }
      const productBottleRows = Array.from(byProductBottle.values())
        .sort((a, b) => a.product.localeCompare(b.product) || a.bottle.localeCompare(b.bottle))
        .map(({ product, bottle, qty, selling, cost }) => [
          product,
          bottle,
          String(qty),
          selling.toFixed(2),
          cost.toFixed(2),
          (selling - cost).toFixed(2),
        ]);

      csvParts.push('');
      csvParts.push('Product + Bottle Size Summary');
      csvParts.push(productBottleHeaders.join(','));
      csvParts.push(...productBottleRows.map(row => row.map(cell => `"${cell}"`).join(',')));

      const csvContent = csvParts.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export invoices CSV', err);
      toast.error('Failed to export CSV');
    }
  }, [filters, itemsPerPage]);

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
    const res = await api.get(`/invoices/with-products?${qs}`, { meta: { showLoader: 'local', loaderKey: 'invoices' } });
    const payload = res.data;
    const data: ApiInvoice[] = payload.tableResponse?.data || payload.data || [];
      const mapped: Invoice[] = data.map((inv: ApiInvoice) => {
        const items = (inv.products || []).map((p: ApiProduct) => {
          const unit = Number(p.selling_price ?? p.cost_price ?? 0);
          const cost = p.cost_price !== undefined && p.cost_price !== null ? Number(p.cost_price) : undefined;
          const qty = Number(p.quantity_moved ?? 0);
          const litresRaw = p.litres !== undefined && p.litres !== null ? Number(p.litres) : 0;
          const unitKey = String(p.bottle_volume ?? '').toUpperCase();
          const litersPerUnit = unitKey === 'ML' ? litresRaw / 1000 : litresRaw;
          const bottleVolume = litresRaw ? `${litresRaw} ${unitKey.toLowerCase()}` : undefined;
          return {
            productId: p.productId,
            productName: p.name ?? '',
            category: p.category ?? p.categoryName ?? 'Uncategorized',
            quantity: qty,
            unitPrice: unit,
            costPrice: cost,
            total: unit * qty,
            litersPerUnit,
            bottleVolume,
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
          // API stores discount as an amount; UI components can derive percentage from subtotal
          discount: Number(inv.discount ?? 0),
          total: Number(inv.subtotal ?? 0) - Number(inv.discount ?? 0),
          paymentMethod: 'cash',
          status: String(inv.paid_status ?? 'PENDING').toLowerCase() as 'paid' | 'pending' | 'cancelled',
          createdAt: new Date(inv.createdAt),
          updatedAt: new Date(inv.updatedAt),
        };
      });

      setInvoices(mapped);
      // Set server stats if provided
      if (payload.cardResponse) {
        const cr = payload.cardResponse;
        setServerStats({
          totalInvoices: Number(cr.totalInvoices ?? mapped.length),
          paidInvoices: Number(cr.paidInvoices ?? mapped.filter(inv => inv.status === 'paid').length),
          pendingInvoices: Number(cr.pendingInvoices ?? mapped.filter(inv => inv.status === 'pending').length),
          totalCost: Number(cr.totalCost ?? 0),
        });
      } else {
        setServerStats(null);
      }
      const total = Number(payload.tableResponse?.pagination?.totalRecords ?? payload.total ?? mapped.length);
      const pageLimit = Number(payload.tableResponse?.pagination?.pageSize ?? payload.limit ?? limit);
      const computedTotalPages = Math.max(1, Math.ceil(total / pageLimit));
      setServerTotalPages(computedTotalPages);
      // Update currentPage to match what we requested (the `page` argument)
      setCurrentPage(page);
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
  }, [itemsPerPage, filters.invoiceNumber, filters.category, filters.month, filters.year, filters.dateFrom, filters.dateTo]);

  // initial load - only run once on mount
  useEffect(() => {
    fetchInvoices(1, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Extract unique categories from invoices (for filter dropdown)
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    invoices.forEach(invoice => {
      invoice.items.forEach(item => categorySet.add(item.category));
    });
    return Array.from(categorySet).sort();
  }, [invoices]);

  // Server paginates; display as-is
  const filteredInvoices = useMemo(() => invoices, [invoices]);

  // Reset to page 1 when filters change and re-fetch
  useEffect(() => {
    // Skip on initial mount (handled by initial load effect)
    setCurrentPage(1);
    fetchInvoices(1, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.invoiceNumber, filters.category, filters.month, filters.year, filters.dateFrom, filters.dateTo]);

  // Statistics (updated)
  const stats = useMemo(() => {
    if (serverStats) {
      return {
        totalInvoices: serverStats.totalInvoices,
        totalRevenue: filteredInvoices.reduce((sum, inv) => sum + inv.total, 0), // keep local revenue if needed
        totalCost: serverStats.totalCost,
        pendingCount: serverStats.pendingInvoices,
        paidCount: serverStats.paidInvoices,
      };
    }
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalCost = filteredInvoices.reduce((sum, inv) => {
      const invCost = inv.items.reduce((s, item) => s + (item.costPrice ?? 0) * item.quantity, 0);
      return sum + invCost;
    }, 0);
    const pendingCount = filteredInvoices.filter(inv => inv.status === 'pending').length;
    const paidCount = filteredInvoices.filter(inv => inv.status === 'paid').length;
    return {
      totalInvoices: filteredInvoices.length,
      totalRevenue,
      totalCost,
      pendingCount,
      paidCount,
    };
  }, [filteredInvoices, serverStats]);

  // Dates with no invoices (helper)
  const getDatesWithNoInvoices = () => {
    if (!filters.month || !filters.year) return [] as number[];
    const daysInMonth = new Date(filters.year, filters.month + 1, 0).getDate();
    const datesWithInvoices = new Set(filteredInvoices.map(inv => inv.date.getDate()));
    const missing: number[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      if (!datesWithInvoices.has(day)) missing.push(day);
    }
    return missing;
  };

  const missingDates = getDatesWithNoInvoices();

  // Handler to mark invoice as paid
  const handleMarkPaid = async (invoice: Invoice) => {
    try {
      if (!invoice.id) throw new Error('Missing invoice id');
      await api.put(`/invoices/${invoice.id}`, { paid_status: 'PAID' }, { meta: { showLoader: 'local', loaderKey: 'invoices' } });
      toast.success(`Invoice ${invoice.invoiceNumber} marked as paid`);
      await fetchInvoices(currentPage, itemsPerPage);
    } catch (err) {
      console.error('Failed to mark as paid', err);
      toast.error('Failed to mark invoice as paid');
    }
  };

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
          <Button variant="outline" onClick={downloadInvoicesCSV}>
            <FileDown className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
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
        {/* Pending Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        {/* Paid Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paidCount}</div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>
        {/* Total Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {stats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Sum of item costs</p>
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
          <LocalLoader loaderKey="invoices">
          <InvoiceTable
            invoices={filteredInvoices}
            currentPage={currentPage}
            totalPages={serverTotalPages}
            onPageChange={(p) => {
               const clamped = Math.max(1, Math.min(p, serverTotalPages));
               setCurrentPage(clamped);
               fetchInvoices(clamped, itemsPerPage);
             }}
            onEdit={(inv) => {
              setEditingInvoice(inv);
              setIsAddDialogOpen(true);
            }}
            onDelete={requestDeleteInvoice}
            onMarkPaid={handleMarkPaid}
            />
          </LocalLoader>
        </CardContent>
      </Card>

      {/* Add Invoice Dialog */}
      <AddInvoiceDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingInvoice(null);
        }}
        invoiceToEdit={editingInvoice}
        onCreated={() => fetchInvoices(currentPage, itemsPerPage)}
        onUpdated={() => fetchInvoices(currentPage, itemsPerPage)}
      />

      {/* Delete confirmation modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={(open) => { setIsDeleteConfirmOpen(open); if (!open) { setPendingDeleteInvoice(null); setDeletePassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p>Enter your password to delete invoice {pendingDeleteInvoice?.invoiceNumber}.</p>
            <Input type="password" placeholder="Password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={!deletePassword || isConfirmingDelete} onClick={confirmDeleteWithPassword}>
              {isConfirmingDelete ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
