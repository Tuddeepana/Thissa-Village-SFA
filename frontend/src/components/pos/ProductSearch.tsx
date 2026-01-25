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
}

export const ProductSearch = forwardRef<HTMLInputElement, ProductSearchProps>(
  ({ products, onAddProduct }, ref) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(-1);
  const productRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [gridColumns, setGridColumns] = useState<number>(4);

  // Extract unique categories
  const categories = useMemo(() => {
    const categorySet = new Set(products.map((p) => p.category));
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
        setGridColumns(3); // lg
      } else {
        setGridColumns(4); // xl
      }
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.includes(searchQuery) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

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
      const isSearchInput = target === (ref as any)?.current;
      
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
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={ref}
            placeholder="Search by name, barcode, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
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
                    {product.bottleVolume && (
                      <Badge variant="outline" className="text-[10px]">
                        {String(product.bottleVolume).replace(/\s+/g, '').toUpperCase()}
                      </Badge>
                    )}
                  </div>

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

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-primary">
                      Rs. {product.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => onAddProduct(product)}
                      disabled={isOutOfStock(product)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

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

