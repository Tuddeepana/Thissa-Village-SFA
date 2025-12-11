import { useState } from "react";
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

interface Category {
  id: number;
  name: string;
  description: string;
  createdDate: string;
}

const Categories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 1,
      name: "Red Wine",
      description: "Full-bodied red wines from various regions",
      createdDate: "2024-01-15",
    },
    {
      id: 2,
      name: "White Wine",
      description: "Crisp and refreshing white wines",
      createdDate: "2024-01-16",
    },
    {
      id: 3,
      name: "Sparkling Wine",
      description: "Champagne and sparkling varieties",
      createdDate: "2024-01-17",
    },
  ]);

  const [formData, setFormData] = useState({ name: "", description: "" });
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCategory: Category = {
      id: categories.length + 1,
      name: formData.name,
      description: formData.description,
      createdDate: new Date().toISOString().split("T")[0],
    };
    setCategories([...categories, newCategory]);
    setFormData({ name: "", description: "" });
    setOpen(false);
    toast({
      title: "Success",
      description: "Category added successfully",
    });
  };

  const handleDelete = (id: number) => {
    setCategories(categories.filter((cat) => cat.id !== id));
    toast({
      title: "Deleted",
      description: "Category removed successfully",
    });
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
                  required
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.id}</TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description}</TableCell>
                  <TableCell>{category.createdDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Categories;
