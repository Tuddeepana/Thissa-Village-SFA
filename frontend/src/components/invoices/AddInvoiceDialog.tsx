import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Invoice } from "@/types/invoice";
import { generateProducts } from "@/lib/productData";

interface ProductItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface AddInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function AddInvoiceDialog({ open, onOpenChange, onAdd }: AddInvoiceDialogProps) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [status, setStatus] = useState<'paid' | 'pending' | 'cancelled'>('pending');

  const products = useMemo(() => generateProducts(), []);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);

  const tax = useMemo(() => {
    return (subtotal * taxRate) / 100;
  }, [subtotal, taxRate]);

  const total = useMemo(() => {
    return subtotal + tax - discount;
  }, [subtotal, tax, discount]);

  const handleAddItem = () => {
    if (selectedProduct && quantity > 0) {
      const existingItemIndex = items.findIndex(item => item.productId === selectedProduct.id);

      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...items];
        updatedItems[existingItemIndex].quantity += quantity;
        updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
        setItems(updatedItems);
      } else {
        // Add new item
        const newItem: ProductItem = {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          category: selectedProduct.category,
          quantity: quantity,
          unitPrice: selectedProduct.price,
          total: quantity * selectedProduct.price,
        };
        setItems([...items, newItem]);
      }

      setSelectedProductId("");
      setQuantity(1);
    }
  };

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter(item => item.productId !== productId));
  };

  const handleUpdateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setItems(items.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.unitPrice,
        };
      }
      return item;
    }));
  };

  const resetForm = () => {
    setInvoiceNumber("");
    setDate(new Date());
    setCustomerName("");
    setCustomerPhone("");
    setItems([]);
    setSelectedProductId("");
    setQuantity(1);
    setDiscount(0);
    setTaxRate(0);
    setPaymentMethod('cash');
    setStatus('pending');
  };

  const handleSubmit = () => {
    if (invoiceNumber.trim() && items.length > 0) {
      const invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
        invoiceNumber,
        date,
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || undefined,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          category: item.category,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        status,
      };

      onAdd(invoiceData);
      resetForm();
      onOpenChange(false);
    }
  };

  const isValid = invoiceNumber.trim() && items.length > 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice with customer and product details.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="grid gap-4 py-4">
            {/* Invoice Details Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="e.g., INV-2024-0001"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Invoice Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      {date ? format(date, "PPP") : "Pick a date"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Product Selection Section */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="product">Select Product</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={(val) => setSelectedProductId(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedProduct && (
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="grid gap-2">
                    <Label>Unit Price</Label>
                    <Input
                      value={selectedProduct.price}
                      readOnly
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <Button
                    className="mt-6"
                    onClick={handleAddItem}
                  >
                    Add Item
                  </Button>
                </div>
              )}
            </div>

            {/* Items Table Section */}
            <div className="grid gap-4">
              <Label>Items</Label>
              <table className="table-auto w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Quantity</th>
                    <th className="px-4 py-2">Unit Price</th>
                    <th className="px-4 py-2">Total</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.productId}>
                      <td className="border px-4 py-2">{item.productName}</td>
                      <td className="border px-4 py-2">{item.category}</td>
                      <td className="border px-4 py-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItemQuantity(item.productId, Number.parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="border px-4 py-2">{item.unitPrice}</td>
                      <td className="border px-4 py-2">{item.total}</td>
                      <td className="border px-4 py-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
          >
            Save Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
