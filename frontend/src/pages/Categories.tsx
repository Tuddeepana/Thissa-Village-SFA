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
import { categoryService } from "@/api/services/categoryService";
import type { Category } from "@/types/category.types";
import { format } from "date-fns";

const Categories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({ name: "", description: "" });
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { categories } = await categoryService.list({ page: 1, limit: 100 });
      return categories;
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (data) setCategories(data);
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await categoryService.create({ name: formData.name, description: formData.description || undefined });
      toast({ title: "Success", description: "Category added successfully" });
      setFormData({ name: "", description: "" });
      setOpen(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to add category" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await categoryService.softDelete(id);
      toast({ title: "Deleted", description: "Category removed successfully" });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to remove category" });
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setEditForm({ name: category.name, description: category.description ?? "" });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    try {
      await categoryService.update(selectedCategory.id, {
        name: editForm.name,
        description: editForm.description || null,
      });
      toast({ title: "Updated", description: "Category updated successfully" });
      setEditOpen(false);
      setSelectedCategory(null);
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to update category" });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Category Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Organize your wine inventory by categories</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
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
              <Button type="submit" className="w-full">Add Category</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">All Categories</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <LocalLoader loaderKey="categories">
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
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description ?? '-'}</TableCell>
                  <TableCell>{category.createdAt ? format(new Date(category.createdAt), 'yyyy-MM-dd') : '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DeleteButton
                        onDelete={() => handleDelete(category.id)}
                        itemName={category.name}
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

      {/* Edit Category Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) {
            setSelectedCategory(null);
            setEditForm({ name: "", description: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
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
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
