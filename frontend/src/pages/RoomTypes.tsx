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
import { roomTypeService } from "@/api/services/roomTypeService";
import type { RoomTypeConfig } from "@/types/room-type.types";
import { format } from "date-fns";

const RoomTypes = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<RoomTypeConfig[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [formData, setFormData] = useState({ type: "", price_full_day: "", price_short_time: "", description: "" });
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<RoomTypeConfig | null>(null);
  const [editForm, setEditForm] = useState({ type: "", price_full_day: "", price_short_time: "", description: "" });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["room-types"],
    queryFn: async () => {
      const { roomTypes } = await roomTypeService.list();
      return roomTypes;
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await roomTypeService.create({
        type: formData.type,
        price_full_day: parseFloat(formData.price_full_day as any) || 0,
        price_short_time: parseFloat(formData.price_short_time as any) || 0,
        description: formData.description || null,
      });
      toast({ title: "Success", description: "Room type added successfully" });
      setFormData({ type: "", price_full_day: "", price_short_time: "", description: "" });
      setOpen(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to add room type" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await roomTypeService.softDelete(id);
      toast({ title: "Deleted", description: "Room type removed successfully" });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to remove room type" });
    }
  };

  const openEditDialog = (item: RoomTypeConfig) => {
    setSelected(item);
    setEditForm({ type: item.type, price_full_day: String(item.price_full_day), price_short_time: String(item.price_short_time), description: item.description ?? "" });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setIsEditSubmitting(true);
    try {
      await roomTypeService.update(selected.id, {
        type: editForm.type,
        price_full_day: parseFloat(editForm.price_full_day as any) || 0,
        price_short_time: parseFloat(editForm.price_short_time as any) || 0,
        description: editForm.description || null,
      });
      toast({ title: "Updated", description: "Room type updated successfully" });
      setEditOpen(false);
      setSelected(null);
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to update room type" });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Room Type Configuration</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage room types, prices and descriptions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Room Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Room Type</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_full_day">Full Day Price</Label>
                  <Input
                    id="price_full_day"
                    value={formData.price_full_day}
                    onChange={(e) => setFormData({ ...formData, price_full_day: e.target.value })}
                    type="number"
                    min={0}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_short_time">Short Time Price</Label>
                  <Input
                    id="price_short_time"
                    value={formData.price_short_time}
                    onChange={(e) => setFormData({ ...formData, price_short_time: e.target.value })}
                    type="number"
                    min={0}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Room Type"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">All Room Types</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <LocalLoader loaderKey="roomTypes">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Full Day Price</TableHead>
                  <TableHead>Short Time Price</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.price_full_day?.toFixed?.(2) ?? item.price_full_day}</TableCell>
                    <TableCell>{item.price_short_time?.toFixed?.(2) ?? item.price_short_time}</TableCell>
                    <TableCell>{item.description ?? '-'}</TableCell>
                    <TableCell>{item.createdAt ? format(new Date(item.createdAt), 'yyyy-MM-dd') : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteButton
                          onDelete={() => handleDelete(item.id)}
                          itemName={item.type}
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
      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) {
            setSelected(null);
            setEditForm({ type: "", price_full_day: "", price_short_time: "", description: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Input
                id="edit-type"
                value={editForm.type}
                onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price_full_day">Full Day Price</Label>
                <Input
                  id="edit-price_full_day"
                  value={editForm.price_full_day}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, price_full_day: e.target.value }))}
                  type="number"
                  min={0}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price_short_time">Short Time Price</Label>
                <Input
                  id="edit-price_short_time"
                  value={editForm.price_short_time}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, price_short_time: e.target.value }))}
                  type="number"
                  min={0}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isEditSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isEditSubmitting}>
                {isEditSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomTypes;
