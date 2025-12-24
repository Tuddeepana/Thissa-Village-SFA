import { useState } from "react";
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
import { Pencil, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DeleteButton } from "@/components/common";

interface Product {
    id: number;
    name: string;
    category: string;
    liter: string;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    lowStockAlert: number;
    bottleSize: string;
}

const Products = () => {
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([
        {
            id: 1,
            name: "Château Margaux 2015",
            category: "Red Wine",
            liter: "750ml",
            costPrice: 450,
            sellingPrice: 650,
            stock: 24,
            lowStockAlert: 10,
            bottleSize: "750ml",
        },
        {
            id: 2,
            name: "Moët & Chandon Brut",
            category: "Sparkling Wine",
            liter: "750ml",
            costPrice: 35,
            sellingPrice: 55,
            stock: 8,
            lowStockAlert: 15,
            bottleSize: "750ml",
        },
        {
            id: 3,
            name: "Cloudy Bay Sauvignon Blanc",
            category: "White Wine",
            liter: "750ml",
            costPrice: 22,
            sellingPrice: 35,
            stock: 42,
            lowStockAlert: 20,
            bottleSize: "750ml",
        },
    ]);

    const [open, setOpen] = useState(false);

    // Inline edit state for per-row editing of lowStockAlert
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingLow, setEditingLow] = useState<number | "">("");
    const [editingCostPrice, setEditingCostPrice] = useState<number | "">("");
    const [editingSellingPrice, setEditingSellingPrice] = useState<number | "">("");
    const [editingBottleSize, setEditingBottleSize] = useState(""); // New state for bottle size
    const [editingBottleUnit, setEditingBottleUnit] = useState("ml"); // New state for bottle unit
    // Controlled form state for minimal add form
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState("");
    const [newLowStockAlert, setNewLowStockAlert] = useState<number | "">("");
    const [newCostPrice, setNewCostPrice] = useState<number | "">("");
    const [newSellingPrice, setNewSellingPrice] = useState<number | "">("");
    const [newBottleSize, setNewBottleSize] = useState(""); // New state for bottle size
    const [newBottleUnit, setNewBottleUnit] = useState("ml"); // New state for bottle unit

    const handleDelete = (id: number) => {
        setProducts(products.filter((prod) => prod.id !== id));
        toast({
            title: "Deleted",
            description: "Product removed successfully",
        });
    };

    // Handlers for inline edit
    const startEditing = (product: Product) => {
        setEditingId(product.id);
        setEditingLow(product.lowStockAlert);
        setEditingCostPrice(product.costPrice);
        setEditingSellingPrice(product.sellingPrice);
        const [size, unit] = product.bottleSize.split(" ");
        setEditingBottleSize(size);
        setEditingBottleUnit(unit);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingLow("");
        setEditingCostPrice("");
        setEditingSellingPrice("");
        setEditingBottleSize(""); // Clear bottle size on cancel
        setEditingBottleUnit("ml"); // Reset bottle unit on cancel
    };

    const saveEditing = () => {
        if (editingId == null) return;
        const alertLevel = typeof editingLow === "number" ? editingLow : Number.parseInt(String(editingLow || "0"), 10);
        const costPrice = typeof editingCostPrice === "number" ? editingCostPrice : Number.parseFloat(String(editingCostPrice || "0"));
        const sellingPrice = typeof editingSellingPrice === "number" ? editingSellingPrice : Number.parseFloat(String(editingSellingPrice || "0"));
        setProducts(prev => prev.map(p => p.id === editingId ? { ...p, lowStockAlert: alertLevel, costPrice, sellingPrice, bottleSize: `${editingBottleSize} ${editingBottleUnit}` } : p));
        toast({ title: "Updated", description: "Product details updated" });
        setEditingId(null);
        setEditingLow("");
        setEditingCostPrice("");
        setEditingSellingPrice("");
        setEditingBottleSize("");
        setEditingBottleUnit("ml");
    };

    const resetForm = () => {
        setNewName("");
        setNewCategory("");
        setNewLowStockAlert("");
        setNewCostPrice("");
        setNewSellingPrice("");
        setNewBottleSize("");
        setNewBottleUnit("ml");
    };

    const handleAddSubmit = (e: React.FormEvent) => {
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

        let categoryLabel = newCategory;
        if (newCategory === "red") {
            categoryLabel = "Red Wine";
        } else if (newCategory === "white") {
            categoryLabel = "White Wine";
        } else if (newCategory === "sparkling") {
            categoryLabel = "Sparkling Wine";
        }

        const nextId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;

        const newProduct: Product = {
            id: nextId,
            name: newName.trim(),
            category: categoryLabel,
            liter: "750ml", // default
            costPrice: Number.isNaN(costPrice) ? 0 : costPrice,
            sellingPrice: Number.isNaN(sellingPrice) ? 0 : sellingPrice,
            stock: 0,
            lowStockAlert: Number.isNaN(alertLevel) ? 0 : alertLevel,
            bottleSize: `${newBottleSize.trim()} ${newBottleUnit}`,
        };

        setProducts(prev => [...prev, newProduct]);
        toast({ title: "Added", description: "Product added successfully" });
        resetForm();
        setOpen(false);
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
                                        <SelectItem value="red">Red Wine</SelectItem>
                                        <SelectItem value="white">White Wine</SelectItem>
                                        <SelectItem value="sparkling">Sparkling Wine</SelectItem>
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
                    <CardTitle className="text-base md:text-lg">All Products</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
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
                                    <TableCell>{product.category}</TableCell>
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
                                            product.bottleSize
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
                                            product.costPrice
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
                                            product.sellingPrice
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
                                            product.lowStockAlert
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
                </CardContent>
            </Card>
        </div>
    );
};

export default Products;
