import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Pencil, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DeleteButton } from "@/components/common";
import LocalLoader from "@/components/common/LocalLoader";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/api/services/productService";
import { categoryService } from "@/api/services/categoryService";
import type { Product } from "@/types/product.types";
import type { Category } from "@/types/category.types";

// Result shape returned by productService.list
type ProductListResult = {
    items: Product[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

const Products = () => {
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const categoryNameById = useMemo(() => {
        const map: Record<string, string> = {};
        categories.forEach(c => { if (c.id) map[c.id] = c.name; });
        return map;
    }, [categories]);

    const [open, setOpen] = useState(false);

    // Inline edit state for per-row editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingLow, setEditingLow] = useState<number | "">("");
    const [editingCostPrice, setEditingCostPrice] = useState<number | "">("");
    const [editingForeignerPrice, setEditingForeignerPrice] = useState<number | "">("");
    const [editingLocalPrice, setEditingLocalPrice] = useState<number | "">("");

    // Controlled form state for minimal add form
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState("");
    const [newLowStockAlert, setNewLowStockAlert] = useState<number | "">("");
    const [newCostPrice, setNewCostPrice] = useState<number | "">("");
    const [newForeignerPrice, setNewForeignerPrice] = useState<number | "">("");
    const [newLocalPrice, setNewLocalPrice] = useState<number | "">("");

    const handleDelete = async (id: string) => {
        try {
            await productService.delete(id);
            toast({ title: "Deleted", description: "Product removed successfully" });
            refetchProducts();
        } catch (e: any) {
            toast({ title: "Error", description: e?.response?.data?.message ?? "Failed to delete product" });
        }
    };

    // Handlers for inline edit
    const startEditing = (product: Product) => {
        setEditingId(product.id);
        setEditingLow(product.low_stock ?? "");
        setEditingCostPrice(Number.parseFloat(product.cost_price));
        setEditingForeignerPrice(Number.parseFloat(product.foreigner_price));
        setEditingLocalPrice(Number.parseFloat(product.local_price));
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingLow("");
        setEditingCostPrice("");
        setEditingForeignerPrice("");
        setEditingLocalPrice("");
    };

    const saveEditing = async () => {
        if (editingId == null) return;
        const alertLevel = editingLow === "" ? null : (typeof editingLow === "number" ? editingLow : Number.parseInt(String(editingLow || "0"), 10));
        const costPriceNum = typeof editingCostPrice === "number" ? editingCostPrice : Number.parseFloat(String(editingCostPrice || "0"));
        const foreignerPriceNum = typeof editingForeignerPrice === "number" ? editingForeignerPrice : Number.parseFloat(String(editingForeignerPrice || "0"));
        const localPriceNum = typeof editingLocalPrice === "number" ? editingLocalPrice : Number.parseFloat(String(editingLocalPrice || "0"));
        try {
            await productService.update(editingId, {
                low_stock: alertLevel,
                cost_price: Number.isNaN(costPriceNum) ? undefined : costPriceNum.toFixed(2),
                foreigner_price: Number.isNaN(foreignerPriceNum) ? undefined : foreignerPriceNum.toFixed(2),
                local_price: Number.isNaN(localPriceNum) ? undefined : localPriceNum.toFixed(2),
            });
            toast({ title: "Updated", description: "Product details updated" });
            cancelEditing();
            refetchProducts();
        } catch (e: any) {
            toast({ title: "Error", description: e?.response?.data?.message ?? "Failed to update product" });
        }
    };

    const resetForm = () => {
        setNewName("");
        setNewCategory("");
        setNewLowStockAlert("");
        setNewCostPrice("");
        setNewForeignerPrice("");
        setNewLocalPrice("");
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch products with pagination
    const { data: productResult, refetch: refetchProducts, isFetching } = useQuery<ProductListResult, Error, ProductListResult>({
        queryKey: ["products", { page: currentPage, limit: itemsPerPage }],
        queryFn: async () => productService.list({ page: currentPage, limit: itemsPerPage }),
        staleTime: 10_000,
        keepPreviousData: true,
    });

    useEffect(() => {
        if (productResult?.items) setProducts(productResult.items);
    }, [productResult]);

    // Derived pagination values with safe typing
    const pr = productResult as ProductListResult | undefined;
    const page = pr?.page ?? currentPage;
    const limit = pr?.limit ?? itemsPerPage;
    const total = pr?.total ?? (products?.length ?? 0);
    const totalPages = pr?.totalPages ?? Math.max(1, Math.ceil((total || 1) / (limit || 1)));

    // Fetch categories for select and name mapping
    const { data: categoryList } = useQuery({
        queryKey: ["categories-all"],
        queryFn: async () => {
            const { categories } = await categoryService.list();
            return categories;
        },
        staleTime: 30_000,
    });

    useEffect(() => {
        if (categoryList) setCategories(categoryList);
    }, [categoryList]);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newName.trim()) {
            toast({ title: "Validation", description: "Product name is required" });
            return;
        }
        if (!newCategory) {
            toast({ title: "Validation", description: "Category is required" });
            return;
        }

        const alertLevel = newLowStockAlert === "" ? null : (typeof newLowStockAlert === "number" ? newLowStockAlert : Number.parseInt(String(newLowStockAlert || "0"), 10));
        const costPrice = typeof newCostPrice === "number" ? newCostPrice : Number.parseFloat(String(newCostPrice || "0"));
        const foreignerPrice = typeof newForeignerPrice === "number" ? newForeignerPrice : Number.parseFloat(String(newForeignerPrice || "0"));
        const localPrice = typeof newLocalPrice === "number" ? newLocalPrice : Number.parseFloat(String(newLocalPrice || "0"));

        try {
            await productService.create({
                name: newName.trim(),
                cost_price: Number.isNaN(costPrice) ? "0.00" : costPrice.toFixed(2),
                foreigner_price: Number.isNaN(foreignerPrice) ? "0.00" : foreignerPrice.toFixed(2),
                local_price: Number.isNaN(localPrice) ? "0.00" : localPrice.toFixed(2),
                low_stock: alertLevel,
                categoryId: newCategory,
            });
            toast({ title: "Added", description: "Product added successfully" });
            resetForm();
            setOpen(false);
            refetchProducts();
        } catch (e: any) {
            toast({ title: "Error", description: e?.response?.data?.message ?? "Failed to add product" });
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Product Management</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Manage your inventory and pricing</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                        </DialogHeader>
                        <form className="space-y-4" onSubmit={handleAddSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={newCategory} onValueChange={(val) => setNewCategory(val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="productName">Product Name</Label>
                                <Input
                                    id="productName"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="costPrice">Product Price (Cost)</Label>
                                <Input
                                    id="costPrice"
                                    type="number"
                                    placeholder="Enter cost price"
                                    value={newCostPrice === "" ? "" : String(newCostPrice)}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNewCostPrice(val === "" ? "" : Number(val));
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="foreignerPrice">Foreigner Price</Label>
                                <Input
                                    id="foreignerPrice"
                                    type="number"
                                    placeholder="Enter selling price for foreigners"
                                    value={newForeignerPrice === "" ? "" : String(newForeignerPrice)}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNewForeignerPrice(val === "" ? "" : Number(val));
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="localPrice">Local Price</Label>
                                <Input
                                    id="localPrice"
                                    type="number"
                                    placeholder="Enter selling price for locals"
                                    value={newLocalPrice === "" ? "" : String(newLocalPrice)}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNewLocalPrice(val === "" ? "" : Number(val));
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lowStockAlert">Low Stock Alert Level (Optional)</Label>
                                <Input
                                    id="lowStockAlert"
                                    type="number"
                                    placeholder="10"
                                    value={newLowStockAlert === "" ? "" : String(newLowStockAlert)}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNewLowStockAlert(val === "" ? "" : Number(val));
                                    }}
                                />
                            </div>

                            <Button type="submit" className="w-full">Add Product</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base md:text-lg">
                        All Products ({total})
                        {totalPages > 1 && (
                            <span className="text-xs md:text-sm font-normal text-muted-foreground ml-2">
                                - Page {page} of {totalPages}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <LocalLoader loaderKey="products">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Product Price</TableHead>
                                <TableHead>Foreigner Price</TableHead>
                                <TableHead>Local Price</TableHead>
                                <TableHead>Low Stock Alert</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{categoryNameById[product.categoryId] ?? "-"}</TableCell>
                                    <TableCell>
                                        {editingId === product.id ? (
                                            <Input
                                                className="w-24"
                                                type="number"
                                                value={editingCostPrice === "" ? "" : String(editingCostPrice)}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setEditingCostPrice(val === "" ? "" : Number(val));
                                                }}
                                            />
                                        ) : (
                                            product.cost_price
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === product.id ? (
                                            <Input
                                                className="w-24"
                                                type="number"
                                                value={editingForeignerPrice === "" ? "" : String(editingForeignerPrice)}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setEditingForeignerPrice(val === "" ? "" : Number(val));
                                                }}
                                            />
                                        ) : (
                                            product.foreigner_price
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === product.id ? (
                                            <Input
                                                className="w-24"
                                                type="number"
                                                value={editingLocalPrice === "" ? "" : String(editingLocalPrice)}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setEditingLocalPrice(val === "" ? "" : Number(val));
                                                }}
                                            />
                                        ) : (
                                            product.local_price
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === product.id ? (
                                            <Input
                                                className="w-24"
                                                type="number"
                                                value={editingLow === "" ? "" : String(editingLow)}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setEditingLow(val === "" ? "" : Number(val));
                                                }}
                                            />
                                        ) : (
                                            product.low_stock ?? "-"
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {editingId === product.id ? (
                                                <>
                                                    <Button type="button" size="sm" onClick={saveEditing}>Save</Button>
                                                    <Button type="button" size="sm" variant="ghost" onClick={cancelEditing}>Cancel</Button>
                                                </>
                                            ) : (
                                                <Button type="button" variant="ghost" size="icon" onClick={() => startEditing(product)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <DeleteButton
                                                onDelete={() => handleDelete(product.id)}
                                                itemName={product.name}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </LocalLoader>
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between gap-3 mt-4">
                            <div className="text-xs md:text-sm text-muted-foreground">
                                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} products
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={isFetching || page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <span className="text-sm px-2">
                                    {page} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={isFetching || page === totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Products;
