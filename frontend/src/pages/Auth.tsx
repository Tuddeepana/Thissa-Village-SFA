import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Wine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/api/services/authService";
import { STORAGE_KEYS } from "@/utils/constants";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!isLogin) {
        // implement register via users/register
        toast({ title: "Info", description: "Sign up not implemented. Use an admin to register." });
        return;
      }
      const res = await authService.login({ email, password });
      console.log("Login response:", email,password, res);
      localStorage.setItem(STORAGE_KEYS.isAuthenticated, "true");
      localStorage.setItem(STORAGE_KEYS.token, res.token);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(res.user));
      toast({ title: "Welcome!", description: "Successfully logged in" });
      navigate("/modules");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Invalid credentials";
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Wine className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Thissa Village</CardTitle>
          <CardDescription className="text-base">
            {isLogin ? "Welcome back to your wine management system" : "Create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
