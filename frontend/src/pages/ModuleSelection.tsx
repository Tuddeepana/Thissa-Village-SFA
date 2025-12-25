import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { STORAGE_KEYS, ROLES } from "@/utils/constants";
import { User } from "@/types/user.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wine, ShoppingCart, LayoutDashboard, Package, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ModuleSelection = () => {
  const navigate = useNavigate();

  const handleModuleSelect = (module: string) => {
    localStorage.setItem(STORAGE_KEYS.selectedModule, module);
    if (module === "sfa") {
      navigate("/dashboard");
    } else {
      navigate("/pos");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.isAuthenticated);
    localStorage.removeItem(STORAGE_KEYS.selectedModule);
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    navigate("/auth");
  };

  const authUser = useMemo<User | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    try { return raw ? (JSON.parse(raw) as User) : null; } catch { return null; }
  }, []);
  const isAdmin = authUser?.role === ROLES.ADMIN;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Wine className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-primary">Welcome to VinoPro</h1>
          <p className="text-muted-foreground text-lg">Select a module to continue</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* SFA Module Card */}
          {isAdmin && (
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary group"
            onClick={() => handleModuleSelect("sfa")}
          >
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <LayoutDashboard className="w-10 h-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">SFA Module</CardTitle>
              <CardDescription className="text-base">
                Sales Force Automation System
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <LayoutDashboard className="w-4 h-4 text-primary" />
                <span>Dashboard & Analytics</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Package className="w-4 h-4 text-primary" />
                <span>Product & Category Management</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <FileText className="w-4 h-4 text-primary" />
                <span>Invoice Management</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-primary" />
                <span>Low Stock Alerts</span>
              </div>
              <Button className="w-full mt-4" size="lg">
                Enter SFA Module
              </Button>
            </CardContent>
          </Card>
          )}

          {/* POS Module Card */}
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary group"
            onClick={() => handleModuleSelect("pos")}
          >
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <ShoppingCart className="w-10 h-10 text-accent" />
                </div>
              </div>
              <CardTitle className="text-2xl">POS Module</CardTitle>
              <CardDescription className="text-base">
                Point of Sale Billing System
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <ShoppingCart className="w-4 h-4 text-accent" />
                <span>Quick Billing Interface</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Package className="w-4 h-4 text-accent" />
                <span>Product Search & Selection</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <FileText className="w-4 h-4 text-accent" />
                <span>Receipt Generation</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-accent" />
                <span>Real-time Stock Updates</span>
              </div>
              <Button className="w-full mt-4" size="lg" variant="secondary">
                Enter POS Module
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModuleSelection;
