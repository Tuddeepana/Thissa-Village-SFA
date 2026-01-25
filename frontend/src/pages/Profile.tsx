import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  Mail,
  Calendar,
  Shield,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/api/services/authService";
import api from "@/api/client";

type BackendUser = {
  id: string;
  email: string;
  name: string;
  nic: string;
  role: 'ADMIN' | 'CASHIER';
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

const Profile = () => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [editedName, setEditedName] = useState('');
  const [editedNic, setEditedNic] = useState('');

  const roleLabel = useMemo(() => {
    if (!user) return '';
    return user.role === 'ADMIN' ? 'Administrator' : 'Cashier';
  }, [user]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const me = await authService.me();
        if (!mounted) return;

        setUser(me as BackendUser);
        setEditedEmail(me.email ?? '');
        setEditedName(me.name ?? '');
        setEditedNic(me.nic ?? '');
      } catch (err: any) {
        if (!mounted) return;
        const msg = err?.response?.data?.message ?? 'Failed to load profile';
        setLoadError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Password validation
  const passwordsMatch = newPassword === confirmPassword;
  const isPasswordValid = newPassword.length >= 6;
  const canChangePassword = currentPassword && newPassword && confirmPassword && passwordsMatch && isPasswordValid;

  const handleChangePassword = async () => {
    if (!canChangePassword) return;
    toast.info('Password change isn\'t wired up yet', {
      description: 'Backend endpoint for changing password is not available currently.',
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const res = await api.put('/users/me', {
        email: editedEmail,
        name: editedName,
        nic: editedNic,
      });
      const updated = res.data?.data ?? res.data?.data?.data ?? res.data?.data;
      // In this project, API responses are usually { success, data }
      const updatedUser = (updated?.user ?? updated) as BackendUser;
      setUser(updatedUser);
      setIsEditingProfile(false);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to update profile';
      toast.error(msg);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditedEmail(user.email ?? '');
      setEditedName(user.name ?? '');
      setEditedNic(user.nic ?? '');
    }
    setIsEditingProfile(false);
  };

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6 max-w-4xl">
        <h1 className="text-xl md:text-3xl font-bold text-foreground">User Profile</h1>
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6 max-w-4xl">
        <h1 className="text-xl md:text-3xl font-bold text-foreground">User Profile</h1>
        <p className="text-sm text-destructive">{loadError ?? 'Profile not available'}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-bold text-foreground">User Profile</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage your account information and security settings
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Your account details and information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                {/* Backend doesn’t store profile images yet */}
                <AvatarImage src={''} alt={user.name} />
                <AvatarFallback className="text-2xl md:text-3xl bg-primary text-primary-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                {roleLabel}
              </Badge>
            </div>

            {/* User Info Section */}
            <div className="flex-1 space-y-4">
              {/* Username - Read Only */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name
                </Label>
                <div className="flex items-center gap-2">
                  {isEditingProfile ? (
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="max-w-xs"
                    />
                  ) : (
                    <Input value={user.name} disabled className="bg-muted max-w-xs" />
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                {isEditingProfile ? (
                  <Input
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    className="max-w-xs"
                  />
                ) : (
                  <p className="text-sm font-medium">{user.email}</p>
                )}
              </div>

              {/* NIC */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground">#</span>
                  NIC
                </Label>
                {isEditingProfile ? (
                  <Input
                    value={editedNic}
                    onChange={(e) => setEditedNic(e.target.value)}
                    className="max-w-xs"
                  />
                ) : (
                  <p className="text-sm font-medium">{user.nic}</p>
                )}
              </div>

              {/* Account Created */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Account Created
                </Label>
                <p className="text-sm font-medium">
                  {new Date(user.createdAt ?? Date.now()).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Edit/Save Buttons */}
              <div className="pt-4">
                {isEditingProfile ? (
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile}>Save Changes</Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setIsEditingProfile(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {newPassword && !isPasswordValid && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Password must be at least 6 characters
                </p>
              )}
              {newPassword && isPasswordValid && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Password strength: Good
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Passwords do not match
                </p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Change Password Button */}
            <div className="pt-4">
              <Button
                onClick={handleChangePassword}
                disabled={!canChangePassword || isChangingPassword}
                className="w-full sm:w-auto"
              >
                {isChangingPassword ? "Changing Password..." : "Change Password"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Last Login</p>
              <p className="font-medium">Not available</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Account Status</p>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <p className={`font-medium ${user.status === 'Active' ? 'text-green-600' : 'text-yellow-600'}`}>{user.status}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
