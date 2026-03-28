import { useState } from "react";
import logo from "@/assets/images/village-bar-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLoginMutation } from "@/store/api/authApi";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";

const Auth = () => {
  const [isLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!isLogin) {
        // implement register via users/register
        toast({ title: "Info", description: "Sign up not implemented. Use an admin to register." });
        return;
      }
      const res = await login({ email, password }).unwrap();

      // Comprehensive debug logging
      console.log("=== LOGIN DEBUG ===");
      console.log("Full response:", res);
      console.log("User object:", res.user);
      console.log("User role:", res.user?.role);
      console.log("Token:", res.token);
      console.log("==================");

      // Dispatch to Redux store
      dispatch(setCredentials({
        user: res.user,
        token: res.token
      }));

      // Verify Redux store after dispatch
      console.log("=== AFTER REDUX DISPATCH ===");
      console.log("localStorage authUser:", localStorage.getItem('authUser'));
      console.log("============================");

      toast({ title: "Welcome!", description: "Successfully logged in" });
      navigate("/modules");
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      const msg = error?.data?.message || "Invalid credentials";
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-background border shadow-sm">
              <img src={logo} alt="Village Bar Logo" className="w-full h-full object-contain p-1" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Village Bar</CardTitle>
          <CardDescription className="text-base">
            {isLogin ? "Welcome back to your village bar management system" : "Create your account"}
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
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Signing In..." : (isLogin ? "Sign In" : "Create Account")}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
