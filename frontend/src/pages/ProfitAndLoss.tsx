import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import LocalLoader from "@/components/common/LocalLoader";
import { expenseService } from "@/api/services/expenseService";
import type {
  ExpenseType,
  Expense,
  CreateExpensePayload,
  PnLData,
} from "@/types/expense.types";

// ─── Helper: format currency ───
const fmt = (val: string | number) => {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? "0.00" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ─── Pending expense row (before saving) ───
type PendingExpense = {
  _key: string;
  amount: string;
  description: string;
  date: string;
  expenseTypeId: string;
  expenseTypeName: string;
};

const ProfitAndLoss = () => {
  const { toast } = useToast();

  // ── Expense types ──
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);

  // ── Add expense form ──
  const [expAmount, setExpAmount] = useState("");
  const [expTypeId, setExpTypeId] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [expDate, setExpDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // ── Pending (unsaved) expenses ──
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // ── Filters ──
  const now = new Date();
  const [filterFrom, setFilterFrom] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [filterTo, setFilterTo] = useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const [filterTypeId, setFilterTypeId] = useState("all");

  // ── Saved expenses list ──
  const [savedExpenses, setSavedExpenses] = useState<Expense[]>([]);
  const [expensePagination, setExpensePagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });

  // ── P&L data ──
  const [pnlData, setPnlData] = useState<PnLData | null>(null);
  const [pnlGenerated, setPnlGenerated] = useState(false);
  const [isLoadingPnl, setIsLoadingPnl] = useState(false);

  // ── Fetch expense types ──
  const fetchTypes = async () => {
    try {
      const { expenseTypes: types } = await expenseService.listTypes();
      setExpenseTypes(types);
    } catch {
      toast({ title: "Error", description: "Failed to load expense types" });
    }
  };

  // ── Fetch saved expenses with filters ──
  const fetchExpenses = async (page = 1) => {
    try {
      const query: any = { page, limit: 20, dateFrom: filterFrom, dateTo: filterTo };
      if (filterTypeId !== "all") query.expenseTypeId = filterTypeId;
      const { expenses, pagination } = await expenseService.listExpenses(query);
      setSavedExpenses(expenses);
      setExpensePagination(pagination);
    } catch {
      toast({ title: "Error", description: "Failed to load expenses" });
    }
  };

  useEffect(() => {
    fetchTypes();
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to create type" });
    }
  };

  const handleDeleteType = async (id: string) => {
    try {
      await expenseService.deleteType(id);
      toast({ title: "Deleted", description: "Expense type removed" });
      fetchTypes();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to delete type" });
    }
  };

  // ── Add to pending list ──
  const handleAddToPending = () => {
    if (!expAmount || parseFloat(expAmount) <= 0 || !expTypeId || !expDate) {
      toast({ title: "Validation", description: "Amount, type, and date are required" });
      return;
    }
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
  };

  const removePending = (key: string) => {
    setPendingExpenses((prev) => prev.filter((p) => p._key !== key));
  };

  // ── Save all pending expenses ──
  const handleSaveExpenses = async () => {
    if (pendingExpenses.length === 0) return;
    setIsSaving(true);
    try {
      const expenses: CreateExpensePayload[] = pendingExpenses.map((p) => ({
        amount: parseFloat(p.amount),
        description: p.description || null,
        date: new Date(p.date).toISOString(),
        expenseTypeId: p.expenseTypeId,
      }));
      await expenseService.bulkCreateExpenses({ expenses });
      toast({ title: "Saved", description: `${expenses.length} expense(s) saved successfully` });
      setPendingExpenses([]);
      fetchExpenses();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to save expenses" });
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
      const data = await expenseService.getPnL({ dateFrom: filterFrom, dateTo: filterTo });
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
      toast({ title: "Error", description: err?.response?.data?.message ?? "Failed to delete" });
    }
  };

  // ── Pending total ──
  const pendingTotal = useMemo(
    () => pendingExpenses.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    [pendingExpenses]
  );

  return (
    <div className="space-y-6">
      {/* ═══════ Page Header ═══════ */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profit & Loss</h1>
        <p className="text-sm text-muted-foreground">
          Track revenue, manage expenses, and generate P&L reports
        </p>
      </div>

      {/* ═══════ Filters Section ═══════ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Date Range & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="filterFrom">From</Label>
              <Input
                id="filterFrom"
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="filterTo">To</Label>
              <Input
                id="filterTo"
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1">
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
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Apply
              </Button>
              <Button onClick={handleGeneratePnl} disabled={isLoadingPnl}>
                <BarChart3 className="mr-2 h-4 w-4" /> Generate P&L
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════ P&L Summary Cards ═══════ */}
      {pnlGenerated && pnlData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                Rs. {fmt(pnlData.totalRevenue)}
              </div>
              <p className="text-xs text-green-600/70 mt-1">
                {pnlData.revenueBreakdown.billCount} bill(s)
              </p>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Total Expenses</CardTitle>
              <Receipt className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                Rs. {fmt(pnlData.totalExpenses)}
              </div>
              <p className="text-xs text-red-600/70 mt-1">
                {pnlData.expenseBreakdown.expenseCount} expense(s)
              </p>
            </CardContent>
          </Card>

          {/* Net P&L */}
          <Card
            className={
              parseFloat(pnlData.netProfitOrLoss) >= 0
                ? "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900"
                : "border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900"
            }
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle
                className={`text-sm font-medium ${
                  parseFloat(pnlData.netProfitOrLoss) >= 0
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-orange-700 dark:text-orange-400"
                }`}
              >
                Net {parseFloat(pnlData.netProfitOrLoss) >= 0 ? "Profit" : "Loss"}
              </CardTitle>
              {parseFloat(pnlData.netProfitOrLoss) >= 0 ? (
                <TrendingUp className="h-5 w-5 text-blue-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-orange-600" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  parseFloat(pnlData.netProfitOrLoss) >= 0
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-orange-700 dark:text-orange-400"
                }`}
              >
                Rs. {fmt(pnlData.netProfitOrLoss)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(pnlData.dateFrom), "MMM d, yyyy")} –{" "}
                {format(new Date(pnlData.dateTo), "MMM d, yyyy")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════ Expense Breakdown ═══════ */}
      {pnlGenerated && pnlData && pnlData.expenseBreakdown.byType.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Expense Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense Type</TableHead>
                  <TableHead className="text-center">Count</TableHead>
                  <TableHead className="text-right">Total (Rs.)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pnlData.expenseBreakdown.byType.map((bt) => (
                  <TableRow key={bt.expenseTypeId}>
                    <TableCell className="font-medium">{bt.expenseTypeName}</TableCell>
                    <TableCell className="text-center">{bt.count}</TableCell>
                    <TableCell className="text-right">{fmt(bt.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* ═══════ Expense Types Management ═══════ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Tags className="h-4 w-4" /> Expense Types
            </CardTitle>
            <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="mr-1 h-3 w-3" /> Add Type
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Add Expense Type</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateType} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="typeName">Type Name</Label>
                    <Input
                      id="typeName"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="e.g. Salaries, Rent, Utilities"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Type
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <LocalLoader loaderKey="expense-types">
            {expenseTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No expense types yet. Add one to get started.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {expenseTypes.map((t) => (
                  <Badge key={t.id} variant="secondary" className="text-sm py-1 px-3 gap-2">
                    {t.name}
                    <button
                      onClick={() => handleDeleteType(t.id)}
                      className="ml-1 hover:text-destructive transition-colors"
                      title="Remove type"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </LocalLoader>
        </CardContent>
      </Card>

      {/* ═══════ Add Expenses Section ═══════ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Expense form */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <Label htmlFor="expAmount">Amount (Rs.)</Label>
              <Input
                id="expAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={expTypeId} onValueChange={setExpTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {expenseTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="expDate">Date</Label>
              <Input
                id="expDate"
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expDesc">Description (optional)</Label>
              <Input
                id="expDesc"
                value={expDescription}
                onChange={(e) => setExpDescription(e.target.value)}
                placeholder="Brief note"
              />
            </div>
            <Button onClick={handleAddToPending} className="h-10">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>

          {/* Pending expenses table */}
          {pendingExpenses.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Expenses ({pendingExpenses.length}) — Total: Rs. {fmt(pendingTotal)}
                </p>
                <Button onClick={handleSaveExpenses} disabled={isSaving} size="sm">
                  <Save className="mr-1 h-4 w-4" />{" "}
                  {isSaving ? "Saving..." : "Save All"}
                </Button>
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount (Rs.)</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingExpenses.map((p) => (
                      <TableRow key={p._key}>
                        <TableCell>{format(new Date(p.date), "yyyy-MM-dd")}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.expenseTypeName}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.description || "—"}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(p.amount)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removePending(p._key)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* ═══════ Saved Expenses List ═══════ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Saved Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LocalLoader loaderKey="expenses">
            {savedExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No expenses found for the selected date range.
              </p>
            ) : (
              <div className="space-y-3">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount (Rs.)</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savedExpenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>
                          {format(new Date(exp.date), "yyyy-MM-dd")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{exp.expenseType?.name ?? "—"}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{exp.description || "—"}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(exp.amount)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteExpense(exp.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {expensePagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={expensePagination.currentPage <= 1}
                    onClick={() => fetchExpenses(expensePagination.currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center text-sm text-muted-foreground">
                    Page {expensePagination.currentPage} of {expensePagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={expensePagination.currentPage >= expensePagination.totalPages}
                    onClick={() => fetchExpenses(expensePagination.currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
          </LocalLoader>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitAndLoss;
