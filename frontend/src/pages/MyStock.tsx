import { useState, useMemo } from "react";
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
import { generateProducts } from "@/lib/productData";
import { format } from "date-fns";

interface StockItem {
  id: string;
  productName: string;
  category: string;
  availableQuantity: number;
  minStock: number;
  lastUpdated: Date;
}

const MyStock = () => {
  const [searchProduct, setSearchProduct] = useState("");
  const [searchItem, setSearchItem] = useState("");
  const [filterToday, setFilterToday] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Get products and transform to stock items
  const stockItems: StockItem[] = useMemo(() => {
    const products = generateProducts();
    return products.map((product) => ({
      id: product.id,
      productName: product.name,
      category: product.category,
      availableQuantity: product.stock,
      minStock: product.minStock,
      lastUpdated: product.updatedAt,
    }));
  }, []);

  // Filter stock items
  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      // Filter by product name
      if (
        searchProduct &&
        !item.productName.toLowerCase().includes(searchProduct.toLowerCase())
      ) {
        return false;
      }

      // Filter by item name (same as product name in this context)
      if (
        searchItem &&
        !item.productName.toLowerCase().includes(searchItem.toLowerCase())
      ) {
        return false;
      }

      // Filter by today's stock
      if (filterToday === "today") {
        const today = new Date();
        const itemDate = new Date(item.lastUpdated);
        if (
          itemDate.getDate() !== today.getDate() ||
          itemDate.getMonth() !== today.getMonth() ||
          itemDate.getFullYear() !== today.getFullYear()
        ) {
          return false;
        }
      }

      return true;
    });
  }, [stockItems, searchProduct, searchItem, filterToday]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchProduct, searchItem, filterToday]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalItems = filteredItems.length;
    const totalQuantity = filteredItems.reduce(
      (sum, item) => sum + item.availableQuantity,
      0
    );
    const lowStockItems = filteredItems.filter(
      (item) => item.availableQuantity <= item.minStock
    ).length;
    const outOfStock = filteredItems.filter(
      (item) => item.availableQuantity === 0
    ).length;

    return { totalItems, totalQuantity, lowStockItems, outOfStock };
  }, [filteredItems]);

  // Download CSV function
  const downloadCSV = () => {
    const headers = [
      "Item ID",
      "Product Name",
      "Category",
      "Available Quantity",
      "Min Stock",
      "Status",
      "Last Updated",
    ];

    const csvData = filteredItems.map((item) => [
      item.id,
      item.productName,
      item.category,
      item.availableQuantity.toString(),
      item.minStock.toString(),
      item.availableQuantity === 0
        ? "Out of Stock"
        : item.availableQuantity <= item.minStock
        ? "Low Stock"
        : "In Stock",
      format(item.lastUpdated, "yyyy-MM-dd HH:mm:ss"),
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
    document.body.removeChild(link);
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
    setSearchItem("");
    setFilterToday("all");
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
              <Label htmlFor="searchItem" className="text-xs md:text-sm">Item Name</Label>
              <Input
                id="searchItem"
                placeholder="Search item..."
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                className="h-9 md:h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Stock Filter</Label>
              <Select value={filterToday} onValueChange={setFilterToday}>
                <SelectTrigger className="h-9 md:h-10">
                  <SelectValue placeholder="Select filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="today">Today's Stock</SelectItem>
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
                  <TableHead>Item ID</TableHead>
                  <TableHead>Product Name</TableHead>
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
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {item.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.productName}
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
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
                          {format(item.lastUpdated, "MMM dd, yyyy")}
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
                  key={item.id}
                  className="border rounded-lg p-3 space-y-2 bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-sm">{item.productName}</h3>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    {getStockStatus(item.availableQuantity, item.minStock)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p
                        className={`font-semibold ${
                          item.availableQuantity === 0
                            ? "text-red-600"
                            : item.availableQuantity <= item.minStock
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {item.availableQuantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Min Stock</p>
                      <p className="font-semibold">{item.minStock}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Updated</p>
                      <p className="font-semibold">{format(item.lastUpdated, "MMM dd")}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    ID: {item.id}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-4">
              <div className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredItems.length)} of{" "}
                {filteredItems.length} items
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
    </div>
  );
};

export default MyStock;

