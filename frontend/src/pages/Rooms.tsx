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
import type { RoomTypeConfig } from "@/types/room-type.types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const Rooms = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<ExpandedRoomItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Default form values
  const [formData, setFormData] = useState({
    name: "",
    room_types: [] as string[],
    quantity: 1,
  });
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    room_types: [] as string[],
    quantity: 1,
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

  // Room types from API
  const { data: roomTypeData } = useQuery({
    queryKey: ["room-types"],
    queryFn: async () => {
      const { roomTypes } = await roomTypeService.list();
      return roomTypes;
    },
    staleTime: 10_000,
  });

  const [roomTypes, setRoomTypes] = useState<RoomTypeConfig[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | string>('ALL');

  useEffect(() => {
    if (roomTypeData) {
      setRoomTypes(roomTypeData);
      if (formData.room_types.length === 0 && roomTypeData.length > 0) {
        const defaultType = roomTypeData.find((rt) => rt.type === 'NORMAL') ?? roomTypeData[0];
        setFormData((prev) => ({ ...prev, room_types: [defaultType.type] }));
      }
    }
  }, [roomTypeData]);

  const getTypePrices = (type: string) => {
    const rt = (roomTypes || []).find((r) => (r.type || '').toUpperCase() === type.toUpperCase());
    return { full: rt?.price_full_day ?? null, short: rt?.price_short_time ?? null };
  };

  const filteredRooms = rooms.filter((r) => filterType === 'ALL' || (r.room_types || []).includes(filterType));
  const filteredExpandedRooms = expandedRooms.filter((r) => filterType === 'ALL' || (r.room_types || []).includes(filterType));

  const toggleFormRoomType = (type: string) => {
    setFormData(prev => {
      const types = prev.room_types;
      if (types.includes(type)) return { ...prev, room_types: types.filter(t => t !== type) };
      return { ...prev, room_types: [...types, type] };
    });
  };

  const toggleEditFormRoomType = (type: string) => {
    setEditForm(prev => {
      const types = prev.room_types;
      if (types.includes(type)) return { ...prev, room_types: types.filter(t => t !== type) };
      return { ...prev, room_types: [...types, type] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.room_types.length === 0) {
      toast({ title: "Validation Error", description: "Please select at least one room type." });
      return;
    }
    setIsSubmitting(true);
    try {
      await roomService.create({
        name: formData.name,
        room_types: formData.room_types,
        quantity: formData.quantity,
      });
      toast({ title: "Success", description: "Room added successfully" });
      const defaultType = roomTypes.find((rt) => rt.type === 'NORMAL') ?? roomTypes[0];
      setFormData({ name: "", room_types: [defaultType?.type ?? "NORMAL"], quantity: 1 });
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
      room_types: room.room_types || [],
      quantity: room.quantity,
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    if (editForm.room_types.length === 0) {
      toast({ title: "Validation Error", description: "Please select at least one room type." });
      return;
    }
    setIsEditSubmitting(true);
    try {
      await roomService.update(selectedRoom.id, {
        name: editForm.name,
        room_types: editForm.room_types,
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
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const renderTypeBadge = (type: string) => {
    if (type === 'VIP') {
      return (
        <Badge key={type} className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs">
          <Crown className="h-3 w-3 mr-1" />
          VIP
        </Badge>
      );
    }
    return <Badge key={type} variant="secondary" className="text-xs">{type}</Badge>;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Room Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage hotel rooms and accommodations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-sm text-muted-foreground mr-2">Filter by Type</div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v)}>
            <SelectTrigger className="h-9 md:h-10 w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {roomTypes.map((rt) => (
                <SelectItem key={rt.id} value={rt.type}>{rt.type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                <Label>Assigned Room Types</Label>
                <div className="flex flex-wrap gap-2">
                  {roomTypes.map((rt) => {
                    const isSelected = formData.room_types.includes(rt.type);
                    return (
                      <Badge
                        key={rt.id}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => toggleFormRoomType(rt.type)}
                      >
                        {rt.type}
                      </Badge>
                    );
                  })}
                </div>
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
                  <TableHead>Assigned Types</TableHead>
                  <TableHead>Full Day (Rs)</TableHead>
                  <TableHead>Short Time (Rs)</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {(room.room_types || []).map(type => (
                          <div key={type} className="h-6 flex items-center">
                            {renderTypeBadge(type)}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {(room.room_types || []).map(type => {
                          const prices = getTypePrices(type);
                          return (
                            <div key={type} className="h-6 flex items-center gap-1 text-sm text-muted-foreground font-medium">
                              <Calendar className="h-3.5 w-3.5 text-purple-600"/>
                              {Number(prices.full ?? 0).toFixed(2)}
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {(room.room_types || []).map(type => {
                          const prices = getTypePrices(type);
                          return (
                            <div key={type} className="h-6 flex items-center gap-1 text-sm text-muted-foreground font-medium">
                              <Clock className="h-3.5 w-3.5 text-blue-600"/>
                              {Number(prices.short ?? 0).toFixed(2)}
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{room.quantity}</TableCell>
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
            {filteredExpandedRooms.map((room) => {
              const typesString = (room.room_types || []).join(', ');
              const hasVIP = (room.room_types || []).includes('VIP');
              return (
                <Card key={room.id} className={`${
                    hasVIP ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200'
                  }`}>
                  <CardContent className="p-4 text-center">
                    {hasVIP && <Crown className="h-4 w-4 text-amber-600 mx-auto mb-1" />}
                    <p className="font-semibold text-sm">{room.displayName}</p>
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {(room.room_types || []).map(t => renderTypeBadge(t))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
              <Label>Assigned Room Types</Label>
              <div className="flex flex-wrap gap-2">
                {roomTypes.map((rt) => {
                  const isSelected = editForm.room_types.includes(rt.type);
                  return (
                    <Badge
                      key={rt.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => toggleEditFormRoomType(rt.type)}
                    >
                      {rt.type}
                    </Badge>
                  );
                })}
              </div>
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
