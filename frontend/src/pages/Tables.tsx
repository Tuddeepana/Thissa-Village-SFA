import { useState, useEffect } from "react";
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
import { Pencil, Plus, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DeleteButton } from "@/components/common";
import LocalLoader from "@/components/common/LocalLoader";
import { useQuery } from "@tanstack/react-query";
import { tableService } from "@/api/services/tableService";
import type { RestaurantTable, ExpandedTableItem } from "@/types/table.types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const Tables = () => {
  const { toast } = useToast();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [expandedTables, setExpandedTables] = useState<ExpandedTableItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    table_type: "NORMAL" as 'VIP' | 'NORMAL',
    quantity: 1
  });
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    table_type: "NORMAL" as 'VIP' | 'NORMAL',
    quantity: 1
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const response = await tableService.list();
      return response.tables;
    },
    staleTime: 10_000,
  });

  const { data: expandedData, refetch: refetchExpanded } = useQuery({
    queryKey: ["tables-expanded"],
    queryFn: async () => {
      const response = await tableService.getExpanded();
      return response.tables;
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (data) setTables(data);
  }, [data]);

  useEffect(() => {
    if (expandedData) setExpandedTables(expandedData);
  }, [expandedData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await tableService.create({
        name: formData.name,
        table_type: formData.table_type,
        quantity: formData.quantity
      });
      toast({ title: "Success", description: "Table added successfully" });
      setFormData({ name: "", table_type: "NORMAL", quantity: 1 });
      setOpen(false);
      refetch();
      refetchExpanded();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to add table" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tableService.delete(id);
      toast({ title: "Deleted", description: "Table removed successfully" });
      refetch();
      refetchExpanded();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to remove table" });
    }
  };

  const openEditDialog = (table: RestaurantTable) => {
    setSelectedTable(table);
    setEditForm({
      name: table.name,
      table_type: table.table_type,
      quantity: table.quantity
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    setIsEditSubmitting(true);
    try {
      await tableService.update(selectedTable.id, {
        name: editForm.name,
        table_type: editForm.table_type,
        quantity: editForm.quantity,
      });
      toast({ title: "Updated", description: "Table updated successfully" });
      setEditOpen(false);
      setSelectedTable(null);
      refetch();
      refetchExpanded();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to update table" });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Table Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage restaurant tables and seating</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Table Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Table, VIP Table, Garden Table"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table_type">Table Type</Label>
                <Select
                  value={formData.table_type}
                  onValueChange={(val: 'VIP' | 'NORMAL') => setFormData({ ...formData, table_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Number of tables to create (e.g., 5 will create Table 1, Table 2, ... Table 5)
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Table"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Configuration Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Table Configuration ({tables.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <LocalLoader loaderKey="tables">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell>
                      {table.table_type === 'VIP' ? (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                          <Crown className="h-3 w-3 mr-1" />
                          VIP
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell>{table.quantity}</TableCell>
                    <TableCell>
                      {table.createdAt ? format(new Date(table.createdAt), "PP") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(table)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteButton
                          onDelete={() => handleDelete(table.id)}
                          itemName={table.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </LocalLoader>
        </CardContent>
      </Card>

      {/* Expanded Table List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">All Tables ({expandedTables.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {expandedTables.map((table) => (
              <Card
                key={table.id}
                className={`${
                  table.table_type === 'VIP' 
                    ? 'border-amber-200 bg-amber-50/50' 
                    : 'border-gray-200'
                }`}
              >
                <CardContent className="p-4 text-center">
                  {table.table_type === 'VIP' && (
                    <Crown className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                  )}
                  <p className="font-semibold text-sm">{table.displayName}</p>
                  {table.table_type === 'VIP' && (
                    <p className="text-xs text-amber-600 mt-1">VIP</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {expandedTables.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No tables created yet. Add a table to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Table Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-table_type">Table Type</Label>
              <Select
                value={editForm.table_type}
                onValueChange={(val: 'VIP' | 'NORMAL') => setEditForm({ ...editForm, table_type: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                min="1"
                max="100"
                value={editForm.quantity}
                onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Changing quantity will update the number of tables displayed
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isEditSubmitting}>
              {isEditSubmitting ? "Updating..." : "Update Table"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tables;

