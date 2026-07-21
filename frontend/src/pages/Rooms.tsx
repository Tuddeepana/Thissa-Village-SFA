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
import { Pencil, Plus, Crown, Calendar, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DeleteButton } from "@/components/common";
import LocalLoader from "@/components/common/LocalLoader";
import { useQuery } from "@tanstack/react-query";
import { roomService } from "@/api/services/roomService";
import { roomTypeService } from "@/api/services/roomTypeService";
import type { Room, ExpandedRoomItem } from "@/types/room.types";
import type { RoomType } from "@/types/room-type.types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const Rooms = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<ExpandedRoomItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    roomTypeId: "",
    quantity: 1,
    price_full_day: 0,
    price_short_time: 0
  });
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    roomTypeId: "",
    quantity: 1,
    price_full_day: 0,
    price_short_time: 0
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

  const { data: roomTypesData } = useQuery({
    queryKey: ["room-types"],
    queryFn: async () => {
      const response = await roomTypeService.list();
      return response.roomTypes;
    },
    staleTime: 10_000,
  });

  // Set default room type when loaded
  useEffect(() => {
    if (roomTypesData && roomTypesData.length > 0 && !formData.roomTypeId) {
      setFormData(prev => ({ ...prev, roomTypeId: roomTypesData[0].id }));
    }
  }, [roomTypesData]);

  useEffect(() => {
    if (data) setRooms(data);
  }, [data]);

  useEffect(() => {
    if (expandedData) setExpandedRooms(expandedData);
  }, [expandedData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await roomService.create({
        name: formData.name,
        roomTypeId: formData.roomTypeId,
        quantity: formData.quantity,
        price_full_day: formData.price_full_day,
        price_short_time: formData.price_short_time
      });
      toast({ title: "Success", description: "Room added successfully" });
      setFormData({ name: "", roomTypeId: roomTypesData?.[0]?.id || "", quantity: 1, price_full_day: 0, price_short_time: 0 });
      setOpen(false);
      refetch();
      refetchExpanded();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({ title: "Error", description: error?.response?.data?.message ?? "Failed to add room" });
    } finally {
      setIsSubmitting(false);
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
      roomTypeId: room.roomTypeId,
      quantity: room.quantity,
      price_full_day: typeof room.price_full_day === 'string' ? parseFloat(room.price_full_day) : room.price_full_day,
      price_short_time: typeof room.price_short_time === 'string' ? parseFloat(room.price_short_time) : room.price_short_time
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setIsEditSubmitting(true);
    try {
      await roomService.update(selectedRoom.id, {
        name: editForm.name,
        roomTypeId: editForm.roomTypeId,
        quantity: editForm.quantity,
        price_full_day: editForm.price_full_day,
        price_short_time: editForm.price_short_time,
      });
      toast({ title: "Updated", description: "Room updated successfully" });
      setEditOpen(false);
      setSelectedRoom(null);
      refetch();
      refetchExpanded();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({ title: "Error", description: error?.response?.data?.message ?? "Failed to update room" });
    } finally {
      setIsEditSubmitting(false);
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
                <Label htmlFor="roomTypeId">Room Type</Label>
                <Select
                  value={formData.roomTypeId}
                  onValueChange={(val) => {
                    const selectedType = roomTypesData?.find(rt => rt.id === val);
                    setFormData({ 
                      ...formData, 
                      roomTypeId: val,
                      price_full_day: selectedType?.price_full_day || formData.price_full_day,
                      price_short_time: selectedType?.price_short_time || formData.price_short_time
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypesData?.map((rt) => (
                      <SelectItem key={rt.id} value={rt.id}>{rt.type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_full_day" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Full Day Price (Rs.)
                  </Label>
                  <Input
                    id="price_full_day"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_full_day}
                    onChange={(e) => setFormData({ ...formData, price_full_day: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder="Per night"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_short_time" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Short Time Price (Rs.)
                  </Label>
                  <Input
                    id="price_short_time"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_short_time}
                    onChange={(e) => setFormData({ ...formData, price_short_time: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder="Per hour/session"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Room"}
              </Button>
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
                  <TableHead>Quantity</TableHead>
                  <TableHead>Full Day Price</TableHead>
                  <TableHead>Short Time Price</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>
                      {room.room_type.toLowerCase() === 'vip' ? (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                          <Crown className="h-3 w-3 mr-1" />
                          {room.room_type}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{room.room_type}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{room.quantity}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1 text-purple-700">
                        <Calendar className="h-3 w-3" />
                        Rs. {Number(room.price_full_day).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1 text-blue-700">
                        <Clock className="h-3 w-3" />
                        Rs. {Number(room.price_short_time).toFixed(2)}
                      </div>
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
                  {room.room_type.toLowerCase() === 'vip' && (
                    <Crown className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                  )}
                  <p className="font-semibold text-sm">{room.displayName}</p>
                  <p className={`text-xs mt-1 ${room.room_type.toLowerCase() === 'vip' ? 'text-amber-600' : 'text-muted-foreground'}`}>{room.room_type}</p>
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
              <Label htmlFor="edit-roomTypeId">Room Type</Label>
              <Select
                value={editForm.roomTypeId}
                onValueChange={(val) => {
                  const selectedType = roomTypesData?.find(rt => rt.id === val);
                  setEditForm({ 
                    ...editForm, 
                    roomTypeId: val,
                    price_full_day: selectedType ? selectedType.price_full_day : editForm.price_full_day,
                    price_short_time: selectedType ? selectedType.price_short_time : editForm.price_short_time
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypesData?.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id}>{rt.type}</SelectItem>
                  ))}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price_full_day" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Full Day Price (Rs.)
                </Label>
                <Input
                  id="edit-price_full_day"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price_full_day === 0 ? "" : editForm.price_full_day}
                  onChange={(e) => setEditForm({ ...editForm, price_full_day: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })}
                  required
                  placeholder="Per night"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price_short_time" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Short Time Price (Rs.)
                </Label>
                <Input
                  id="edit-price_short_time"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price_short_time === 0 ? "" : editForm.price_short_time}
                  onChange={(e) => setEditForm({ ...editForm, price_short_time: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })}
                  required
                  placeholder="Per hour/session"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isEditSubmitting}>
              {isEditSubmitting ? "Updating..." : "Update Room"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Rooms;

