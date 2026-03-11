import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Package, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useGetDashboardSummaryQuery } from '@/store/api/dashboardApi';
import { Skeleton } from '@/components/ui/skeleton';

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
  // Use RTK Query to fetch dashboard data
  const { data: dashboardData, isLoading, error } = useGetDashboardSummaryQuery();

  // Memoize computed values
  const weeklyData = useMemo(() => {
    if (!dashboardData?.weeklyIncomeResponse) return [];
    const wResp = dashboardData.weeklyIncomeResponse;
    return DAY_ORDER.map((key, idx) => ({
      day: DAY_LABELS[idx],
      income: Number(wResp[key] ?? '0'),
    }));
  }, [dashboardData?.weeklyIncomeResponse]);

  const monthlyData = useMemo(() => {
    if (!dashboardData?.monthlyIncomeResponse) return [];
    const mResp = dashboardData.monthlyIncomeResponse;
    return MONTH_KEYS.map((k, idx) => ({
      month: MONTH_LABELS[idx],
      revenue: Number(mResp[k] ?? '0'),
    }));
  }, [dashboardData?.monthlyIncomeResponse]);

  const categoryData = useMemo(() => {
    if (!dashboardData?.categoryDistribution) return [];
    return dashboardData.categoryDistribution.map((c, i) => ({
      name: c.categoryName,
      value: c.percentage,
      color: COLOR_VARS[i % COLOR_VARS.length],
    }));
  }, [dashboardData?.categoryDistribution]);

  const weeklyIncome = dashboardData?.weeklyIncome ?? '0';
  const monthlyIncome = dashboardData?.monthlyIncome ?? '0';
  const totalProducts = dashboardData?.TotalProduct ?? 0;
  const lowStockCount = dashboardData?.lowStockItems?.length ?? 0;

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Overview of your store performance</p>
      </div>

      {error && (
        <div className="text-sm text-destructive">
          Error loading dashboard: {typeof error === 'object' && 'message' in error ? String(error.message) : 'Failed to load data'}
        </div>
      )}

      {/* Stat Cards with Loading */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Income</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">Rs.{Number(weeklyIncome || '0').toFixed(2)}</div>
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +{weeklyData.length ? Math.round(((weeklyData.reduce((s, d) => s + d.income, 0) / (weeklyData.length || 1)) / 100) * 100) : 0}% from last week
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
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +{monthlyData.length ? Math.round(((monthlyData.reduce((s, d) => s + d.revenue, 0) / (monthlyData.length || 1)) / 100) * 100) : 0}% from last month
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
      )}

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

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Product Category Distribution</CardTitle>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Percentage of products by category</p>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <defs>
                  {categoryData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`colorGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={0.9}/>
                      <stop offset="95%" stopColor={entry.color} stopOpacity={0.6}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value: number | string) => [`${Number(value).toFixed(1)}%`, 'Percentage']}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#colorGradient${index})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Category Summary</CardTitle>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Detailed breakdown</p>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
              {categoryData.length > 0 ? (
                categoryData.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium text-foreground">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{category.value.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">of total</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No category data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
