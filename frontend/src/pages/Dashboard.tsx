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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [productSalesData, setProductSalesData] = useState<Array<{ productName: string; quantitySold: number }>>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [isSalesLoading, setIsSalesLoading] = useState<boolean>(false);
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

        // Category distribution removed
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

  useEffect(() => {
    let cancelled = false;
    const fetchSales = async () => {
      setIsSalesLoading(true);
      try {
        const resp = await api.get('/dashboard/product-sales', {
          params: { month: selectedMonth, year: selectedYear }
        });
        if (!cancelled) setProductSalesData(resp.data?.data || []);
      } catch (err) {
        console.error('Failed to load product sales', err);
      } finally {
        if (!cancelled) setIsSalesLoading(false);
      }
    };
    fetchSales();
    return () => { cancelled = true; };
  }, [selectedMonth, selectedYear]);

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
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Restaurant Performance</h3>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
            </div>
          </div>
        )}
      >
      <div className="space-y-6">
        {/* Restaurant Side */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Restaurant Performance</h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
        </div>
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
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base md:text-lg">Product Sales as per Month</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-28 md:w-32">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_LABELS.map((label, idx) => (
                  <SelectItem key={idx + 1} value={(idx + 1).toString()}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24 md:w-28">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(5)].map((_, i) => {
                  const yr = new Date().getFullYear() - i;
                  return <SelectItem key={yr} value={yr.toString()}>{yr}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-2 md:px-6">
          {isSalesLoading ? (
            <div className="flex h-[250px] items-center justify-center">
              <span className="text-muted-foreground text-sm">Loading product sales...</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={productSalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="productName" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number) => [value, 'Quantity Sold']}
                />
                <Bar
                  dataKey="quantitySold"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Quantity Sold"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
