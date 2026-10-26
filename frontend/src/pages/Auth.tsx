import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/api/services/authService";
import { STORAGE_KEYS } from "@/utils/constants";
import villageLogo from "@/assets/images/village-bar-logo.png";
import wrenixLogo from "@/assets/images/wrenix_logo.png";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  UtensilsCrossed,
  BedDouble,
  BarChart3,
  Receipt,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

const REMEMBER_EMAIL_KEY = "tissa_sfa_remember_email";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // ignore localStorage read error
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState("CapsLock"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.login({ email: email.trim(), password });

      // Save credentials and session tokens
      localStorage.setItem(STORAGE_KEYS.isAuthenticated, "true");
      localStorage.setItem(STORAGE_KEYS.token, res.token);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(res.user));

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      toast({
        title: "Welcome back!",
        description: `Signed in successfully as ${res.user?.name || res.user?.email || "User"}`,
      });

      navigate("/modules");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Invalid email or password. Please verify your credentials.";
      setErrorMessage(msg);
      toast({
        title: "Sign in Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-background overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-70 animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-[28rem] h-[28rem] bg-accent/15 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand & Feature Showcase (Visible on large screens) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-4">
            {/* Header Badge */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hospitality & Restaurant Management Suite</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-card border border-border/70 shadow-md p-2 flex items-center justify-center shrink-0">
                  <img
                    src={villageLogo}
                    alt="Tissa Village Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    Tissa Village
                  </h1>
                  <p className="text-sm font-medium text-muted-foreground">
                    Sales Force Automation & POS System
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg">
                Streamlining orders, table billing, kitchen operations, room reservations,
                and inventory audits into a fast, unified digital workspace.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-xl bg-card/60 backdrop-blur-sm border border-border/60 hover:border-primary/40 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                  <Receipt className="w-4 h-4" />
                </div>
                <h2 className="font-semibold text-sm text-foreground">Rapid POS & Billing</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  High-speed cashier checkout & dual foreigner/local rates
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-card/60 backdrop-blur-sm border border-border/60 hover:border-primary/40 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2.5">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <h2 className="font-semibold text-sm text-foreground">Live Kitchen KOT</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time kitchen order ticket dispatch & progress tracking
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-card/60 backdrop-blur-sm border border-border/60 hover:border-primary/40 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5">
                  <BedDouble className="w-4 h-4" />
                </div>
                <h2 className="font-semibold text-sm text-foreground">Room Management</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full day & short time booking with dynamic pricing
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-card/60 backdrop-blur-sm border border-border/60 hover:border-primary/40 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h2 className="font-semibold text-sm text-foreground">Stock & Financials</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time stock depletion, low alerts, and P&L analytics
                </p>
              </div>
            </div>

            {/* System Status Pill */}
            <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-foreground">System Online</span>
                <span className="text-muted-foreground/60">•</span>
                <span className="font-mono text-muted-foreground">v{__APP_VERSION__}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Protected Enterprise Access</span>
              </div>
            </div>
          </div>

          {/* Right Column: Modern Sign-In Card */}
          <div className="w-full lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-card/95 backdrop-blur-xl border border-border/70 rounded-2xl shadow-xl shadow-foreground/5 p-6 sm:p-8 space-y-6">
              
              {/* Card Header (with mobile brand mark) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 p-1.5 flex items-center justify-center">
                      <img
                        src={villageLogo}
                        alt="Tissa Village Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        Sign In
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Tissa Village Management System
                      </p>
                    </div>
                  </div>

                  {/* System Version Badge on top right */}
                  <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5 font-semibold bg-secondary/60">
                    v{__APP_VERSION__}
                  </Badge>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground">
                  Enter your assigned credentials to access your designated modules.
                </p>
              </div>

              {/* Error Alert Banner */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in-50 duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium leading-tight">{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground/90">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@tissavillage.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      disabled={isLoading}
                      className="pl-10 h-11 bg-background/50 border-border/80 focus-visible:ring-primary text-sm"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">
                      Password
                    </Label>
                    {isCapsLockOn && (
                      <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Caps Lock is ON
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyDown}
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="pl-10 pr-10 h-11 bg-background/50 border-border/80 focus-visible:ring-primary text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Options: Remember me */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-xs font-medium text-muted-foreground cursor-pointer select-none leading-none"
                    >
                      Remember email on this device
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="w-full h-11 text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In to Account"
                  )}
                </Button>
              </form>

              {/* Help & Contact Notice */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground">
                <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Need login access or password reset? Please contact your hotel/bar system administrator.
                </span>
              </div>

              {/* Powered by Wrenix & System Version Footer */}
              <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                {/* Wrenix Logo Branding */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                    Powered by
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-foreground/5 hover:bg-foreground/10 transition-colors">
                    <img
                      src={wrenixLogo}
                      alt="Wrenix Logo"
                      className="h-4 sm:h-5 w-auto object-contain"
                    />
                  </div>
                </div>

                {/* Version & Status */}
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-muted-foreground">Version</span>
                  <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-semibold border border-border/60">
                    v{__APP_VERSION__}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;
