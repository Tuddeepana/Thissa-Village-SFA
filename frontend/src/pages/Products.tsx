import { useMemo, useState } from "react";
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
import { DeleteButton, BarcodeScanner } from "@/components/common";
import LocalLoader from "@/components/common/LocalLoader";
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation
} from "@/store/api/productsApi";
import {
  useGetCategoriesQuery
} from "@/store/api/categoriesApi";
import type { Product } from "@/types/product.types";

const Products = () => {
    const { toast } = useToast();

    // Local state for pagination and filters
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const limit = 10;

    // RTK Query hooks
    const {
        data: productsData,
        isLoading: productsLoading,
        refetch: refetchProducts
    } = useGetProductsQuery({
        page,
        limit,
        search: search || undefined,
        categoryId: selectedCategory || undefined
    });

    const {
        data: categoriesData,
        isLoading: categoriesLoading
    } = useGetCategoriesQuery({});

    const [createProduct] = useCreateProductMutation();
    const [updateProduct] = useUpdateProductMutation();
    const [deleteProduct] = useDeleteProductMutation();

    const products = productsData?.items ?? [];
    const categories = categoriesData?.items ?? [];
    const categoryNameById = useMemo(() => {
        const map: Record<string, string> = {};
        categories.forEach(c => { if (c.id) map[c.id] = c.name; });
        return map;
    }, [categories]);

    // Derived pagination values
    const totalPages = productsData?.totalPages ?? 1;
    const total = productsData?.total ?? 0;

    const [open, setOpen] = useState(false);

    // Inline edit state for per-row editing of lowStockAlert
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingLow, setEditingLow] = useState<number | "">("");
    const [editingCostPrice, setEditingCostPrice] = useState<number | "">("");
    const [editingSellingPrice, setEditingSellingPrice] = useState<number | "">("");
    const [editingBottleSize, setEditingBottleSize] = useState("");
    const [editingBottleUnit, setEditingBottleUnit] = useState("ml");
    const [editingBarcode, setEditingBarcode] = useState("");

    // Controlled form state for minimal add form
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState("");
    const [newLowStockAlert, setNewLowStockAlert] = useState<number | "">("");
    const [newCostPrice, setNewCostPrice] = useState<number | "">("");
    const [newSellingPrice, setNewSellingPrice] = useState<number | "">("");
    const [newBottleSize, setNewBottleSize] = useState(""); // New state for bottle size
    const [newBottleUnit, setNewBottleUnit] = useState("ml"); // New state for bottle unit
    const [newBarcode, setNewBarcode] = useState(""); // New state for barcode

    const handleDelete = async (id: string) => {
        try {
            await deleteProduct(id).unwrap();
            toast({ title: "Deleted", description: "Product removed successfully" });
        } catch (e: unknown) {
            const error = e as { data?: { message?: string } };
            toast({ title: "Error", description: error?.data?.message ?? "Failed to delete product" });
        }
    };

    // Handlers for inline edit
    const toBottleDisplay = (sizeStr?: string, unit?: string) => {
        if (!sizeStr) return "-";
        const normalizedUnit = unit === "L" ? "l" : unit === "ML" ? "ml" : "ml";
        return `${sizeStr} ${normalizedUnit}`;
        };

    const startEditing = (product: Product) => {
        setEditingId(product.id);
        setEditingLow(product.low_stock);
        setEditingCostPrice(Number.parseFloat(product.cost_price));
        setEditingSellingPrice(Number.parseFloat(product.selling_price));

        // Use the raw size string returned by the backend and the bottle_volume enum for unit.
        // Defaults: empty size -> "", missing unit -> "ml"
        setEditingBottleSize(product.litres ?? "");
        const unit = (product.bottle_volume ?? "ML").toString().toLowerCase();
        setEditingBottleUnit(unit === "l" ? "l" : "ml");
        setEditingBarcode(product.barcode ?? "");
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingLow("");
        setEditingCostPrice("");
        setEditingSellingPrice("");
        setEditingBottleSize(""); // Clear bottle size on cancel
        setEditingBottleUnit("ml"); // Reset bottle unit on cancel
        setEditingBarcode(""); // Clear barcode on cancel
    };

    const saveEditing = async () => {
        if (editingId == null) return;
        const alertLevel = typeof editingLow === "number" ? editingLow : Number.parseInt(String(editingLow || "0"), 10);
        const costPriceNum = typeof editingCostPrice === "number" ? editingCostPrice : Number.parseFloat(String(editingCostPrice || "0"));
        const sellingPriceNum = typeof editingSellingPrice === "number" ? editingSellingPrice : Number.parseFloat(String(editingSellingPrice || "0"));
        const litresStr = String(editingBottleSize).trim() || "0";
        const unitToEnum = (unit: string) => (String(unit).toLowerCase() === "l" ? "L" : "ML");
        const bottle_volume = unitToEnum(editingBottleUnit);
        try {
            await updateProduct({
                id: editingId,
                data: {
                    low_stock: Number.isNaN(alertLevel) ? 0 : alertLevel,
                    cost_price: Number.isNaN(costPriceNum) ? undefined : costPriceNum.toFixed(2),
                    selling_price: Number.isNaN(sellingPriceNum) ? undefined : sellingPriceNum.toFixed(2),
                    litres: litresStr,
                    bottle_volume,
                    barcode: editingBarcode || null,
                }
            }).unwrap();
            toast({ title: "Updated", description: "Product details updated" });
            setEditingId(null);
            setEditingLow("");
            setEditingCostPrice("");
            setEditingSellingPrice("");
            setEditingBottleSize("");
            setEditingBottleUnit("ml");
            setEditingBarcode("");
        } catch (e: unknown) {
            const error = e as { data?: { message?: string } };
            toast({ title: "Error", description: error?.data?.message ?? "Failed to update product" });
        }
    };

    const resetForm = () => {
        setNewName("");
        setNewCategory("");
        setNewLowStockAlert("");
        setNewCostPrice("");
        setNewSellingPrice("");
        setNewBottleSize("");
        setNewBottleUnit("ml");
        setNewBarcode("");
    };

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
        if (!newBottleSize.trim()) {
            toast({ title: "Validation", description: "Bottle size is required" });
            return;
        }

        const alertLevel = typeof newLowStockAlert === "number" ? newLowStockAlert : Number.parseInt(String(newLowStockAlert || "0"), 10);
        const costPrice = typeof newCostPrice === "number" ? newCostPrice : Number.parseFloat(String(newCostPrice || "0"));
        const sellingPrice = typeof newSellingPrice === "number" ? newSellingPrice : Number.parseFloat(String(newSellingPrice || "0"));
        const unitToEnum = (unit: string) => (String(unit).toLowerCase() === "l" ? "L" : "ML");
        const bottle_volume = unitToEnum(newBottleUnit);
        const litresStr = String(newBottleSize).trim() || "0";

        try {
            await createProduct({
                name: newName.trim(),
                litres: litresStr,
                cost_price: Number.isNaN(costPrice) ? "0.00" : costPrice.toFixed(2),
                selling_price: Number.isNaN(sellingPrice) ? "0.00" : sellingPrice.toFixed(2),
                low_stock: Number.isNaN(alertLevel) ? 0 : alertLevel,
                bottle_volume,
                categoryId: newCategory,
                barcode: newBarcode || null,
            }).unwrap();
            toast({ title: "Added", description: "Product added successfully" });
            resetForm();
            setOpen(false);
        } catch (e: unknown) {
            const error = e as { data?: { message?: string } };
            toast({ title: "Error", description: error?.data?.message ?? "Failed to add product" });
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Product Management</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Manage your wine inventory and pricing</p>
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

                            <BarcodeScanner
                                value={newBarcode}
                                onChange={setNewBarcode}
                                label="Barcode (Optional)"
                                placeholder="Scan or enter barcode"
                            />

                            <div className="space-y-2">
                                <Label htmlFor="costPrice">Product Price</Label>
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
                                <Label htmlFor="sellingPrice">Selling Price</Label>
                                <Input
                                    id="sellingPrice"
                                    type="number"
                                    placeholder="Enter selling price"
                                    value={newSellingPrice === "" ? "" : String(newSellingPrice)}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNewSellingPrice(val === "" ? "" : Number(val));
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bottleSize">Bottle Size</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="bottleSize"
                                        placeholder="Enter size"
                                        value={newBottleSize}
                                        onChange={(e) => setNewBottleSize(e.target.value)}
                                    />
                                    <Select value={newBottleUnit} onValueChange={(val) => setNewBottleUnit(val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ml">ML</SelectItem>
                                            <SelectItem value="l">L</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lowStockAlert">Low Stock Alert Level</Label>
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
                    <LocalLoader loading={productsLoading}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Barcode</TableHead>
                                <TableHead>Bottle Size</TableHead>
                                <TableHead>Product Price</TableHead>
                                <TableHead>Selling Price</TableHead>
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
                                                className="w-32"
                                                value={editingBarcode}
                                                onChange={(e) => setEditingBarcode(e.target.value)}
                                                placeholder="Barcode"
                                            />
                                        ) : (
                                            product.barcode || "-"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === product.id ? (
                                            <div className="flex gap-2">
                                                <Input
                                                    className="w-24"
                                                    value={editingBottleSize}
                                                    onChange={(e) => setEditingBottleSize(e.target.value)}
                                                />
                                                <Select value={editingBottleUnit} onValueChange={(val) => setEditingBottleUnit(val)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Unit" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ml">ML</SelectItem>
                                                        <SelectItem value="l">L</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            toBottleDisplay(product.litres, product.bottle_volume)
                                        )}
                                    </TableCell>
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
                                                value={editingSellingPrice === "" ? "" : String(editingSellingPrice)}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setEditingSellingPrice(val === "" ? "" : Number(val));
                                                }}
                                            />
                                        ) : (
                                            product.selling_price
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
                                            product.low_stock
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
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={productsLoading || page === 1}
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
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={productsLoading || page === totalPages}
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
