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
import type { RoomType } from "@/types/room-type.types";
import { format } from "date-fns";

const RoomTypes = () => {
  const { toast } = useToast();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [formData, setFormData] = useState({ type: "", description: "", price_full_day: 0, price_short_time: 0 });
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [editForm, setEditForm] = useState({ type: "", description: "", price_full_day: 0, price_short_time: 0 });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["roomTypes"],
    queryFn: async () => {
      const result = await roomTypeService.list();
      return result.roomTypes;
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (data) setRoomTypes(data);
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await roomTypeService.create({ 
        type: formData.type, 
        description: formData.description || undefined,
        price_full_day: Number(formData.price_full_day),
        price_short_time: Number(formData.price_short_time),
      });
      toast({ title: "Success", description: "Room Type added successfully" });
      setFormData({ type: "", description: "", price_full_day: 0, price_short_time: 0 });
      setOpen(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to add room type" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await roomTypeService.softDelete(id);
      toast({ title: "Deleted", description: "Room Type removed successfully" });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to remove room type" });
    }
  };

  const openEditDialog = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setEditForm({ 
      type: roomType.type, 
      description: roomType.description ?? "",
      price_full_day: roomType.price_full_day,
      price_short_time: roomType.price_short_time,
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomType) return;
    setIsEditSubmitting(true);
    try {
      await roomTypeService.update(selectedRoomType.id, {
        type: editForm.type,
        description: editForm.description || null,
        price_full_day: Number(editForm.price_full_day),
        price_short_time: Number(editForm.price_short_time),
      });
      toast({ title: "Updated", description: "Room Type updated successfully" });
      setEditOpen(false);
      setSelectedRoomType(null);
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to update room type" });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Room Type Configuration</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage room types and their pricing</p>
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
                <Label htmlFor="type">Type Name</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g. Normal, VIP"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_full_day">Full Day Price</Label>
                  <Input
                    id="price_full_day"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_full_day || ""}
                    onChange={(e) => setFormData({ ...formData, price_full_day: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_short_time">Short Time Price</Label>
                  <Input
                    id="price_short_time"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_short_time || ""}
                    onChange={(e) => setFormData({ ...formData, price_short_time: Number(e.target.value) })}
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
          <LocalLoader loaderKey="room-types" isLoading={isLoading}>
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
              {roomTypes.map((roomType) => (
                <TableRow key={roomType.id}>
                  <TableCell className="font-medium">{roomType.type}</TableCell>
                  <TableCell>{Number(roomType.price_full_day).toFixed(2)}</TableCell>
                  <TableCell>{Number(roomType.price_short_time).toFixed(2)}</TableCell>
                  <TableCell>{roomType.description ?? '-'}</TableCell>
                  <TableCell>{roomType.createdAt ? format(new Date(roomType.createdAt), 'yyyy-MM-dd') : '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(roomType)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DeleteButton
                        onDelete={() => handleDelete(roomType.id)}
                        itemName={roomType.type}
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
            setSelectedRoomType(null);
            setEditForm({ type: "", description: "", price_full_day: 0, price_short_time: 0 });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type Name</Label>
              <Input
                id="edit-type"
                value={editForm.type}
                onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_price_full_day">Full Day Price</Label>
                <Input
                  id="edit_price_full_day"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price_full_day || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, price_full_day: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_price_short_time">Short Time Price</Label>
                <Input
                  id="edit_price_short_time"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price_short_time || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, price_short_time: Number(e.target.value) }))}
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
