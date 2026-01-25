import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Download, Filter, TrendingUp, DollarSign, Package } from "lucide-react";
import { format } from "date-fns";
import LocalLoader from '@/components/common/LocalLoader';
import { Skeleton } from '@/components/ui/skeleton';
import { salesSummaryService } from '@/api/services/salesSummaryService';
import { categoryService } from '@/api/services/categoryService';
import { productService } from '@/api/services/productService';
import type { SalesSummaryResponse, VolumeWiseSummaryResponse } from '@/types/sales-summary.types';
import type { Category } from '@/types/category.types';
import type { Product } from '@/types/product.types';

const SalesSummary = () => {
  const [salesResponse, setSalesResponse] = useState<SalesSummaryResponse | null>(null);
  const [volumeWiseResponse, setVolumeWiseResponse] = useState<VolumeWiseSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterToday, setFilterToday] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");

  // Data for dropdowns
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Volume-wise pagination
  const [volumeWiseCurrentPage, setVolumeWiseCurrentPage] = useState(1);
  const [volumeWisePageSize] = useState(20);

  // Fetch categories and products on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          categoryService.list(),
          productService.list({ limit: 1000 }), // Fetch all products
        ]);
        setCategories(categoriesRes.categories || []);
        setProducts(productsRes.items || []);
        setFilteredProducts(productsRes.items || []);
      } catch (err) {
        console.error('Failed to fetch categories/products', err);
      }
    };
    fetchData();
  }, []);

  // Filter products by selected category
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.categoryId === selectedCategory));
    }
    // Reset product selection when category changes
    setSelectedProduct("all");
  }, [selectedCategory, products]);

  // Fetch sales data
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const query: any = {
          page: currentPage,
          pageSize,
        };

        const volumeWiseQuery: any = {
          page: volumeWiseCurrentPage,
          pageSize: volumeWisePageSize,
        };

        if (filterToday) {
          query.today = true;
          volumeWiseQuery.today = true;
        } else {
          if (dateFrom) {
            query.fromDate = dateFrom;
            volumeWiseQuery.fromDate = dateFrom;
          }
          if (dateTo) {
            query.toDate = dateTo;
            volumeWiseQuery.toDate = dateTo;
          }
          if (selectedYear && !dateFrom && !dateTo) {
            query.year = selectedYear;
            volumeWiseQuery.year = selectedYear;
          }
        }

        if (selectedCategory && selectedCategory !== "all") {
          query.categoryId = selectedCategory;
          volumeWiseQuery.categoryId = selectedCategory;
        }

        if (selectedProduct && selectedProduct !== "all") {
          query.productId = selectedProduct;
          volumeWiseQuery.productId = selectedProduct;
        }

        // Fetch both summaries in parallel
        const [salesData, volumeWiseData] = await Promise.all([
          salesSummaryService.getSalesSummary(query),
          salesSummaryService.getVolumeWiseSummary(volumeWiseQuery),
        ]);

        if (!cancelled) {
          setSalesResponse(salesData);
          setVolumeWiseResponse(volumeWiseData);
          setIsInitialLoad(false);
        }
      } catch (err) {
        console.error('Failed to fetch sales summary', err);
        if (!cancelled) {
          setSalesResponse(null);
          setVolumeWiseResponse(null);
          setIsInitialLoad(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [filterToday, selectedYear, dateFrom, dateTo, selectedCategory, selectedProduct, currentPage, pageSize, volumeWiseCurrentPage, volumeWisePageSize]);

  // Clear filters
  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setFilterToday(false);
    setSelectedYear(new Date().getFullYear().toString());
    setSelectedCategory("all");
    setSelectedProduct("all");
    setCurrentPage(1);
    setVolumeWiseCurrentPage(1);
  };

  // Download CSV report
  const downloadReport = () => {
    try {
      const rows = salesResponse?.tableResponse?.data || [];
      const headers = ['Date', 'Product Name', 'Category', 'Quantity', 'Foreigner Price', 'Local Price', 'Revenue', 'Profit'];

      const csvRows = rows.map(row => [
        row.date,
        row.productName,
        row.categoryName,
        row.quantity.toString(),
        row.foreignerPrice.toFixed(2),
        row.localPrice.toFixed(2),
        row.revenue.toFixed(2),
        row.profit.toFixed(2),
      ]);

      // Summary row
      const cards = salesResponse?.cardResponse;
      const summaryRow = [
        'TOTAL',
        '',
        '',
        cards?.totalQuantity.toString() || '0',
        '',
        '',
        cards?.totalRevenue.toFixed(2) || '0.00',
        cards?.totalProfit.toFixed(2) || '0.00',
      ];

      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
        '',
        summaryRow.map(cell => `"${cell}"`).join(','),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sales-summary-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download report', err);
    }
  };

  // Generate year options (last 5 years + current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);


  return (
    <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6 relative">
      {/* Loading Overlay for Filter Changes */}
      {isLoading && !isInitialLoad && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-xl border flex flex-col items-center gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-primary absolute inset-0"></div>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold mb-1">Loading Sales Data</p>
              <p className="text-sm text-muted-foreground">Please wait...</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Sales Summary</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View sales performance and analytics
          </p>
        </div>
        <Button onClick={downloadReport} className="gap-2">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </div>

      {/* Statistics Cards with Loader */}
      <LocalLoader
        loaderKey="sales-summary"
        renderSkeleton={() => (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0">
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <Card>
            <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Package className="h-3 w-3" />
                Total Quantity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold">
                {salesResponse?.cardResponse?.totalQuantity || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold">
                Rs.{salesResponse?.cardResponse?.totalRevenue.toFixed(0) || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Total Profit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-xl md:text-2xl font-bold">
                Rs.{salesResponse?.cardResponse?.totalProfit.toFixed(0) || 0}
              </div>
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
            {/* Date From */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">From Date</Label>
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
              <Label className="text-xs md:text-sm">To Date</Label>
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

            {/* Today Checkbox */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Today</Label>
              <div className="flex items-center gap-2 border rounded-md px-3 h-9 md:h-10">
                <Checkbox
                  id="filterTodaySales"
                  checked={filterToday}
                  onCheckedChange={(checked) => {
                    setFilterToday(checked as boolean);
                    if (checked) {
                      setDateFrom("");
                      setDateTo("");
                    }
                  }}
                />
                <Label htmlFor="filterTodaySales" className="text-xs md:text-sm cursor-pointer">
                  Filter Today
                </Label>
              </div>
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-9 md:h-10">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 md:h-10">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="h-9 md:h-10">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {filteredProducts.map(prod => (
                    <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Button Row */}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters} className="h-9 md:h-10">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Table with Loader */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Sales Details</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <LocalLoader
            loaderKey="sales-summary"
            renderSkeleton={() => (
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left font-medium"><Skeleton className="h-4 w-16" /></th>
                      <th className="p-3 text-left font-medium"><Skeleton className="h-4 w-28" /></th>
                      <th className="p-3 text-left font-medium"><Skeleton className="h-4 w-20" /></th>
                      <th className="p-3 text-right font-medium"><Skeleton className="h-4 w-12 ml-auto" /></th>
                      <th className="p-3 text-right font-medium"><Skeleton className="h-4 w-16 ml-auto" /></th>
                      <th className="p-3 text-right font-medium"><Skeleton className="h-4 w-16 ml-auto" /></th>
                      <th className="p-3 text-right font-medium"><Skeleton className="h-4 w-14 ml-auto" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, r) => (
                      <tr key={r} className="border-t animate-pulse">
                        <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-3 text-right"><Skeleton className="h-4 w-8 ml-auto" /></td>
                        <td className="p-3 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                        <td className="p-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                        <td className="p-3 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          >
            {salesResponse?.tableResponse?.data && salesResponse.tableResponse.data.length > 0 ? (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Foreigner Price</TableHead>
                        <TableHead className="text-right">Local Price</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesResponse.tableResponse.data.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{format(new Date(row.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{row.productName}</TableCell>
                          <TableCell>{row.categoryName}</TableCell>
                          <TableCell className="text-right">{row.quantity}</TableCell>
                          <TableCell className="text-right">Rs.{row.foreignerPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">Rs.{row.localPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">Rs.{row.revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">Rs.{row.profit.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {salesResponse.tableResponse.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {salesResponse.tableResponse.pagination.currentPage} of {salesResponse.tableResponse.pagination.totalPages} 
                      {' '}({salesResponse.tableResponse.pagination.totalRecords} total records)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= salesResponse.tableResponse.pagination.totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">No data for selected filters</div>
            )}
          </LocalLoader>
        </CardContent>
      </Card>

      {/* Volume-Wise Summary Table */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Volume-Wise Sales Summary</CardTitle>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Sales grouped by product and bottle size
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <LocalLoader
            loaderKey="volume-wise-summary"
            renderSkeleton={() => (
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left font-medium"><Skeleton className="h-4 w-24" /></th>
                      <th className="p-3 text-left font-medium"><Skeleton className="h-4 w-28" /></th>
                      <th className="p-3 text-left font-medium"><Skeleton className="h-4 w-20" /></th>
                      <th className="p-3 text-right font-medium"><Skeleton className="h-4 w-12 ml-auto" /></th>
                      <th className="p-3 text-left font-medium"><Skeleton className="h-4 w-16" /></th>
                      <th className="p-3 text-right font-medium"><Skeleton className="h-4 w-16 ml-auto" /></th>
                      <th className="p-3 text-right font-medium"><Skeleton className="h-4 w-14 ml-auto" /></th>
                      <th className="p-3 text-right font-medium"><Skeleton className="h-4 w-24 ml-auto" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, r) => (
                      <tr key={r} className="border-t animate-pulse">
                        <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-3 text-right"><Skeleton className="h-4 w-8 ml-auto" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="p-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                        <td className="p-3 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                        <td className="p-3 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          >
            {volumeWiseResponse?.tableResponse?.data && volumeWiseResponse.tableResponse.data.length > 0 ? (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date Range</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Foreigner Price</TableHead>
                        <TableHead className="text-right">Local Price</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {volumeWiseResponse.tableResponse.data.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{row.dateRange}</TableCell>
                          <TableCell>{row.productName}</TableCell>
                          <TableCell>{row.categoryName}</TableCell>
                          <TableCell className="text-right">{row.quantity}</TableCell>
                          <TableCell className="text-right">Rs.{row.foreignerPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">Rs.{row.localPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">Rs.{row.revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">Rs.{row.profit.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {volumeWiseResponse.tableResponse.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {volumeWiseResponse.tableResponse.pagination.currentPage} of {volumeWiseResponse.tableResponse.pagination.totalPages} 
                      {' '}({volumeWiseResponse.tableResponse.pagination.totalRecords} total records)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={volumeWiseCurrentPage === 1}
                        onClick={() => setVolumeWiseCurrentPage(p => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={volumeWiseCurrentPage >= volumeWiseResponse.tableResponse.pagination.totalPages}
                        onClick={() => setVolumeWiseCurrentPage(p => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">No data for selected filters</div>
            )}
          </LocalLoader>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesSummary;

