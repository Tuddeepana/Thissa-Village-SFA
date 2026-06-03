import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  Filter,
  Save,
  BarChart3,
  Receipt,
  Tags,
  X,
  Download,
  Calendar,
  Search,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  PieChart as PieChartIcon,
  LayoutDashboard,
  Percent,
  Activity,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { expenseService } from "@/api/services/expenseService";
import type {
  ExpenseType,
  Expense,
  CreateExpensePayload,
  PnLData,
} from "@/types/expense.types";

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmt = (val: string | number) => {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n)
    ? "0.00"
    : n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
};

const fmtShort = (val: string | number) => {
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return fmt(n);
};

type SortDir = "asc" | "desc";

// ─── Chart colors using brand palette ──────────────────────────────────────
const CHART_COLORS = [
  "hsl(25, 75%, 45%)",
  "hsl(35, 85%, 55%)",
  "hsl(45, 70%, 50%)",
  "hsl(20, 65%, 40%)",
  "hsl(30, 60%, 45%)",
  "hsl(15, 80%, 50%)",
  "hsl(50, 75%, 48%)",
];

// ─── Pending expense row ────────────────────────────────────────────────────
type PendingExpense = {
  _key: string;
  amount: string;
  description: string;
  date: string;
  expenseTypeId: string;
  expenseTypeName: string;
};

// ─── Validation errors ──────────────────────────────────────────────────────
type FormErrors = {
  expAmount?: string;
  expTypeId?: string;
  expDate?: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const MetricCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-28" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-36 mb-2" />
      <Skeleton className="h-3 w-20" />
    </CardContent>
  </Card>
);

const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-full" />
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════
const EmptyState = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
    <div className="rounded-full bg-muted p-4">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// METRIC CARD
// ═══════════════════════════════════════════════════════════════════════════
const MetricCard = ({
  title,
  value,
  sub,
  icon: Icon,
  colorClass,
  bgClass,
  borderClass,
  iconColorClass,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  iconColorClass: string;
}) => (
  <Card
    className={`${bgClass} ${borderClass} transition-all duration-200 hover:shadow-md`}
  >
    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
      <CardTitle className={`text-xs font-semibold uppercase tracking-wider ${colorClass}`}>
        {title}
      </CardTitle>
      <div className={`rounded-full p-1.5 ${bgClass}`}>
        <Icon className={`h-4 w-4 ${iconColorClass}`} />
      </div>
    </CardHeader>
    <CardContent className="px-4 pb-4 pt-0">
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      {sub && <p className={`text-xs mt-1 opacity-70 ${colorClass}`}>{sub}</p>}
    </CardContent>
  </Card>
);

