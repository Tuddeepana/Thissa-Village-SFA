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
import { Pencil, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DeleteButton } from "@/components/common";
import LocalLoader from "@/components/common/LocalLoader";
import { useQuery } from "@tanstack/react-query";
import { unitService } from "@/api/services/unitService";
import type { Unit } from "@/types/unit.types";
import { format } from "date-fns";

const Units = () => {
  const { toast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [formData, setFormData] = useState({ name: "", description: "" });
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const response = await unitService.list();
      return response.units;
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (data) setUnits(data);
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await unitService.create({ name: formData.name, description: formData.description || null });
      toast({ title: "Success", description: "Unit added successfully" });
      setFormData({ name: "", description: "" });
      setOpen(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to add unit" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await unitService.delete(id);
      toast({ title: "Deleted", description: "Unit removed successfully" });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to remove unit" });
    }
  };

  const openEditDialog = (unit: Unit) => {
    setSelectedUnit(unit);
    setEditForm({ name: unit.name, description: unit.description ?? "" });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    setIsEditSubmitting(true);
    try {
      await unitService.update(selectedUnit.id, {
        name: editForm.name,
        description: editForm.description || null,
      });
      toast({ title: "Updated", description: "Unit updated successfully" });
      setEditOpen(false);
      setSelectedUnit(null);
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to update unit" });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Unit Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage measurement units for your products</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Unit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Unit Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Kilogram, Liter, Piece"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Unit"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">All Units ({units.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <LocalLoader loaderKey="units">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>{unit.description || "-"}</TableCell>
                    <TableCell>
                      {unit.createdAt ? format(new Date(unit.createdAt), "PP") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(unit)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteButton
                          onDelete={() => handleDelete(unit.id)}
                          itemName={unit.name}
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Unit Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Short Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isEditSubmitting}>
              {isEditSubmitting ? "Updating..." : "Update Unit"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Units;

