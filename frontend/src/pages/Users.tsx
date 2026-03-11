import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Users as UsersIcon,
  UserPlus,
  Pencil,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  CreditCard,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DeleteButton } from "@/components/common";
import {
  useGetUsersQuery,
  useRegisterMutation,
  useUpdateUserMutation,
  usePermanentDeleteUserMutation
} from "@/store/api/authApi";
import type { User, Role } from "@/types/user.types";

// Helper mappers for role/status casing
const toBackendRole = (role: "admin" | "cashier"): Role =>
  role === "admin" ? "ADMIN" : "CASHIER";
const toBackendStatus = (status: string | undefined) =>
  status === "active" ? "Active" : status === "inactive" ? "Inactive" : undefined;

const Users = () => {
  // Filter and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // RTK Query hooks
  const { data: usersData } = useGetUsersQuery({
    search: searchQuery || undefined,
    role: roleFilter !== "all" ? toBackendRole(roleFilter as "admin" | "cashier") : undefined,
    status: toBackendStatus(statusFilter),
    page: currentPage,
    limit: itemsPerPage,
  });

  const [registerUser] = useRegisterMutation();
  const [updateUser] = useUpdateUserMutation();
  const [permanentDeleteUser] = usePermanentDeleteUserMutation();

  // Memoize users array to prevent useMemo dependency issues
  const users = useMemo(() => usersData?.items ?? [], [usersData?.items]);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formNic, setFormNic] = useState("");
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "cashier">("cashier");
  const [showPassword, setShowPassword] = useState(false);

  // Filter users (server applies most filters; local guard remains for UI-side checks)
  const filteredUsers = users; // RTK Query already filters on server

  // Use server-side pagination
  const totalPages = usersData?.totalPages ?? 1;
  const paginatedUsers = users; // Already paginated by server

  // Statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const adminCount = users.filter((u) => u.role === "ADMIN").length;
    const cashierCount = users.filter((u) => u.role === "CASHIER").length;
    const activeCount = users.filter((u) => u.status === "Active").length;
    const inactiveCount = users.filter((u) => u.status === "Inactive").length;
    return { totalUsers, adminCount, cashierCount, activeCount, inactiveCount };
  }, [users]);

  const resetForm = () => {
    setFormEmail("");
    setFormPassword("");
    setFormNic("");
    setFormName("");
    setFormRole("cashier");
    setShowPassword(false);
  };

  const handleAddUser = async () => {
    if (!formEmail || !formPassword || !formNic || !formName) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await registerUser({
        email: formEmail,
        password: formPassword,
        name: formName,
        nic: formNic,
        role: toBackendRole(formRole),
      }).unwrap();
      toast.success("User created successfully!");
      setIsAddDialogOpen(false);
      resetForm();
    } catch (e: unknown) {
      const error = e as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to create user");
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    if (!formEmail || !formNic || !formName) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await updateUser({
        id: selectedUser.id,
        data: {
          email: formEmail,
          password: formPassword || undefined,
          name: formName,
          nic: formNic,
          role: toBackendRole(formRole),
        }
      }).unwrap();
      toast.success("User updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
    } catch (e: unknown) {
      const error = e as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to update user");
    }
  };

  const handleToggleStatus = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";
    try {
      await updateUser({
        id: userId,
        data: { status: nextStatus }
      }).unwrap();
      toast.success(`User ${nextStatus === 'Active' ? 'activated' : 'deactivated'} successfully!`);
    } catch (e: unknown) {
      const error = e as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to update status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await permanentDeleteUser(userId).unwrap();
      toast.success("User deleted successfully!");
    } catch (e: unknown) {
      const error = e as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to delete user");
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormEmail(user.email);
    setFormPassword("");
    setFormNic(user.nic);
    setFormName(user.name ?? "");
    setFormRole(toUIRole(user.role));
    setIsEditDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };


  const getRoleBadge = (role: Role) => {
    if (role === "ADMIN") {
      return (
        <Badge className="bg-purple-100 text-purple-800">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800">
        <Shield className="h-3 w-3 mr-1" />
        Cashier
      </Badge>
    );
  };

  const getStatusBadge = (status: string | undefined) => {
    if (status === "Active") {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
  };

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Users Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage admin and cashier accounts
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-purple-600">
              {stats.adminCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Cashiers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-blue-600">
              {stats.cashierCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-green-600">
              {stats.activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Inactive
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-red-600">
              {stats.inactiveCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Search className="h-4 w-4 md:h-5 md:w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Email or NIC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 md:h-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9 md:h-10">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 md:h-10">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm hidden md:block">&nbsp;</Label>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full h-9 md:h-10"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <UsersIcon className="h-4 w-4 md:h-5 md:w-5" />
            Users ({filteredUsers.length})
            {totalPages > 1 && (
              <span className="text-xs md:text-sm font-normal text-muted-foreground">
                - Page {currentPage} of {totalPages}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          {/* Desktop Table */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead className="text-center">Role</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UsersIcon className="h-12 w-12" />
                        <p>No users found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {user.nic}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {user.createdAt ? format(new Date(user.createdAt), "MMM dd, yyyy") : "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={user.status === "Active"}
                          onCheckedChange={() => handleToggleStatus(user.id)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DeleteButton
                            onDelete={() => handleDeleteUser(user.id)}
                            itemName={user.email}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {paginatedUsers.length === 0 ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
                <UsersIcon className="h-12 w-12" />
                <p>No users found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              paginatedUsers.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-3 space-y-3 bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        NIC: {user.nic}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Active</Label>
                      <Switch
                        checked={user.status === "Active"}
                        onCheckedChange={() => handleToggleStatus(user.id)}
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <DeleteButton
                        onDelete={() => handleDeleteUser(user.id)}
                        itemName={user.email}
                        size="sm"
                        showText
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-4">
              <div className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{" "}
                {filteredUsers.length} users
              </div>

              {/* Mobile Pagination */}
              <div className="flex md:hidden items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="h-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Desktop Pagination */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new admin or cashier account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nic">NIC Number *</Label>
              <Input
                id="nic"
                placeholder="Enter NIC number"
                value={formNic}
                onChange={(e) => setFormNic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formRole} onValueChange={(val: "admin" | "cashier") => setFormRole(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setSelectedUser(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user account details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="user@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">Password (leave empty to keep current)</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-nic">NIC Number *</Label>
              <Input
                id="edit-nic"
                placeholder="Enter NIC number"
                value={formNic}
                onChange={(e) => setFormNic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                placeholder="Enter full name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role *</Label>
              <Select value={formRole} onValueChange={(val: "admin" | "cashier") => setFormRole(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedUser(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;

