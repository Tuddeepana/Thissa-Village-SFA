import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Profile = () => {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">User Profile</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage your account information</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm md:text-base text-muted-foreground">Profile management features coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
