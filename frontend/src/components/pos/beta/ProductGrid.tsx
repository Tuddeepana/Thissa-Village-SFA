import { useState, useEffect } from "react";
import { Search, Plus, AlertTriangle, ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";
import { Product } from "@/types/pos";
import api from "@/api/client";
import { MyStockResponse, MyStockTableRow } from "@/types/mystock";
import { useDebounce } from "@/hooks/use-debounce";
import LocalLoader from "@/components/common/LocalLoader";
import { AsyncCategoryCombobox } from "@/components/ui/async-category-combobox";

interface ProductGridProps {
  onAddProduct: (product: Product) => void;
  customerType: "local" | "foreigner";
}

export function ProductGrid({ onAddProduct, customerType }: ProductGridProps) {
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



  // Fetch products
  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: any = { page, pageSize: 24 }; // Nice grid size
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedCategory && selectedCategory !== "all") params.categoryId = selectedCategory;

        const res = await api.get<MyStockResponse>('/mystock', { params, meta: { showLoader: 'local', loaderKey: 'pos-beta-products' } });
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
          cost: r.foreignerPrice ?? 0, // Using foreignerPrice as fallback for cost if not provided
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
    if (product.product_type === 'HANDMADE') return false;
    return product.stock <= product.minStock;
  };

  const isOutOfStock = (product: Product) => {
    if (product.product_type === 'HANDMADE') return false;
    return product.stock === 0;
  };

  return (
    <div className="pos-products-panel">
      {/* Top Toolbar */}
      <div className="pos-products-toolbar">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="pos-search-wrapper flex-1">
            <Search className="pos-search-icon h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-[250px]">
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
              className="w-full h-10"
            />
          </div>
        </div>
      </div>

      {/* Product Grid Area */}
      <LocalLoader loaderKey="pos-beta-products">
        {products.length === 0 && !loading ? (
          <div className="pos-empty-cart h-full">
            <div className="empty-icon">
              <PackageOpen className="h-8 w-8" />
            </div>
            <h3 className="text-foreground font-semibold">No products found</h3>
            <p className="empty-hint">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <div className="pos-product-grid">
            {products.map((product) => {
              const outOfStock = isOutOfStock(product);
              const lowStock = isLowStock(product);
              const price = customerType === "local" ? product.localPrice : product.foreignerPrice;

              return (
                <div 
                  key={product.id} 
                  className={`pos-product-card ${outOfStock ? 'out-of-stock' : ''}`}
                  onClick={() => !outOfStock && onAddProduct(product)}
                >
                  {/* Status Badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 items-end">
                    {product.product_type === 'HANDMADE' ? (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20 backdrop-blur-sm">
                        Made to order
                      </span>
                    ) : lowStock && !outOfStock ? (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 backdrop-blur-sm flex items-center gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" /> Low Stock
                      </span>
                    ) : outOfStock ? (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 backdrop-blur-sm">
                        Out of Stock
                      </span>
                    ) : null}
                  </div>

                  <div className="product-category">{product.category}</div>
                  <div className="product-name" title={product.name}>{product.name}</div>
                  
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="product-price">Rs. {Number(price || 0).toFixed(2)}</div>
                      {/* Secondary price just for reference */}
                      <div className="product-price-secondary mt-0.5">
                        {customerType === 'local' ? 'Foreigner: ' : 'Local: '}
                        Rs. {Number((customerType === 'local' ? product.foreignerPrice : product.localPrice) || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {product.product_type !== 'HANDMADE' && (
                    <div className={`product-stock ${outOfStock ? 'pos-stock-out' : lowStock ? 'pos-stock-low' : 'pos-stock-ok'}`}>
                      {product.stock} in stock
                    </div>
                  )}

                  <button 
                    className="product-add-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddProduct(product);
                    }}
                    disabled={outOfStock}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </LocalLoader>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="pos-pagination">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="page-info">Page {page} of {totalPages}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
