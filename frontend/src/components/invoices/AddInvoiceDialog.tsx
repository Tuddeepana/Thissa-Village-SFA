import { useState, useMemo, useEffect } from "react";
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
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Invoice } from "@/types/invoice";
import { generateProducts } from "@/lib/productData";
import { productService } from '@/api/services/productService';
import api from '@/api/client';
import type { Product } from '@/types/product.types';
import { BarcodeScanner } from "@/components/common";
import { useToast } from "@/hooks/use-toast";

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
  // optional callback invoked after a successful create so parent can re-fetch
  onCreated?: () => void;
  // optional callback invoked after a successful update
  onUpdated?: () => void;
  // optional invoice to edit; if provided the dialog will act in edit mode
  invoiceToEdit?: Invoice | null;
}

export function AddInvoiceDialog({ open, onOpenChange, onCreated, onUpdated, invoiceToEdit }: AddInvoiceDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [barcode, setBarcode] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  // Discount entered by user as a percentage (0-100)
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [status, setStatus] = useState<'paid' | 'pending' | 'cancelled'>('pending');

  const products = useMemo(() => generateProducts(), []);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) as unknown as Product | undefined;
  }, [products, selectedProductId]);

  // fetched products from backend
  const [fetchedProducts, setFetchedProducts] = useState<Product[] | null>(null);

  // unit price state (number)
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // Load products from API only when the dialog is open
  useEffect(() => {
    let mounted = true;
    if (!open) return () => { mounted = false; };
    (async () => {
      try {
        const res = await productService.list({ page: 1, limit: 100 });
        if (!mounted) return;
        setFetchedProducts(res.items ?? []);
      } catch (err) {
        if (!mounted) return;
        // fallback to generateProducts if API fails
        setFetchedProducts(generateProducts() as unknown as Product[]);
      }
    })();
    return () => { mounted = false; };
  }, [open]);

  // populate form when invoiceToEdit changes
  useEffect(() => {
    if (invoiceToEdit) {
      setInvoiceNumber(invoiceToEdit.invoiceNumber ?? "");
      setDate(invoiceToEdit.date ?? new Date());
      setCustomerName(invoiceToEdit.customerName ?? "");
      setCustomerPhone(invoiceToEdit.customerPhone ?? "");
  // invoiceToEdit.discount is stored as amount; convert to percent for UI
  const invSubtotal = invoiceToEdit.subtotal ?? 0;
  const invDiscountAmount = invoiceToEdit.discount ?? 0;
  const computedPercent = invSubtotal > 0 ? (invDiscountAmount / invSubtotal) * 100 : 0;
  setDiscountPercent(Number.isFinite(computedPercent) ? Number(computedPercent.toFixed(2)) : 0);
      setStatus(invoiceToEdit.status ?? 'pending');
      // map items
      const mappedItems: ProductItem[] = (invoiceToEdit.items || []).map(i => ({
        productId: i.productId ?? String(Math.random()),
        productName: i.productName ?? "",
        category: i.category ?? "Uncategorized",
        quantity: i.quantity ?? 0,
        unitPrice: i.unitPrice ?? 0,
        total: i.total ?? (i.unitPrice ?? 0) * (i.quantity ?? 0),
      }));
      setItems(mappedItems);
    }
  }, [invoiceToEdit]);

  // choose source products: prefer fetchedProducts
  const productOptions = fetchedProducts && fetchedProducts.length > 0 ? fetchedProducts : (products as unknown as Product[]);

  // Handle barcode scanning - find and select product by barcode
  useEffect(() => {
    if (barcode && barcode.trim()) {
      const foundProduct = productOptions.find(p => p.barcode === barcode.trim());
      if (foundProduct) {
        setSelectedProductId(foundProduct.id);
        setBarcode(""); // Clear barcode after successful match
        toast({
          title: "Product Found",
          description: `${foundProduct.name} selected`
        });
      } else {
        toast({
          title: "Product Not Found",
          description: "No product with this barcode exists",
          variant: "destructive"
        });
        setBarcode(""); // Clear barcode even if not found
      }
    }
  }, [barcode, productOptions, toast]);

  // update unit price when selection changes
  const effectiveSelectedProduct = productOptions.find(p => p.id === selectedProductId);
  useMemo(() => {
    if (effectiveSelectedProduct) {
      const cp = Number.parseFloat(String(effectiveSelectedProduct.cost_price ?? effectiveSelectedProduct.selling_price ?? 0));
      setUnitPrice(Number.isNaN(cp) ? 0 : cp);
    } else {
      setUnitPrice(0);
    }
  }, [selectedProductId, fetchedProducts]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);

  const tax = useMemo(() => {
    return (subtotal * taxRate) / 100;
  }, [subtotal, taxRate]);

  // Discount amount computed from percentage
  const discount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const total = useMemo(() => {
    return subtotal + tax - discount;
  }, [subtotal, tax, discount]);

  const handleAddItem = () => {
    const prod = effectiveSelectedProduct;
    if (prod && quantity > 0) {
      const existingItemIndex = items.findIndex(item => item.productId === prod.id);
      const price = unitPrice;

      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...items];
        updatedItems[existingItemIndex].quantity += quantity;
        updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
        setItems(updatedItems);
      } else {
        // Add new item
        const newItem: ProductItem = {
          productId: prod.id,
          productName: prod.name,
          category: prod.categoryName || "Uncategorized",
          quantity: quantity,
          unitPrice: price,
          total: quantity * price,
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
    setBarcode("");
    setQuantity(1);
    setDiscountPercent(0);
    setTaxRate(0);
    setPaymentMethod('cash');
    setStatus('pending');
  };

  const handleSubmit = async () => {
    if (!(invoiceNumber.trim() && items.length > 0)) return;

    const payload = {
      in_number: invoiceNumber,
      invoiceDate: date.toISOString(),
      subtotal: subtotal,
      // Backend expects discount as percentage (0-100)
      discount: discountPercent,
      paid_status: status.toUpperCase() === 'PAID' ? 'PAID' : 'PENDING',
      items: items.map(i => ({ productId: i.productId, quantityMoved: i.quantity })),
    };

    setIsSaving(true);
    try {
      if (invoiceToEdit && (invoiceToEdit.id || invoiceToEdit.invoiceNumber)) {
        // Try to use id if available, otherwise fall back to invoice number
        const id = invoiceToEdit.id;
        if (id) {
          await api.put(`/invoices/${id}`, payload);
        } else {
          // fallback endpoint - not ideal, but attempt by invoice number
          await api.put(`/invoices`, { ...payload, in_number: invoiceToEdit.invoiceNumber });
        }
        onUpdated?.();
      } else {
        await api.post('/invoices', payload);
        onCreated?.();
      }

      resetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Save invoice failed', err);
      // Show a friendly message; try to extract message if it's an axios error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (err as any)?.response?.data?.message ?? 'Failed to save invoice';
      alert(message);
    } finally {
      setIsSaving(false);
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
          <DialogTitle>{invoiceToEdit ? 'Edit Invoice' : 'Add New Invoice'}</DialogTitle>
          <DialogDescription>
            {invoiceToEdit ? 'Edit existing invoice and save changes.' : 'Create a new invoice with customer and product details.'}
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

            {/* Discount and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discount">Discount %</Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number.parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Paid Status</Label>
                <Select value={status} onValueChange={(val: 'paid' | 'pending' | 'cancelled') => setStatus(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Selection Section */}
            <div className="grid gap-4">
              <BarcodeScanner
                value={barcode}
                onChange={setBarcode}
                label="Scan Product Barcode"
                placeholder="Scan barcode to auto-select product"
              />

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
                    {productOptions.map((product) => {
                      const unit = (product.bottle_volume ?? 'ML') === 'L' ? ' l' : ' ml';
                      const label = `${product.name} - ${product.litres}${unit}`;
                      return (
                        <SelectItem key={product.id} value={product.id}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {effectiveSelectedProduct && (
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="grid gap-2">
                    <Label>Unit Price</Label>
                    <Input
                      value={String(unitPrice)}
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
                    disabled={isSaving}
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
        {/* Summary */}
        <div className="px-4 pt-4">
          <div className="flex justify-end">
            <div className="w-full max-w-sm">
              <div className="flex justify-between">
                <div className="text-sm">Subtotal</div>
                <div className="font-semibold">Rs. {subtotal.toFixed(2)}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-sm">Discount ({discountPercent.toFixed(2)}%)</div>
                <div className="font-semibold">Rs. {discount.toFixed(2)}</div>
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between">
                <div className="text-sm">Total</div>
                <div className="font-bold">Rs. {total.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSaving}
          >
            {isSaving
              ? (invoiceToEdit ? 'Updating...' : 'Saving...')
              : (invoiceToEdit ? 'Update Invoice' : 'Save Invoice')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
