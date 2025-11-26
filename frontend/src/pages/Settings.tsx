import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-sm md:text-base text-muted-foreground">Configure your application preferences</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm md:text-base text-muted-foreground">Settings options coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
