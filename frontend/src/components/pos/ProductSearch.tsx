import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AsyncCategoryCombobox } from "@/components/ui/async-category-combobox";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { Product } from "@/types/pos";
import api from "@/api/client";
import { MyStockResponse, MyStockTableRow } from "@/types/mystock";
import { useDebounce } from "@/hooks/use-debounce";
import LocalLoader from "@/components/common/LocalLoader";

interface ProductSearchProps {
  onAddProduct: (product: Product) => void;
  customerType: "local" | "foreigner";
}

export function ProductSearch({ onAddProduct, customerType }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState<string>("All Categories");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reset page when search or category changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory]);

  // Fetch products from API
  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: any = { page, pageSize: 24 }; // 24 is a good grid size
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedCategory && selectedCategory !== "all") params.categoryId = selectedCategory;

        const res = await api.get<MyStockResponse>('/mystock', { params, meta: { showLoader: 'local', loaderKey: 'pos-products' } });
        if (cancelled) return;
        
        const rows: MyStockTableRow[] = res.data.tableResponse?.data ?? [];
        const mapped: Product[] = rows.map((r) => ({
          id: r.productId,
          name: r.productName,
          category: r.category?.name ?? '',
          product_type: r.productType,
          unit: r.unitType ?? null,
          foreignerPrice: r.foreignerPrice ?? 0,
          localPrice: r.localPrice ?? 0,
          cost: r.foreignerPrice ?? 0,
          stock: r.availableQuantity,
          minStock: r.minStock ?? 0,
          createdAt: r.lastUpdatedAt ? new Date(r.lastUpdatedAt) : new Date(),
          updatedAt: r.lastUpdatedAt ? new Date(r.lastUpdatedAt) : new Date(),
        }));
        setProducts(mapped);
        setTotalPages(res.data.tableResponse?.pagination?.totalPages ?? 1);
      } catch (err) {
        console.error('Failed to load products for POS', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProducts();
    return () => { cancelled = true; };
  }, [page, debouncedSearch, selectedCategory]);

  const isLowStock = (product: Product) => {
    // Handmade products don't have stock tracking
    if (product.product_type === 'HANDMADE') return false;
    return product.stock <= product.minStock;
  };

  const isOutOfStock = (product: Product) => {
    // Handmade products are never out of stock
    if (product.product_type === 'HANDMADE') return false;
    return product.stock === 0;
  };

  return (
    <div className="space-y-4">
      {/* Header and Pagination */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">
          Showing page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <AsyncCategoryCombobox
            defaultOptions={[{ label: "All Categories", value: "all" }]}
            value={selectedCategory}
            onValueChange={(val, label) => {
              setSelectedCategory(val);
              setSelectedCategoryLabel(label);
            }}
            selectedLabel={selectedCategoryLabel}
            placeholder="Category"
            searchPlaceholder="Search category..."
            className="w-full"
          />
        </div>
      </div>

      {/* Product Grid */}
      <LocalLoader loaderKey="pos-products">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {products.length === 0 && !loading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No products found
            </div>
          ) : (
            products.map((product) => (
            <Card
              key={product.id}
              className={`hover:shadow-md transition-shadow ${
                isOutOfStock(product) ? "opacity-50" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm line-clamp-2">
                      {product.name}
                    </h3>
                    {isLowStock(product) && (
                      <AlertTriangle
                        className={`h-4 w-4 flex-shrink-0 ml-1 ${
                          isOutOfStock(product)
                            ? "text-red-500"
                            : "text-yellow-500"
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                    {product.unit && (
                      <Badge variant="outline" className="text-xs border-purple-500 text-purple-700">
                        {product.unit}
                      </Badge>
                    )}
                  </div>

                  {product.product_type !== 'HANDMADE' && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Stock:</span>
                      <span
                        className={`font-medium ${
                          isOutOfStock(product)
                            ? "text-red-500"
                            : isLowStock(product)
                            ? "text-yellow-500"
                            : "text-green-600"
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </div>
                  )}

                  {product.product_type === 'HANDMADE' && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Stock:</span>
                      <span className="font-medium text-purple-600">
                        Made to Order
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between">
                      <span className={`${customerType === "foreigner" ? "font-semibold" : "text-muted-foreground"}`}>
                        Foreigner:
                      </span>
                      <span className={`${customerType === "foreigner" ? "font-bold text-primary text-base" : "text-muted-foreground"}`}>
                        Rs. {(Number(product.foreignerPrice) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${customerType === "local" ? "font-semibold" : "text-muted-foreground"}`}>
                        Local:
                      </span>
                      <span className={`${customerType === "local" ? "font-bold text-green-600 text-base" : "text-muted-foreground"}`}>
                        Rs. {(Number(product.localPrice) || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => onAddProduct(product)}
                      disabled={isOutOfStock(product)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {product.product_type !== 'HANDMADE' && (
                    <>
                      {isOutOfStock(product) && (
                        <p className="text-xs text-red-500 font-medium">
                          Out of Stock
                        </p>
                      )}
                      {isLowStock(product) && !isOutOfStock(product) && (
                        <p className="text-xs text-yellow-600 font-medium">
                          Low Stock Warning!
                        </p>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
        </div>
      </LocalLoader>
      {loading && (
        <p className="text-xs text-muted-foreground mt-2">Loading products...</p>
      )}
    </div>
  );
}
