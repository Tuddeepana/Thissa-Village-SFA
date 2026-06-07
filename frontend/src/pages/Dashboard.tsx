import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Package, AlertCircle, Receipt } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from '@/api/client';
import LocalLoader from '@/components/common/LocalLoader';
import { Skeleton } from '@/components/ui/skeleton';
import { formatSL } from '@/utils/dateUtils';

// color palette for pie slices
const COLOR_VARS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
];

const DAY_ORDER = ['monday', 'tuesday', 'wensday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTH_KEYS = ['jan','feb','march','april','may','june','july','aug','sep','oct','nov','dec'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Dashboard = () => {
  const [weeklyData, setWeeklyData] = useState<Array<{ day: string; income: number }>>([]);
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number; color: string }>>([]);

  const [weeklyIncome, setWeeklyIncome] = useState<string>('0');
  const [dailyIncome, setDailyIncome] = useState<string>('0');
  const [todayBillCount, setTodayBillCount] = useState<number>(0);
  const [monthlyIncome, setMonthlyIncome] = useState<string>('0');
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
  const resp = await api.get('/dashboard/summary', { meta: { showLoader: 'local', loaderKey: 'dashboard-stats' } });
        const payload = resp.data?.response ?? resp.data;

        if (cancelled) return;

        // Stats
        setWeeklyIncome(payload.weeklyIncome ?? '0');
        setMonthlyIncome(payload.monthlyIncome ?? '0');
        setTotalProducts(Number(payload.TotalProduct ?? 0));
        setLowStockCount((payload.lowStockItems ?? []).length ?? 0);

        const DAY_ORDER_BACKEND = ['sunday', 'monday', 'tuesday', 'wensday', 'thursday', 'friday', 'saturday'];
        const todayKey = DAY_ORDER_BACKEND[new Date().getDay()];
        setDailyIncome(payload.weeklyIncomeResponse?.[todayKey] ?? '0');
        setTodayBillCount(payload.weeklyBillCountResponse?.[todayKey] ?? 0);

        // Weekly chart mapping
        const wResp = payload.weeklyIncomeResponse ?? {};
        const wData = DAY_ORDER.map((key, idx) => ({
          day: DAY_LABELS[idx],
          income: Number((wResp[key] ?? '0')),
        }));
        setWeeklyData(wData);

        // Monthly mapping
        const mResp = payload.monthlyIncomeResponse ?? {};
        const mData = MONTH_KEYS.map((k, idx) => ({ month: MONTH_LABELS[idx], revenue: Number(mResp[k] ?? '0') }));
        setMonthlyData(mData);

        // Category distribution
        const cat = payload.categoryDistribution ?? [];
        const mappedCats = (cat as any[]).map((c, i) => ({ name: c.categoryName ?? c.name, value: Number(c.percentage ?? c.value ?? 0), color: COLOR_VARS[i % COLOR_VARS.length] }));
        setCategoryData(mappedCats);
      } catch (err: any) {
        console.error('Failed to load dashboard summary', err);
        setError(err?.response?.data?.message ?? err.message ?? 'Failed to load data');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Overview of your store performance</p>
      </div>

      {error && (
        <div className="text-sm text-destructive">Error loading dashboard: {error}</div>
      )}

      {/* Stat Cards with Loader */}
      <LocalLoader
        loaderKey="dashboard-stats"
        renderSkeleton={() => (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-3 w-24 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rs.{Number(dailyIncome || '0').toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Colombo', month: 'short', day: '2-digit', year: 'numeric' }).format(new Date())}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today Bills</CardTitle>
            <Receipt className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{todayBillCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Colombo', month: 'short', day: '2-digit', year: 'numeric' }).format(new Date())}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Rs.{Number(monthlyIncome || '0').toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Colombo', month: 'long', year: 'numeric' }).format(new Date())}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Across categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>
      </LocalLoader>

      {/* Charts */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Weekly Income</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="income" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Product Category Distribution</CardTitle>
        </CardHeader>
        <CardContent className="px-2 md:px-6">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Distribution']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name="Distribution %"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-1))", r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
