import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Wine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const apiEnv = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env;
      const apiBase = apiEnv?.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiBase}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        const msg = data?.message || "Invalid credentials";
        toast({ title: "Login failed", description: msg, variant: "destructive" });
        return;
      }

      // Expected response: { success: true, message: string, data: { user, token } }
      const token = data?.data?.token;
      const user = data?.data?.user;

      if (!token) {
        toast({ title: "Login failed", description: "No token received", variant: "destructive" });
        return;
      }

      // Persist auth to localStorage (quick/dev approach)
      localStorage.setItem("authToken", token);
      if (user) localStorage.setItem("authUser", JSON.stringify(user));
      localStorage.setItem("isAuthenticated", "true");

      toast({ title: "Welcome!", description: "Successfully logged in" });
      navigate("/modules");
    } catch (err: unknown) {
      console.error("Login error:", err);
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Login error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
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
          <CardTitle className="text-3xl font-bold text-primary">VinoPro</CardTitle>
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
            {
              (() => {
                let buttonLabel = "";
                if (loading) buttonLabel = isLogin ? "Signing in..." : "Creating...";
                else buttonLabel = isLogin ? "Sign In" : "Create Account";
                return (
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {buttonLabel}
                  </Button>
                );
              })()
            }
          </form>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
