import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Download, Search, Package, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/api/client";
import { categoryService } from '@/api/services/categoryService';
import type { Category } from '@/types/category.types';
import type { MyStockResponse, MyStockTableRow } from "@/types/mystock";
import { format } from "date-fns";

const MyStock = () => {
  const [searchProduct, setSearchProduct] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const ALL_CATEGORY_VALUE = 'ALL_CATEGORIES';
  const ALL_STOCK_VALUE = 'ALL_STOCK';
  const [stockFilter, setStockFilter] = useState<string>(ALL_STOCK_VALUE);
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 20;

  // Server data
  const [rows, setRows] = useState<MyStockTableRow[]>([]);
  const [cards, setCards] = useState<MyStockResponse['cardResponse'] | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch data from server when filters/pagination change
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      // fetch
      try {
        const res = await api.get<MyStockResponse>(
          '/mystock',
          {
            params: {
              page: currentPage,
              pageSize: itemsPerPage,
              productName: searchProduct || undefined,
              categoryId: categoryId || undefined,
              status: stockFilter === ALL_STOCK_VALUE ? undefined : stockFilter,
            },
          }
        );
        if (cancelled) return;
        const data = res.data;
        setCards(data.cardResponse ?? null);
        const serverRows: MyStockTableRow[] = data.tableResponse?.data ?? [];
        // convert lastUpdatedAt to Date for UI formatting
        setRows(serverRows.map((r) => ({ ...r, lastUpdatedAt: r.lastUpdatedAt } as MyStockTableRow)));
        setTotalPages(data.tableResponse.pagination.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch mystock', err);
      } finally {
        // done
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [currentPage, itemsPerPage, searchProduct, categoryId, stockFilter]);

  // Fetch categories for dropdown
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { categories } = await categoryService.list({ page: 1, limit: 100 });
        if (!mounted) return;
        setCategories(categories || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Apply client-side item name filter on server rows
  const filteredItems = useMemo<MyStockTableRow[]>(() => {
    return rows.filter((item) => {
      if (searchProduct && !item.productName.toLowerCase().includes(searchProduct.toLowerCase())) return false;
      // category and status filtering are handled server-side
      return true;
    });
  }, [rows, searchProduct]);

  // Reset to page 1 when server-side filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchProduct, itemsPerPage, categoryId, stockFilter]);

  // Pagination (use server pagination values where possible)
  const paginatedItems = useMemo<(MyStockTableRow & { lastUpdated: Date })[]>(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageSlice = filteredItems.slice(startIndex, startIndex + itemsPerPage);
    return pageSlice.map((r) => ({
      ...r,
      lastUpdated: r.lastUpdatedAt ? new Date(r.lastUpdatedAt) : new Date(),
    } as MyStockTableRow & { lastUpdated: Date }));
  }, [filteredItems, currentPage, itemsPerPage]);

  // Use server-provided card stats when available, otherwise compute client-side fallback
  const stats = useMemo(() => {
    if (cards) return { totalItems: cards.totalItems, totalQuantity: cards.totalQuantity, lowStockItems: cards.lowStockItems, outOfStock: cards.outOfStockItems };
    const totalItems = filteredItems.length;
    const totalQuantity = filteredItems.reduce((sum, item) => sum + item.availableQuantity, 0);
    const lowStockItems = filteredItems.filter((item) => item.availableQuantity <= item.minStock).length;
    const outOfStock = filteredItems.filter((item) => item.availableQuantity === 0).length;
    return { totalItems, totalQuantity, lowStockItems, outOfStock };
  }, [cards, filteredItems]);

  // Download CSV function
  const downloadCSV = () => {
    const headers = [
      "Item ID",
      "Product Name",
      "Bottle Size",
      "Category",
      "Available Quantity",
      "Min Stock",
      "Status",
      "Last Updated",
    ];

    const csvData = filteredItems.map((item) => [
      item.productId,
      item.productName,
      item.bottle_size ?? '',
      item.category?.name ?? '',
      item.availableQuantity.toString(),
      item.minStock?.toString() ?? '',
      item.availableQuantity === 0 ? "Out of Stock" : item.availableQuantity <= item.minStock ? "Low Stock" : "In Stock",
      format(item.lastUpdatedAt ? new Date(item.lastUpdatedAt) : new Date(), "yyyy-MM-dd HH:mm:ss"),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `my-stock-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    // modern remove
    link.remove();
  };

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity <= minStock) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  const clearFilters = () => {
    setSearchProduct("");
    setCategoryId(undefined);
    setStockFilter(ALL_STOCK_VALUE);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">My Stock</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View and manage your inventory stock levels
          </p>
        </div>
        <Button onClick={downloadCSV} className="gap-2 h-9 md:h-10 text-sm" size="sm">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download</span> CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardHeader className="p-3 md:pb-2 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 md:pb-2 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Quantity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.totalQuantity}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 md:pb-2 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-yellow-600">
              {stats.lowStockItems}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 md:pb-2 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-red-600">
              {stats.outOfStock}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Search className="h-4 w-4 md:h-5 md:w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="searchProduct" className="text-xs md:text-sm">Product Name</Label>
              <Input
                id="searchProduct"
                placeholder="Search product..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="h-9 md:h-10"
              />
            </div>
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="categorySelect" className="text-xs md:text-sm">Category</Label>
              <Select value={categoryId ?? ALL_CATEGORY_VALUE} onValueChange={(val) => setCategoryId(val === ALL_CATEGORY_VALUE ? undefined : val)}>
                <SelectTrigger id="categorySelect" className="h-9 md:h-10">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORY_VALUE}>All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Stock Filter</Label>
              <Select value={stockFilter} onValueChange={(v) => setStockFilter(v)}>
                <SelectTrigger className="h-9 md:h-10">
                  <SelectValue placeholder="Select filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STOCK_VALUE}>All Stock</SelectItem>
                  <SelectItem value={'LowStock'}>Low Stock</SelectItem>
                  <SelectItem value={'OutOfStock'}>Out Of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs md:text-sm hidden md:block">&nbsp;</Label>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full h-9 md:h-10 mt-0 md:mt-0"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg flex flex-wrap items-center gap-2">
            <Package className="h-4 w-4 md:h-5 md:w-5" />
            <span>Stock Items ({filteredItems.length})</span>
            {totalPages > 1 && (
              <span className="text-xs md:text-sm font-normal text-muted-foreground">
                - Page {currentPage} of {totalPages}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Bottle Size</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Available Qty</TableHead>
                  <TableHead className="text-center">Min Stock</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Package className="h-12 w-12" />
                        <p>No stock items found</p>
                        <p className="text-sm">
                          Try adjusting your filters
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">
                        {item.productName}
                      </TableCell>
                      <TableCell>{item.bottle_size ?? ''}</TableCell>
                      <TableCell>{item.category?.name ?? ''}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-semibold ${
                            item.availableQuantity === 0
                              ? "text-red-600"
                              : item.availableQuantity <= item.minStock
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {item.availableQuantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.minStock}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStockStatus(item.availableQuantity, item.minStock)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(item.lastUpdatedAt ? new Date(item.lastUpdatedAt) : new Date(), "MMM dd, yyyy")}
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
            {paginatedItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
                <Package className="h-12 w-12" />
                <p>No stock items found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              paginatedItems.map((item) => (
                <div
                  key={item.productId}
                  className="border rounded-lg p-3 space-y-2 bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-sm">{item.productName}</h3>
                      <p className="text-xs text-muted-foreground">{item.category?.name ?? ''}</p>
                      {item.bottle_size && (
                        <p className="text-xs text-muted-foreground">{item.bottle_size}</p>
                      )}
                    </div>
                    {getStockStatus(item.availableQuantity, item.minStock)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p className={`font-semibold ${item.availableQuantity === 0 ? 'text-red-600' : item.availableQuantity <= item.minStock ? 'text-yellow-600' : 'text-green-600'}`}>{item.availableQuantity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Min Stock</p>
                      <p className="font-semibold">{item.minStock}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Updated</p>
                      <p className="font-semibold">{format(item.lastUpdatedAt ? new Date(item.lastUpdatedAt) : new Date(), "MMM dd")}</p>
                    </div>
                  </div>
                  {/* ID intentionally hidden from UI table/card view */}
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-4">
              <div className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
              </div>

              {/* Mobile Pagination */}
              <div className="flex md:hidden items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="h-8"><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm px-2">{currentPage} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="h-8"><ChevronRight className="h-4 w-4" /></Button>
              </div>

              {/* Desktop Pagination */}
              <div className="hidden md:flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>First</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /> Previous</Button>

                <div className="flex items-center gap-1">
                  {(() => {
                    const maxButtons = Math.min(5, totalPages);
                    const pages: number[] = [];
                    let start = 1;
                    if (totalPages <= 5) start = 1;
                    else if (currentPage <= 3) start = 1;
                    else if (currentPage >= totalPages - 2) start = totalPages - 4;
                    else start = currentPage - 2;
                    for (let i = 0; i < maxButtons; i++) pages.push(start + i);
                    return pages.map((pageNum) => (
                      <Button key={pageNum} variant={currentPage === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(pageNum)} className="w-8 h-8 p-0">{pageNum}</Button>
                    ));
                  })()}
                </div>

                <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next <ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyStock;