// ═══════════════════════════════════════════════════════════════════════════
// SORT BUTTON
// ═══════════════════════════════════════════════════════════════════════════
const SortButton = ({
  label,
  field,
  current,
  dir,
  onClick,
}: {
  label: string;
  field: string;
  current: string;
  dir: SortDir;
  onClick: (f: string) => void;
}) => (
  <button
    onClick={() => onClick(field)}
    className="flex items-center gap-1 hover:text-foreground transition-colors"
  >
    {label}
    {current === field ? (
      dir === "asc" ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )
    ) : (
      <ChevronDown className="h-3 w-3 opacity-30" />
    )}
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const ProfitAndLoss = () => {
  const { toast } = useToast();

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState<"expense" | "pnl">("expense");

  // ── Expense types ──
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [isTypesLoading, setIsTypesLoading] = useState(true);

  // ── Add expense form ──
  const [expAmount, setExpAmount] = useState("");
  const [expTypeId, setExpTypeId] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [expDate, setExpDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expMonth, setExpMonth] = useState(format(new Date(), "yyyy-MM"));
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Pending (unsaved) expenses ──
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);

  // ── Expense table controls ──
  const [expSearch, setExpSearch] = useState("");
  const [expSortField, setExpSortField] = useState("date");
  const [expSortDir, setExpSortDir] = useState<SortDir>("desc");
  const [expCurrentPage, setExpCurrentPage] = useState(1);
  const EXP_PAGE_SIZE = 10;

  // ── Expense tab filters (independent from PnL filters) ──
  const now = new Date();
  const [expFilterFrom, setExpFilterFrom] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [expFilterTo, setExpFilterTo] = useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const [expFilterTypeId, setExpFilterTypeId] = useState("all");
  const [expFilterMonth, setExpFilterMonth] = useState(format(now, "yyyy-MM"));

  // ── PnL Dashboard filters ──
  const [filterFrom, setFilterFrom] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [filterTo, setFilterTo] = useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const [filterTypeId, setFilterTypeId] = useState("all");
  const [filterMonth, setFilterMonth] = useState(format(now, "yyyy-MM"));

  // ── Saved expenses list ──
  const [savedExpenses, setSavedExpenses] = useState<Expense[]>([]);
  const [isExpensesLoading, setIsExpensesLoading] = useState(true);
  const [expensePagination, setExpensePagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });

  // ── P&L data ──
  const [pnlData, setPnlData] = useState<PnLData | null>(null);
  const [pnlGenerated, setPnlGenerated] = useState(false);
  const [isLoadingPnl, setIsLoadingPnl] = useState(false);

  // ── Fetch expense types ──
  const fetchTypes = useCallback(async () => {
    setIsTypesLoading(true);
    try {
      const { expenseTypes: types } = await expenseService.listTypes();
      setExpenseTypes(types);
    } catch {
      toast({ title: "Error", description: "Failed to load expense types" });
    } finally {
      setIsTypesLoading(false);
    }
  }, [toast]);

  // ── Fetch saved expenses with expense-tab filters ──
  const fetchExpenses = useCallback(
    async (page = 1) => {
      setIsExpensesLoading(true);
      try {
        const query: any = {
          page,
          limit: 20,
          dateFrom: expFilterFrom,
          dateTo: expFilterTo,
        };
        if (expFilterTypeId !== "all") query.expenseTypeId = expFilterTypeId;
        const { expenses, pagination } = await expenseService.listExpenses(query);
        setSavedExpenses(expenses);
        setExpensePagination(pagination);
        setExpCurrentPage(1);
      } catch {
        toast({ title: "Error", description: "Failed to load expenses" });
      } finally {
        setIsExpensesLoading(false);
      }
    },
    [expFilterFrom, expFilterTo, expFilterTypeId, toast]
  );

  // ── Apply expense-tab filter ──
  const handleApplyExpFilter = () => {
    fetchExpenses(1);
    setExpSearch("");
    setExpCurrentPage(1);
  };

  useEffect(() => {
    fetchTypes();
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Validate form ──
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!expAmount || parseFloat(expAmount) <= 0)
      errors.expAmount = "Please enter a valid amount greater than 0";
    if (!expTypeId) errors.expTypeId = "Please select an expense type";
    if (!expDate) errors.expDate = "Please select a date";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Add expense type ──
  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    try {
      await expenseService.createType({ name: newTypeName.trim() });
      toast({ title: "Success", description: "Expense type added" });
      setNewTypeName("");
      setTypeDialogOpen(false);
      fetchTypes();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to create type",
      });
    }
  };

  const handleDeleteType = async (id: string) => {
    try {
      await expenseService.deleteType(id);
      toast({ title: "Deleted", description: "Expense type removed" });
      fetchTypes();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to delete type",
      });
    }
  };

  // ── Add to pending list ──
  const handleAddToPending = () => {
    if (!validateForm()) return;
    const typeName = expenseTypes.find((t) => t.id === expTypeId)?.name ?? "";
    setPendingExpenses((prev) => [
      ...prev,
      {
        _key: `${Date.now()}-${Math.random()}`,
        amount: expAmount,
        description: expDescription,
        date: expDate,
        expenseTypeId: expTypeId,
        expenseTypeName: typeName,
      },
    ]);
    setExpAmount("");
    setExpDescription("");
    setFormErrors({});
  };

  const removePending = (key: string) => {
    setPendingExpenses((prev) => prev.filter((p) => p._key !== key));
  };

  // ── Save all pending expenses ──
  const handleSaveExpenses = async () => {
    if (pendingExpenses.length === 0) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const expenses: CreateExpensePayload[] = pendingExpenses.map((p) => ({
        amount: parseFloat(p.amount),
        description: p.description || null,
        date: new Date(p.date).toISOString(),
        expenseTypeId: p.expenseTypeId,
      }));
      await expenseService.bulkCreateExpenses({ expenses });
      toast({
        title: "Saved Successfully",
        description: `${expenses.length} expense(s) saved`,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setPendingExpenses([]);
      fetchExpenses();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to save expenses",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Apply filters ──
  const handleApplyFilters = () => {
    fetchExpenses(1);
    setPnlGenerated(false);
    setPnlData(null);
  };

  // ── Generate P&L ──
  const handleGeneratePnl = async () => {
    setIsLoadingPnl(true);
    try {
      const data = await expenseService.getPnL({
        dateFrom: filterFrom,
        dateTo: filterTo,
      });
      setPnlData(data);
      setPnlGenerated(true);
    } catch {
      toast({ title: "Error", description: "Failed to generate P&L report" });
    } finally {
      setIsLoadingPnl(false);
    }
  };

  // ── Delete saved expense ──
  const handleDeleteExpense = async (id: string) => {
    try {
      await expenseService.deleteExpense(id);
      toast({ title: "Deleted", description: "Expense removed" });
      fetchExpenses(expensePagination.currentPage);
      if (pnlGenerated) handleGeneratePnl();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to delete",
      });
    }
  };

  // ── Set filter to Today ──
  const handleSetToday = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setFilterFrom(today);
    setFilterTo(today);
  };

  // ── Set filter to Current Month ──
  const handleSetCurrentMonth = () => {
    setFilterFrom(format(startOfMonth(now), "yyyy-MM-dd"));
    setFilterTo(format(endOfMonth(now), "yyyy-MM-dd"));
  };

  // ── Sort handler for expense table ──
  const handleExpSort = (field: string) => {
    if (expSortField === field) {
      setExpSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setExpSortField(field);
      setExpSortDir("asc");
    }
    setExpCurrentPage(1);
  };

  // ── Client-side filtered + sorted + paginated expenses ──
  const filteredExpenses = useMemo(() => {
    let list = [...savedExpenses];
    if (expSearch.trim()) {
      const q = expSearch.toLowerCase();
      list = list.filter(
        (e) =>
          (e.expenseType?.name ?? "").toLowerCase().includes(q) ||
          (e.description ?? "").toLowerCase().includes(q) ||
          format(new Date(e.date), "yyyy-MM-dd").includes(q)
      );
    }
    list.sort((a, b) => {
      let av: any, bv: any;
      if (expSortField === "date") {
        av = new Date(a.date).getTime();
        bv = new Date(b.date).getTime();
      } else if (expSortField === "amount") {
        av = parseFloat(a.amount);
        bv = parseFloat(b.amount);
      } else {
        av = a.expenseType?.name ?? "";
        bv = b.expenseType?.name ?? "";
      }
      if (av < bv) return expSortDir === "asc" ? -1 : 1;
      if (av > bv) return expSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [savedExpenses, expSearch, expSortField, expSortDir]);

  const totalExpPages = Math.max(1, Math.ceil(filteredExpenses.length / EXP_PAGE_SIZE));
  const pagedExpenses = filteredExpenses.slice(
    (expCurrentPage - 1) * EXP_PAGE_SIZE,
    expCurrentPage * EXP_PAGE_SIZE
  );

  const pendingTotal = useMemo(
    () => pendingExpenses.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    [pendingExpenses]
  );

  // ── Derived P&L metrics ──
  const netVal = pnlData ? parseFloat(pnlData.netProfitOrLoss) : 0;
  const revVal = pnlData ? parseFloat(pnlData.totalRevenue) : 0;
  const expVal = pnlData ? parseFloat(pnlData.totalExpenses) : 0;
  const profitMargin = revVal > 0 ? ((netVal / revVal) * 100).toFixed(1) : "0.0";
  const grossProfit = revVal - expVal;

  // ── Pie chart data ──
  const pieData = useMemo(() => {
    if (!pnlData) return [];
    return pnlData.expenseBreakdown.byType.map((bt) => ({
      name: bt.expenseTypeName,
      value: parseFloat(bt.total),
      count: bt.count,
    }));
  }, [pnlData]);

  // ── Bar chart data (monthly summary in period) ──
  const barData = useMemo(() => {
    if (!pnlData) return [];
    return [
      {
        name: "Period",
        Revenue: revVal,
        Expenses: expVal,
        Profit: grossProfit,
      },
    ];
  }, [pnlData, revVal, expVal, grossProfit]);

  // ── Export CSV ──
  const handleExportCSV = () => {
    if (!pnlData) {
      toast({ title: "No Data", description: "Please generate P&L report first" });
      return;
    }
    try {
      const rows: string[] = [];
      rows.push("Profit & Loss Report");
      rows.push(
        `Period:,${format(new Date(pnlData.dateFrom), "MMM d yyyy")} - ${format(
          new Date(pnlData.dateTo),
          "MMM d yyyy"
        )}`
      );
      rows.push("");
      rows.push("Summary");
      rows.push(`Total Revenue,${pnlData.totalRevenue}`);
      rows.push(`Total Expenses,${pnlData.totalExpenses}`);
      rows.push(`Net ${netVal >= 0 ? "Profit" : "Loss"},${pnlData.netProfitOrLoss}`);
      rows.push(`Profit Margin %,${profitMargin}%`);
      rows.push("");
      rows.push("Revenue Breakdown");
      rows.push(`Bill Count,${pnlData.revenueBreakdown.billCount}`);
      rows.push(`Total Bill Amount,${pnlData.revenueBreakdown.totalBillAmount}`);
      rows.push("");
      rows.push("Expense Breakdown by Type");
      rows.push("Expense Type,Count,Total Amount");
      pnlData.expenseBreakdown.byType.forEach((bt) => {
        rows.push(`${bt.expenseTypeName},${bt.count},${bt.total}`);
      });
      rows.push("");
      rows.push("Detailed Expenses");
      rows.push("Date,Expense Type,Description,Amount");
      savedExpenses.forEach((exp) => {
        const date = format(new Date(exp.date), "yyyy-MM-dd");
        const type = exp.expenseType?.name || "-";
        const desc = (exp.description || "-").replace(/,/g, ";");
        rows.push(`${date},${type},${desc},${exp.amount}`);
      });
      const csv = rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `PnL_Report_${format(new Date(), "yyyy-MM-dd_HHmmss")}.csv`;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Exported", description: "PnL CSV downloaded successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to export report" });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      {/* ═══ Page Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Profit &amp; Loss
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track revenue, manage expenses, and analyse business performance
          </p>
        </div>
        {pnlGenerated && pnlData && (
          <Button onClick={handleExportCSV} className="gap-2 shrink-0">
            <Download className="h-4 w-4" />
            Download PnL CSV
          </Button>
        )}
      </div>

      {/* ═══ Tabs ═══ */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "expense" | "pnl")}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 md:w-96">
          <TabsTrigger value="expense" className="gap-2">
            <Receipt className="h-4 w-4" />
            Expense Management
          </TabsTrigger>
          <TabsTrigger value="pnl" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            PnL Dashboard
          </TabsTrigger>
        </TabsList>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TAB 1 — EXPENSE MANAGEMENT
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <TabsContent value="expense" className="space-y-6 mt-0">
          {/* ── Expense Type Management ── */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tags className="h-4 w-4 text-primary" />
                  Expense Type Management
                </CardTitle>
                <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Create Expense Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Tags className="h-4 w-4 text-primary" />
                        Create Expense Type
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateType} className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="typeName">Type Name</Label>
                        <Input
                          id="typeName"
                          value={newTypeName}
                          onChange={(e) => setNewTypeName(e.target.value)}
                          placeholder="e.g. Salary, Water Bill, Internet…"
                          required
                          autoFocus
                        />
                        <p className="text-xs text-muted-foreground">
                          Common types: Salary, Water Bill, Electricity Bill, Internet,
                          Transport, Maintenance, Other
                        </p>
                      </div>
                      <Button type="submit" className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Create Type
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isTypesLoading ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-7 w-24 rounded-full" />
                  ))}
                </div>
              ) : expenseTypes.length === 0 ? (
                <EmptyState
                  icon={Tags}
                  title="No expense types yet"
                  description="Create your first expense type to get started"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {expenseTypes.map((t) => (
                    <Badge
                      key={t.id}
                      variant="secondary"
                      className="text-sm py-1.5 px-3 gap-2 rounded-full"
                    >
                      {t.name}
                      <button
                        onClick={() => handleDeleteType(t.id)}
                        className="ml-0.5 hover:text-destructive transition-colors rounded-full"
                        title="Remove type"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Add Expense Form ── */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Add Expense
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Month */}
                <div className="space-y-1.5">
                  <Label htmlFor="expMonth">Month</Label>
                  <Input
                    id="expMonth"
                    type="month"
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value)}
                  />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="expDate">
                    Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="expDate"
                    type="date"
                    value={expDate}
                    onChange={(e) => {
                      setExpDate(e.target.value);
                      if (formErrors.expDate)
                        setFormErrors((p) => ({ ...p, expDate: undefined }));
                    }}
                    className={formErrors.expDate ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {formErrors.expDate && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.expDate}
                    </p>
                  )}
                </div>

                {/* Expense Type */}
                <div className="space-y-1.5">
                  <Label>
                    Expense Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={expTypeId}
                    onValueChange={(v) => {
                      setExpTypeId(v);
                      if (formErrors.expTypeId)
                        setFormErrors((p) => ({ ...p, expTypeId: undefined }));
                    }}
                  >
                    <SelectTrigger
                      className={formErrors.expTypeId ? "border-destructive focus-visible:ring-destructive" : ""}
                    >
                      <SelectValue placeholder="Select expense type" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseTypes.length === 0 ? (
                        <div className="py-2 px-3 text-sm text-muted-foreground">
                          No types — create one first
                        </div>
                      ) : (
                        expenseTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.expTypeId && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.expTypeId}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <Label htmlFor="expAmount">
                    Expense Amount <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground select-none">
                      Rs.
                    </span>
                    <Input
                      id="expAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={expAmount}
                      onChange={(e) => {
                        setExpAmount(e.target.value);
                        if (formErrors.expAmount)
                          setFormErrors((p) => ({ ...p, expAmount: undefined }));
                      }}
                      placeholder="0.00"
                      className={`pl-10 ${formErrors.expAmount ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {formErrors.expAmount && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.expAmount}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                  <Label htmlFor="expDesc">Description (optional)</Label>
                  <Input
                    id="expDesc"
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                    placeholder="Add a brief note about this expense…"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                <Button onClick={handleAddToPending} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add to List
                </Button>
                {saveSuccess && (
                  <div className="flex items-center gap-1.5 text-sm text-green-600 animate-in fade-in slide-in-from-bottom-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Expenses saved successfully!
                  </div>
                )}
              </div>

              {/* Pending Expenses */}
              {pendingExpenses.length > 0 && (
                <div className="space-y-3 pt-2">
                  <Separator />
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Pending ({pendingExpenses.length}) —{" "}
                      <span className="text-foreground font-semibold">
                        Total: Rs. {fmt(pendingTotal)}
                      </span>
                    </div>
                    <Button
                      onClick={handleSaveExpenses}
                      disabled={isSaving}
                      size="sm"
                      className="gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          Save All
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount (Rs.)</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingExpenses.map((p) => (
                          <TableRow key={p._key} className="hover:bg-muted/30">
                            <TableCell className="text-sm">
                              {format(new Date(p.date), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="rounded-full">
                                {p.expenseTypeName}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {p.description || "—"}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {fmt(p.amount)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => removePending(p._key)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Expense History Filter ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Filter Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Quick Month picker */}
                <div className="space-y-1.5">
                  <Label htmlFor="expFMonth">Month</Label>
                  <Input
                    id="expFMonth"
                    type="month"
                    value={expFilterMonth}
                    onChange={(e) => {
                      setExpFilterMonth(e.target.value);
                      if (e.target.value) {
                        const d = new Date(e.target.value + "-01");
                        setExpFilterFrom(format(startOfMonth(d), "yyyy-MM-dd"));
                        setExpFilterTo(format(endOfMonth(d), "yyyy-MM-dd"));
                      }
                    }}
                  />
                </div>

                {/* From date */}
                <div className="space-y-1.5">
                  <Label htmlFor="expFFrom">From Date</Label>
                  <Input
                    id="expFFrom"
                    type="date"
                    value={expFilterFrom}
                    onChange={(e) => setExpFilterFrom(e.target.value)}
                  />
                </div>

                {/* To date */}
                <div className="space-y-1.5">
                  <Label htmlFor="expFTo">To Date</Label>
                  <Input
                    id="expFTo"
                    type="date"
                    value={expFilterTo}
                    onChange={(e) => setExpFilterTo(e.target.value)}
                  />
                </div>

                {/* Expense type */}
                <div className="space-y-1.5">
                  <Label>Expense Type</Label>
                  <Select value={expFilterTypeId} onValueChange={setExpFilterTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {expenseTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick shortcuts + Apply */}
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    const today = format(new Date(), "yyyy-MM-dd");
                    setExpFilterFrom(today);
                    setExpFilterTo(today);
                    setExpFilterMonth(format(new Date(), "yyyy-MM"));
                  }}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    const n = new Date();
                    setExpFilterFrom(format(startOfMonth(n), "yyyy-MM-dd"));
                    setExpFilterTo(format(endOfMonth(n), "yyyy-MM-dd"));
                    setExpFilterMonth(format(n, "yyyy-MM"));
                  }}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    const prev = new Date();
                    prev.setMonth(prev.getMonth() - 1);
                    setExpFilterFrom(format(startOfMonth(prev), "yyyy-MM-dd"));
                    setExpFilterTo(format(endOfMonth(prev), "yyyy-MM-dd"));
                    setExpFilterMonth(format(prev, "yyyy-MM"));
                  }}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Last Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    const n = new Date();
                    setExpFilterFrom(format(new Date(n.getFullYear(), 0, 1), "yyyy-MM-dd"));
                    setExpFilterTo(format(new Date(n.getFullYear(), 11, 31), "yyyy-MM-dd"));
                    setExpFilterMonth("");
                  }}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  This Year
                </Button>
                <Button
                  onClick={handleApplyExpFilter}
                  className="gap-2 ml-auto"
                  size="sm"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Apply Filter
                </Button>
              </div>

              {/* Active filter label */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Showing expenses for:</span>
                <Badge variant="outline" className="text-xs rounded-full">
                  {format(new Date(expFilterFrom), "dd MMM yyyy")} –{" "}
                  {format(new Date(expFilterTo), "dd MMM yyyy")}
                </Badge>
                {expFilterTypeId !== "all" && (
                  <Badge variant="outline" className="text-xs rounded-full">
                    {expenseTypes.find((t) => t.id === expFilterTypeId)?.name}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Expense History Table ── */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  {format(new Date(expFilterFrom), "MMMM yyyy")} Expenses
                  {savedExpenses.length > 0 && (
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {expensePagination.totalRecords} records
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search expenses…"
                      value={expSearch}
                      onChange={(e) => {
                        setExpSearch(e.target.value);
                        setExpCurrentPage(1);
                      }}
                      className="pl-9 h-9 w-48 text-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchExpenses(expensePagination.currentPage)}
                    className="gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isExpensesLoading ? (
                <TableSkeleton rows={6} />
              ) : filteredExpenses.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No expenses found"
                  description={
                    expSearch
                      ? "No expenses match your search. Try a different keyword."
                      : `No expenses recorded for ${format(new Date(expFilterFrom), "MMMM yyyy")}.`
                  }
                />
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 sticky top-0">
                          <TableHead className="text-xs">
                            <SortButton
                              label="Date"
                              field="date"
                              current={expSortField}
                              dir={expSortDir}
                              onClick={handleExpSort}
                            />
                          </TableHead>
                          <TableHead className="text-xs">Month</TableHead>
                          <TableHead className="text-xs">
                            <SortButton
                              label="Expense Type"
                              field="type"
                              current={expSortField}
                              dir={expSortDir}
                              onClick={handleExpSort}
                            />
                          </TableHead>
                          <TableHead className="text-xs">Description</TableHead>
                          <TableHead className="text-xs text-right">
                            <SortButton
                              label="Amount (Rs.)"
                              field="amount"
                              current={expSortField}
                              dir={expSortDir}
                              onClick={handleExpSort}
                            />
                          </TableHead>
                          <TableHead className="text-xs">Created By</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedExpenses.map((exp) => (
                          <TableRow key={exp.id} className="hover:bg-muted/30">
                            <TableCell className="text-sm font-medium">
                              {format(new Date(exp.date), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(exp.date), "MMMM yyyy")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="rounded-full text-xs">
                                {exp.expenseType?.name ?? "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                              {exp.description || "—"}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm">
                              {fmt(exp.amount)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              System
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteExpense(exp.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <p className="text-xs text-muted-foreground">
                      Showing {(expCurrentPage - 1) * EXP_PAGE_SIZE + 1}–
                      {Math.min(expCurrentPage * EXP_PAGE_SIZE, filteredExpenses.length)} of{" "}
                      {filteredExpenses.length} results
                    </p>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={expCurrentPage <= 1}
                        onClick={() => setExpCurrentPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalExpPages, 5) }, (_, i) => {
                          const pg = i + 1;
                          return (
                            <Button
                              key={pg}
                              variant={expCurrentPage === pg ? "default" : "outline"}
                              size="sm"
                              className="h-8 w-8 p-0 text-xs"
                              onClick={() => setExpCurrentPage(pg)}
                            >
                              {pg}
                            </Button>
                          );
                        })}
                        {totalExpPages > 5 && (
                          <span className="text-xs text-muted-foreground px-1">…</span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={expCurrentPage >= totalExpPages}
                        onClick={() => setExpCurrentPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TAB 2 — PnL DASHBOARD
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <TabsContent value="pnl" className="space-y-6 mt-0">
          {/* ── Filter Card ── */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Filters &amp; Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Month filter */}
                <div className="space-y-1.5">
                  <Label htmlFor="pnlMonth">Month</Label>
                  <Input
                    id="pnlMonth"
                    type="month"
                    value={filterMonth}
                    onChange={(e) => {
                      setFilterMonth(e.target.value);
                      if (e.target.value) {
                        const d = new Date(e.target.value + "-01");
                        setFilterFrom(format(startOfMonth(d), "yyyy-MM-dd"));
                        setFilterTo(format(endOfMonth(d), "yyyy-MM-dd"));
                      }
                    }}
                  />
                </div>

                {/* Date range from */}
                <div className="space-y-1.5">
                  <Label htmlFor="filterFrom">From Date</Label>
                  <Input
                    id="filterFrom"
                    type="date"
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                  />
                </div>

                {/* Date range to */}
                <div className="space-y-1.5">
                  <Label htmlFor="filterTo">To Date</Label>
                  <Input
                    id="filterTo"
                    type="date"
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                  />
                </div>

                {/* Expense type */}
                <div className="space-y-1.5">
                  <Label>Expense Type</Label>
                  <Select value={filterTypeId} onValueChange={setFilterTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {expenseTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetToday}
                  className="gap-1.5"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetCurrentMonth}
                  className="gap-1.5"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyFilters}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh Data
                </Button>
                <Button
                  onClick={handleGeneratePnl}
                  disabled={isLoadingPnl}
                  className="gap-2 ml-auto"
                >
                  {isLoadingPnl ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4" />
                      Generate PnL Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Metric Cards ── */}
          {isLoadingPnl ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <MetricCardSkeleton key={i} />
              ))}
            </div>
          ) : pnlGenerated && pnlData ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                  title="Total Revenue"
                  value={`Rs. ${fmtShort(pnlData.totalRevenue)}`}
                  sub={`${pnlData.revenueBreakdown.billCount} bill(s) · Rs. ${fmt(pnlData.totalRevenue)}`}
                  icon={DollarSign}
                  colorClass="text-green-700 dark:text-green-400"
                  bgClass="bg-green-50 dark:bg-green-950/20"
                  borderClass="border-green-200 dark:border-green-900"
                  iconColorClass="text-green-600"
                />
                <MetricCard
                  title="Total Expenses"
                  value={`Rs. ${fmtShort(pnlData.totalExpenses)}`}
                  sub={`${pnlData.expenseBreakdown.expenseCount} expense(s) · Rs. ${fmt(pnlData.totalExpenses)}`}
                  icon={Receipt}
                  colorClass="text-red-700 dark:text-red-400"
                  bgClass="bg-red-50 dark:bg-red-950/20"
                  borderClass="border-red-200 dark:border-red-900"
                  iconColorClass="text-red-600"
                />
                <MetricCard
                  title="Gross Profit"
                  value={`Rs. ${fmtShort(grossProfit)}`}
                  sub={`Revenue minus expenses`}
                  icon={grossProfit >= 0 ? TrendingUp : TrendingDown}
                  colorClass={
                    grossProfit >= 0
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-orange-700 dark:text-orange-400"
                  }
                  bgClass={
                    grossProfit >= 0
                      ? "bg-blue-50 dark:bg-blue-950/20"
                      : "bg-orange-50 dark:bg-orange-950/20"
                  }
                  borderClass={
                    grossProfit >= 0
                      ? "border-blue-200 dark:border-blue-900"
                      : "border-orange-200 dark:border-orange-900"
                  }
                  iconColorClass={
                    grossProfit >= 0 ? "text-blue-600" : "text-orange-600"
                  }
                />
                <MetricCard
                  title={`Net ${netVal >= 0 ? "Profit" : "Loss"}`}
                  value={`Rs. ${fmtShort(pnlData.netProfitOrLoss)}`}
                  sub={`${format(new Date(pnlData.dateFrom), "MMM d")} – ${format(
                    new Date(pnlData.dateTo),
                    "MMM d, yyyy"
                  )}`}
                  icon={netVal >= 0 ? TrendingUp : TrendingDown}
                  colorClass={
                    netVal >= 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-rose-700 dark:text-rose-400"
                  }
                  bgClass={
                    netVal >= 0
                      ? "bg-emerald-50 dark:bg-emerald-950/20"
                      : "bg-rose-50 dark:bg-rose-950/20"
                  }
                  borderClass={
                    netVal >= 0
                      ? "border-emerald-200 dark:border-emerald-900"
                      : "border-rose-200 dark:border-rose-900"
                  }
                  iconColorClass={netVal >= 0 ? "text-emerald-600" : "text-rose-600"}
                />
                <MetricCard
                  title="Profit Margin"
                  value={`${profitMargin}%`}
                  sub="Net profit / Revenue"
                  icon={Percent}
                  colorClass="text-violet-700 dark:text-violet-400"
                  bgClass="bg-violet-50 dark:bg-violet-950/20"
                  borderClass="border-violet-200 dark:border-violet-900"
                  iconColorClass="text-violet-600"
                />
                <MetricCard
                  title="Total Transactions"
                  value={`${pnlData.revenueBreakdown.billCount}`}
                  sub={`${pnlData.expenseBreakdown.expenseCount} expenses recorded`}
                  icon={Activity}
                  colorClass="text-amber-700 dark:text-amber-400"
                  bgClass="bg-amber-50 dark:bg-amber-950/20"
                  borderClass="border-amber-200 dark:border-amber-900"
                  iconColorClass="text-amber-600"
                />
              </div>

              {/* ── PnL Data Table (Breakdown by Type) ── */}
              {pnlData.expenseBreakdown.byType.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      PnL Breakdown by Expense Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Expense Type</TableHead>
                            <TableHead className="text-center">Count</TableHead>
                            <TableHead className="text-right">Total Expense (Rs.)</TableHead>
                            <TableHead className="text-right">% of Total Expenses</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pnlData.expenseBreakdown.byType.map((bt, idx) => {
                            const pct =
                              expVal > 0
                                ? ((parseFloat(bt.total) / expVal) * 100).toFixed(1)
                                : "0.0";
                            return (
                              <TableRow key={bt.expenseTypeId} className="hover:bg-muted/30">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-3 w-3 rounded-full shrink-0"
                                      style={{
                                        background:
                                          CHART_COLORS[idx % CHART_COLORS.length],
                                      }}
                                    />
                                    <span className="font-medium text-sm">
                                      {bt.expenseTypeName}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-sm">
                                  <Badge variant="secondary">{bt.count}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-sm">
                                  {fmt(bt.total)}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-primary transition-all"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="w-12 text-right">{pct}%</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {/* Totals row */}
                          <TableRow className="border-t-2 font-semibold bg-muted/30">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-center">
                              {pnlData.expenseBreakdown.expenseCount}
                            </TableCell>
                            <TableCell className="text-right">
                              {fmt(pnlData.totalExpenses)}
                            </TableCell>
                            <TableCell className="text-right">100%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Charts Section ── */}
              {(pieData.length > 0 || true) && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4 text-primary" />
                        Expense Category Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pieData.length === 0 ? (
                        <EmptyState
                          icon={PieChartIcon}
                          title="No expense data"
                          description="No expenses recorded for this period to display distribution."
                        />
                      ) : (
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                  `${name} (${(percent * 100).toFixed(0)}%)`
                                }
                                outerRadius={90}
                                dataKey="value"
                              >
                                {pieData.map((_, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <ReTooltip
                                formatter={(value: number) => [
                                  `Rs. ${fmt(value)}`,
                                  "Amount",
                                ]}
                                contentStyle={{
                                  borderRadius: "8px",
                                  border: "1px solid hsl(var(--border))",
                                  background: "hsl(var(--card))",
                                  color: "hsl(var(--card-foreground))",
                                }}
                              />
                              <Legend
                                formatter={(value) => (
                                  <span className="text-xs text-foreground">{value}</span>
                                )}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Bar Chart */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Revenue vs Expenses vs Profit
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={barData}
                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="hsl(var(--border))"
                            />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tickFormatter={(v) => `${fmtShort(v)}`}
                              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <ReTooltip
                              formatter={(value: number) => [
                                `Rs. ${fmt(value)}`,
                              ]}
                              contentStyle={{
                                borderRadius: "8px",
                                border: "1px solid hsl(var(--border))",
                                background: "hsl(var(--card))",
                                color: "hsl(var(--card-foreground))",
                              }}
                            />
                            <Legend
                              formatter={(value) => (
                                <span className="text-xs text-foreground">{value}</span>
                              )}
                            />
                            <Bar
                              dataKey="Revenue"
                              fill="hsl(142, 76%, 36%)"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="Expenses"
                              fill="hsl(0, 84%, 60%)"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="Profit"
                              fill="hsl(25, 75%, 45%)"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── Export Button ── */}
              <Card className="bg-muted/30">
                <CardContent className="flex items-center justify-between flex-wrap gap-4 py-4">
                  <div>
                    <p className="font-medium text-sm">Export PnL Report</p>
                    <p className="text-xs text-muted-foreground">
                      Download a full CSV including date, revenue, expense, profit,
                      expense type, and description.
                    </p>
                  </div>
                  <Button onClick={handleExportCSV} className="gap-2 shrink-0">
                    <Download className="h-4 w-4" />
                    Download PnL CSV
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            /* ── No PnL generated yet ── */
            <Card>
              <CardContent className="py-0">
                <EmptyState
                  icon={BarChart3}
                  title="No PnL report generated"
                  description="Select a date range above and click 'Generate PnL Report' to view your business performance."
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfitAndLoss;
