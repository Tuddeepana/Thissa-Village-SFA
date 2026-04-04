import { useState, useMemo, forwardRef, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { Product } from "@/types/pos";
import { toast } from "sonner";

interface ProductSearchProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const ProductSearch = forwardRef<HTMLInputElement, ProductSearchProps>(
  ({ products, onAddProduct, searchQuery: externalSearchQuery, onSearchChange }, ref) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchChange || setInternalSearchQuery;

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(-1);
  const productRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [gridColumns, setGridColumns] = useState<number>(4);

  // Extract unique categories
  const categories = useMemo(() => {
    const categorySet = new Set(products.map((p) => p.category).filter(c => c && c.trim() !== ""));
    return ["all", ...Array.from(categorySet).sort()];
  }, [products]);

  // Calculate grid columns based on window width
  useEffect(() => {
    const updateGridColumns = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setGridColumns(1); // mobile
      } else if (width < 1024) {
        setGridColumns(2); // md
      } else if (width < 1280) {
        setGridColumns(2); // lg - optimized for 17-inch monitors
      } else if (width < 1600) {
        setGridColumns(3); // xl
      } else {
        setGridColumns(4); // 2xl
      }
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);

  // Filter products based on category (search is handled server-side)
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  // Reset selected index when filtered products change
  useEffect(() => {
    setSelectedProductIndex(-1);
    productRefs.current = [];
  }, [filteredProducts]);

  // Handle keyboard navigation with 2D grid support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys and enter when search input is focused
      const target = e.target as HTMLElement;
      const isSearchInput = typeof ref !== 'function' && ref?.current && target === ref.current;

      if (!isSearchInput || filteredProducts.length === 0) return;

      const totalProducts = filteredProducts.length;
      const currentRow = Math.floor(selectedProductIndex / gridColumns);
      const currentCol = selectedProductIndex % gridColumns;
      const totalRows = Math.ceil(totalProducts / gridColumns);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedProductIndex((prev) => {
            // If no selection, select first item
            if (prev === -1) {
              scrollToProduct(0);
              return 0;
            }
            
            // Move down one row
            const nextIndex = prev + gridColumns;
            
            // If next row exists and has item at this column position
            if (nextIndex < totalProducts) {
              scrollToProduct(nextIndex);
              return nextIndex;
            }
            
            // Wrap to first row, same column (or first item if column doesn't exist)
            const wrappedIndex = Math.min(currentCol, totalProducts - 1);
            scrollToProduct(wrappedIndex);
            return wrappedIndex;
          });
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedProductIndex((prev) => {
            // If no selection, select first item
            if (prev === -1) {
              scrollToProduct(0);
              return 0;
            }
            
            // Move up one row
            const prevIndex = prev - gridColumns;
            
            // If previous row exists
            if (prevIndex >= 0) {
              scrollToProduct(prevIndex);
              return prevIndex;
            }
            
            // Wrap to last row, same column
            const lastRowStartIndex = (totalRows - 1) * gridColumns;
            const wrappedIndex = Math.min(lastRowStartIndex + currentCol, totalProducts - 1);
            scrollToProduct(wrappedIndex);
            return wrappedIndex;
          });
          break;

        case 'ArrowRight':
          e.preventDefault();
          setSelectedProductIndex((prev) => {
            // If no selection, select first item
            if (prev === -1) {
              scrollToProduct(0);
              return 0;
            }
            
            // Move right one column
            const nextIndex = prev + 1;
            
            // If next item exists and is in the same row
            if (nextIndex < totalProducts && Math.floor(nextIndex / gridColumns) === currentRow) {
              scrollToProduct(nextIndex);
              return nextIndex;
            }
            
            // Wrap to beginning of current row
            const rowStartIndex = currentRow * gridColumns;
            scrollToProduct(rowStartIndex);
            return rowStartIndex;
          });
          break;

        case 'ArrowLeft':
          e.preventDefault();
          setSelectedProductIndex((prev) => {
            // If no selection, select first item
            if (prev === -1) {
              scrollToProduct(0);
              return 0;
            }
            
            // Move left one column
            const prevIndex = prev - 1;
            
            // If previous item exists and is in the same row
            if (prevIndex >= 0 && Math.floor(prevIndex / gridColumns) === currentRow) {
              scrollToProduct(prevIndex);
              return prevIndex;
            }
            
            // Wrap to end of current row
            const rowStartIndex = currentRow * gridColumns;
            const rowEndIndex = Math.min(rowStartIndex + gridColumns - 1, totalProducts - 1);
            scrollToProduct(rowEndIndex);
            return rowEndIndex;
          });
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedProductIndex >= 0 && selectedProductIndex < filteredProducts.length) {
            const selectedProduct = filteredProducts[selectedProductIndex];
            if (selectedProduct.stock > 0) {
              onAddProduct(selectedProduct);
              toast.success(`${selectedProduct.name} added to cart`);
            } else {
              toast.error(`${selectedProduct.name} is out of stock!`);
            }
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredProducts, selectedProductIndex, onAddProduct, ref, gridColumns]);

  // Scroll to the selected product
  const scrollToProduct = (index: number) => {
    if (productRefs.current[index]) {
      productRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  };

  const isLowStock = (product: Product) => {
    return product.stock <= product.minStock;
  };

  const isOutOfStock = (product: Product) => {
    return product.stock === 0;
  };

  return (
    <div className="space-y-2 md:space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          <Input
            ref={ref}
            placeholder="Search by name, barcode, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 md:pl-10 text-xs md:text-sm h-8 md:h-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px] md:w-[200px] text-xs md:text-sm h-8 md:h-10">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category} className="text-xs md:text-sm">
                {category === "all" ? "All Categories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 md:gap-3 max-h-[calc(100vh-280px)] md:max-h-[calc(100vh-300px)] overflow-y-auto pr-1 md:pr-2">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
            No products found
          </div>
        ) : (
          filteredProducts.map((product, index) => (
            <Card
              key={product.id}
              ref={(el) => (productRefs.current[index] = el)}
              className={`hover:shadow-md transition-all ${
                isOutOfStock(product) ? "opacity-50" : ""
              } ${
                selectedProductIndex === index
                  ? "ring-2 ring-primary shadow-lg scale-105"
                  : ""
              }`}
            >
              <CardContent className="p-2 md:p-4">
                <div className="space-y-1.5 md:space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-xs md:text-sm line-clamp-2">
                      {product.name}
                    </h3>
                    {isLowStock(product) && (
                      <AlertTriangle
                        className={`h-3 w-3 md:h-4 md:w-4 flex-shrink-0 ml-1 ${
                          isOutOfStock(product)
                            ? "text-red-500"
                            : "text-yellow-500"
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Badge variant="secondary" className="text-[10px] md:text-xs px-1 md:px-2 py-0 md:py-0.5">
                      {product.category}
                    </Badge>
                    {product.bottleVolume && (
                      <Badge variant="outline" className="text-[9px] md:text-[10px] px-1 py-0">
                        {String(product.bottleVolume).replace(/\s+/g, '').toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs md:text-sm">
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

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-base md:text-lg font-bold text-primary">
                      Rs. {product.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => onAddProduct(product)}
                      disabled={isOutOfStock(product)}
                      className="h-7 md:h-8 text-xs md:text-sm px-2 md:px-3"
                    >
                      <Plus className="h-3 w-3 md:h-4 md:w-4 mr-0.5 md:mr-1" />
                      Add
                    </Button>
                  </div>

                  {isOutOfStock(product) && (
                    <p className="text-[10px] md:text-xs text-red-500 font-medium">
                      Out of Stock
                    </p>
                  )}
                  {isLowStock(product) && !isOutOfStock(product) && (
                    <p className="text-[10px] md:text-xs text-yellow-600 font-medium">
                      Low Stock Warning!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
});

ProductSearch.displayName = "ProductSearch";

