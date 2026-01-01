import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Invoice } from "@/types/invoice";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InvoiceTableProps {
  invoices: Invoice[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
}

export function InvoiceTable({
  invoices,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
}: InvoiceTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Check if invoice is editable (within 5 hours of creation)
  const isEditable = (invoice: Invoice): boolean => {
    const createdAt = new Date(invoice.createdAt);
    const now = new Date();
    const fiveHoursInMs = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
    const timeDiff = now.getTime() - createdAt.getTime();
    return timeDiff < fiveHoursInMs;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{format(invoice.date, "MMM dd, yyyy")}</TableCell>
                  <TableCell>{invoice.items.length}</TableCell>
                  <TableCell>Rs. {invoice.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isEditable(invoice) && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit invoice"
                          title="Edit"
                          onClick={() => onEdit?.(invoice)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete invoice"
                          title="Delete"
                          onClick={() => setInvoiceToDelete(invoice)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Invoice Details Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
                  <p className="text-base font-semibold">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-base">{format(selectedInvoice.date, "PPP")}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="text-base capitalize">{selectedInvoice.paymentMethod}</p>
                </div>
                
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Items</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Cost Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>Rs. {(item.costPrice ?? item.unitPrice).toFixed(2)}</TableCell>
                          <TableCell>Rs. {(item.quantity * (item.costPrice ?? item.unitPrice)).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>Rs. {selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!invoiceToDelete} onOpenChange={() => setInvoiceToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete invoice {invoiceToDelete?.invoiceNumber}? This action cannot be undone.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setInvoiceToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (invoiceToDelete) { onDelete?.(invoiceToDelete); } setInvoiceToDelete(null); }}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
