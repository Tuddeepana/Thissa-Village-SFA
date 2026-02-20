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
import { roomService } from "@/api/services/roomService";
import type { Room, ExpandedRoomItem } from "@/types/room.types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const Rooms = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<ExpandedRoomItem[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    room_type: "NORMAL" as 'VIP' | 'NORMAL',
    quantity: 1
  });
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    room_type: "NORMAL" as 'VIP' | 'NORMAL',
    quantity: 1
  });

  const { data, refetch } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const response = await roomService.list();
      return response.rooms;
    },
    staleTime: 10_000,
  });

  const { data: expandedData, refetch: refetchExpanded } = useQuery({
    queryKey: ["rooms-expanded"],
    queryFn: async () => {
      const response = await roomService.getExpanded();
      return response.rooms;
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (data) setRooms(data);
  }, [data]);

  useEffect(() => {
    if (expandedData) setExpandedRooms(expandedData);
  }, [expandedData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await roomService.create({
        name: formData.name,
        room_type: formData.room_type,
        quantity: formData.quantity
      });
      toast({ title: "Success", description: "Room added successfully" });
      setFormData({ name: "", room_type: "NORMAL", quantity: 1 });
      setOpen(false);
      refetch();
      refetchExpanded();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({ title: "Error", description: error?.response?.data?.message ?? "Failed to add room" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await roomService.delete(id);
      toast({ title: "Deleted", description: "Room removed successfully" });
      refetch();
      refetchExpanded();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({ title: "Error", description: error?.response?.data?.message ?? "Failed to remove room" });
    }
  };

  const openEditDialog = (room: Room) => {
    setSelectedRoom(room);
    setEditForm({
      name: room.name,
      room_type: room.room_type,
      quantity: room.quantity
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    try {
      await roomService.update(selectedRoom.id, {
        name: editForm.name,
        room_type: editForm.room_type,
        quantity: editForm.quantity,
      });
      toast({ title: "Updated", description: "Room updated successfully" });
      setEditOpen(false);
      setSelectedRoom(null);
      refetch();
      refetchExpanded();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({ title: "Error", description: error?.response?.data?.message ?? "Failed to update room" });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Room Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage hotel rooms and accommodations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Room, VIP Room, Deluxe Room"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room_type">Room Type</Label>
                <Select
                  value={formData.room_type}
                  onValueChange={(val: 'VIP' | 'NORMAL') => setFormData({ ...formData, room_type: val })}
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
              <Button type="submit" className="w-full">Add Room</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Configuration Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Room Configuration ({rooms.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <LocalLoader loaderKey="rooms">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>
                      {room.room_type === 'VIP' ? (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                          <Crown className="h-3 w-3 mr-1" />
                          VIP
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {room.createdAt ? format(new Date(room.createdAt), "PP") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(room)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteButton
                          onDelete={() => handleDelete(room.id)}
                          itemName={room.name}
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

      {/* Expanded Room List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">All Rooms ({expandedRooms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {expandedRooms.map((room) => (
              <Card
                key={room.id}
                className={`${
                  room.room_type === 'VIP' 
                    ? 'border-amber-200 bg-amber-50/50' 
                    : 'border-gray-200'
                }`}
              >
                <CardContent className="p-4 text-center">
                  {room.room_type === 'VIP' && (
                    <Crown className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                  )}
                  <p className="font-semibold text-sm">{room.displayName}</p>
                  {room.room_type === 'VIP' && (
                    <p className="text-xs text-amber-600 mt-1">VIP</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {expandedRooms.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No rooms created yet. Add a room to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Room Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-room_type">Room Type</Label>
              <Select
                value={editForm.room_type}
                onValueChange={(val: 'VIP' | 'NORMAL') => setEditForm({ ...editForm, room_type: val })}
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
                Changing quantity will update the number of rooms displayed
              </p>
            </div>
            <Button type="submit" className="w-full">Update Room</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Rooms;

