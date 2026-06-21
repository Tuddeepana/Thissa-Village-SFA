import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  UtensilsCrossed,
  Clock,
  FileText,
  RefreshCw,
  Eye,
  User,
  ArrowLeft,
  ChefHat,
  Package,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { kotService } from "@/api/services/kotService";
import { KotLogDTO } from "@/types/kot.types";
import { User as AppUser } from "@/types/user.types";
import { ROLES, STORAGE_KEYS } from "@/utils/constants";
import LocalLoader from "@/components/common/LocalLoader";
import { formatDistanceToNow, isToday } from "date-fns";
import { formatSL } from "@/utils/dateUtils";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const KotDashboard = () => {
  const navigate = useNavigate();
  const [selectedKot, setSelectedKot] = useState<KotLogDTO | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const authUser = useMemo<AppUser | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    try { return raw ? (JSON.parse(raw) as AppUser) : null; } catch { return null; }
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const firstName = authUser?.name ? authUser.name.split(" ")[0] : "User";

  const formattedDate = currentTime.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const formattedDateTime = `${formattedDate} · ${formattedTime}`;

  const isAdmin = authUser?.role === ROLES.ADMIN;
  const filterSteward = isAdmin ? undefined : authUser?.name;

  const { data: kotLogs = [], isLoading, refetch } = useQuery({
    queryKey: ["kotLogs", filterSteward, "PENDING"],
    queryFn: async () => {
      const response = await kotService.getKotLogs({
        steward: filterSteward,
        status: "PENDING",
      });
      return response.kotLogs || [];
    },
    refetchInterval: 5000,
  });

  const todaysPendingKots = useMemo(
    () => kotLogs.filter((k) => isToday(new Date(k.createdAt))),
    [kotLogs]
  );

  const handleViewDetails = (kot: KotLogDTO) => {
    setSelectedKot(kot);
    setIsDetailsOpen(true);
  };

  const handleBack = () => {
    localStorage.removeItem(STORAGE_KEYS.selectedModule);
    navigate("/modules");
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("selectedModule");
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Top Bar (Matching standard SFA layout, but no sidebar) ── */}
      <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Modules
          </Button>

          {/* Desktop breadcrumb */}
          <div className="hidden md:block">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <span className="font-semibold text-foreground text-sm md:text-base">
                    Restaurant Management
                  </span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span className="text-muted-foreground text-xs md:text-sm font-normal">
                    {formattedDateTime}
                  </span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span className="text-foreground text-xs md:text-sm font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {firstName}
                  </span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Mobile title */}
          <h2 className="text-sm font-semibold text-foreground truncate md:hidden">
            Restaurant Management
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 p-4 md:p-6 space-y-4">
        {/* Page title row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Active Orders
            </h1>
            <div className="mt-1 space-y-1">
              <p className="text-sm md:text-base text-muted-foreground flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
                {isAdmin
                  ? "Live kitchen queue — all stewards"
                  : `Live kitchen queue — ${authUser?.name}`}
              </p>
              <p className="text-xs font-bold text-primary">
                {todaysPendingKots.length} Pending Today
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* ── Table card (Desktop only) ── */}
        <div className="hidden md:block">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Pending KOTs — Today ({todaysPendingKots.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && todaysPendingKots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading orders...
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table / Order</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Items</TableHead>
                        {isAdmin && <TableHead>Steward</TableHead>}
                        <TableHead>Remark</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todaysPendingKots.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={isAdmin ? 8 : 7}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No pending kitchen tickets for today
                          </TableCell>
                        </TableRow>
                      ) : (
                        todaysPendingKots.map((kot) => (
                          <TableRow key={kot.id}>
                            <TableCell className="font-medium">
                              {kot.table_name || "Take Away"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {kot.order_type === "DINE_IN" ? (
                                  <><UtensilsCrossed className="h-3 w-3 mr-1" />Dine In</>
                                ) : (
                                  <><Package className="h-3 w-3 mr-1" />Take Away</>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>{kot.items.length} items</TableCell>
                            {isAdmin && (
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  {kot.steward}
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              {kot.remark ? (
                                <span className="text-xs text-muted-foreground italic truncate max-w-[160px] block">
                                  {kot.remark}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(kot.createdAt), { addSuffix: false })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatSL(new Date(kot.createdAt), "HH:mm")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetails(kot)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Mobile card list (shown only on small screens) ── */}
        <div className="md:hidden space-y-3">
          {todaysPendingKots.map((kot) => (
            <Card
              key={kot.id}
              className="overflow-hidden"
              onClick={() => handleViewDetails(kot)}
            >
              <div className="h-1 bg-primary w-full" />
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {kot.table_name || "Take Away"}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] h-5">
                        {kot.order_type === "DINE_IN" ? (
                          <><UtensilsCrossed className="h-2.5 w-2.5 mr-1" />Dine In</>
                        ) : (
                          <><Package className="h-2.5 w-2.5 mr-1" />Take Away</>
                        )}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(kot.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {kot.items.length} item{kot.items.length !== 1 ? "s" : ""}
                      {isAdmin && ` · ${kot.steward}`}
                    </p>
                    {kot.remark && (
                      <p className="text-xs text-muted-foreground italic truncate">
                        {kot.remark}
                      </p>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="flex-shrink-0 h-9 w-9">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* ── Detail Dialog ── */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              KOT Details — {selectedKot?.table_name || "Take Away"}
            </DialogTitle>
            <DialogDescription>
              Kitchen order ticket details
            </DialogDescription>
          </DialogHeader>

          {selectedKot && (
            <div className="space-y-4">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  {selectedKot.order_type === "DINE_IN" ? (
                    <><UtensilsCrossed className="h-4 w-4 text-muted-foreground" /> Dine In</>
                  ) : (
                    <><Package className="h-4 w-4 text-muted-foreground" /> Take Away</>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatSL(new Date(selectedKot.createdAt), "dd/MM/yyyy HH:mm")}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {selectedKot.steward}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatDistanceToNow(new Date(selectedKot.createdAt), { addSuffix: true })}
                </div>
              </div>

              {/* Remark */}
              {selectedKot.remark && (
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg border-l-4 border-primary">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Kitchen Instructions
                    </p>
                    <p className="text-sm italic">{selectedKot.remark}</p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Items table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-base font-semibold">Order Items</p>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead>Unit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedKot.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell className="text-center font-medium">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {item.unit || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="text-xs text-muted-foreground pt-1">
                KOT ID: {selectedKot.id}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KotDashboard;
