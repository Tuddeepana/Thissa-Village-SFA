import { useState, useMemo } from "react";
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

interface ProductSearchProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
}

export function ProductSearch({ products, onAddProduct }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Extract unique categories
  const categories = useMemo(() => {
    const categorySet = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(categorySet).sort()];
  }, [products]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

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
            placeholder="Search by name or description..."
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
          filteredProducts.map((product) => (
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

                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Foreigner:</span>
                      <span className="font-bold text-primary">Rs. {product.foreignerPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Local:</span>
                      <span className="font-bold text-green-600">Rs. {product.localPrice.toFixed(2)}</span>
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
}
