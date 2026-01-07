import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Filter, TrendingUp, DollarSign, ShoppingCart, Package } from "lucide-react";
import { format } from "date-fns";
import api from '@/api/client';

interface SalesData {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  itemsSold: number;
  liters: number;
}

const SalesSummary = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterToday, setFilterToday] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // Fetch sales data
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params: any = {};

        if (filterToday) {
          const today = format(new Date(), 'yyyy-MM-dd');
          params.dateFrom = today;
          params.dateTo = today;
        } else if (selectedMonth && selectedYear) {
          const monthNum = parseInt(selectedMonth);
          const yearNum = parseInt(selectedYear);
          const firstDay = new Date(yearNum, monthNum, 1);
          const lastDay = new Date(yearNum, monthNum + 1, 0);
          params.dateFrom = format(firstDay, 'yyyy-MM-dd');
          params.dateTo = format(lastDay, 'yyyy-MM-dd');
        } else if (selectedYear && !selectedMonth && !dateFrom && !dateTo) {
          params.dateFrom = `${selectedYear}-01-01`;
          params.dateTo = `${selectedYear}-12-31`;
        } else {
          if (dateFrom) params.dateFrom = dateFrom;
          if (dateTo) params.dateTo = dateTo;
        }

        // Fetch from bills endpoint with aggregation
        const resp = await api.get('/bills', { params: { ...params, noPagination: true } });
        const bills = resp.data?.billsResponse?.data ?? resp.data?.data ?? [];

        // Aggregate by date
        const aggregated = new Map<string, SalesData>();

        for (const bill of bills) {
          const dateKey = format(new Date(bill.date || bill.createdAt), 'yyyy-MM-dd');
          const existing = aggregated.get(dateKey) || {
            date: dateKey,
            revenue: 0,
            cost: 0,
            profit: 0,
            itemsSold: 0,
            liters: 0,
          };

          const revenue = Number(bill.total || 0);
          const cost = Number(bill.cost || revenue * 0.7); // Estimate if not available

          existing.revenue += revenue;
          existing.cost += cost;
          existing.profit += (revenue - cost);
          existing.itemsSold += Number(bill.item_count || 0);

          aggregated.set(dateKey, existing);
        }

        const sorted = Array.from(aggregated.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        if (!cancelled) {
          setSalesData(sorted);
        }
      } catch (err) {
        console.error('Failed to fetch sales data', err);
        if (!cancelled) setSalesData([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [filterToday, selectedMonth, selectedYear, dateFrom, dateTo]);

  // Statistics
  const stats = useMemo(() => {
    const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
    const totalCost = salesData.reduce((sum, d) => sum + d.cost, 0);
    const totalProfit = salesData.reduce((sum, d) => sum + d.profit, 0);
    const totalItemsSold = salesData.reduce((sum, d) => sum + d.itemsSold, 0);
    const totalLiters = salesData.reduce((sum, d) => sum + d.liters, 0);

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      totalItemsSold,
      totalLiters,
      profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0',
    };
  }, [salesData]);

  // Clear filters
  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setFilterToday(false);
    setSelectedMonth("");
    setSelectedYear(new Date().getFullYear().toString());
  };

  // Download CSV report
  const downloadReport = () => {
    try {
      const headers = ['Date', 'Revenue', 'Cost', 'Profit', 'Items Sold', 'Profit Margin %'];
      const rows = salesData.map(d => [
        d.date,
        d.revenue.toFixed(2),
        d.cost.toFixed(2),
        d.profit.toFixed(2),
        d.itemsSold.toString(),
        d.revenue > 0 ? ((d.profit / d.revenue) * 100).toFixed(2) : '0.00',
      ]);

      // Summary row
      const summaryRow = [
        'TOTAL',
        stats.totalRevenue.toFixed(2),
        stats.totalCost.toFixed(2),
        stats.totalProfit.toFixed(2),
        stats.totalItemsSold.toString(),
        stats.profitMargin,
      ];

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        '',
        summaryRow.map(cell => `"${cell}"`).join(','),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sales-summary-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download report', err);
    }
  };

  // Generate month options
  const monthOptions = [
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  // Generate year options (last 5 years + current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Sales Summary</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View sales performance and analytics
          </p>
        </div>
        <Button onClick={downloadReport} className="gap-2">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-green-600">
              Rs.{stats.totalRevenue.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-orange-600">
              Rs.{stats.totalCost.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-blue-600">
              Rs.{stats.totalProfit.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              Items Sold
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold">
              {stats.totalItemsSold}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Profit Margin
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-purple-600">
              {stats.profitMargin}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Filter className="h-4 w-4 md:h-5 md:w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4">
            {/* Month */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Month</Label>
              <Select
                value={selectedMonth || "all"}
                onValueChange={(val) => {
                  setSelectedMonth(val === "all" ? "" : val);
                  setFilterToday(false);
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                <SelectTrigger className="h-9 md:h-10">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {monthOptions.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-9 md:h-10">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setFilterToday(false);
                  setSelectedMonth("");
                }}
                className="h-9 md:h-10"
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setFilterToday(false);
                  setSelectedMonth("");
                }}
                className="h-9 md:h-10"
              />
            </div>

            {/* Today Checkbox */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">&nbsp;</Label>
              <div className="flex items-center gap-2 border rounded-md px-3 h-9 md:h-10">
                <Checkbox
                  id="filterTodaySales"
                  checked={filterToday}
                  onCheckedChange={(checked) => {
                    setFilterToday(checked as boolean);
                    if (checked) {
                      setDateFrom("");
                      setDateTo("");
                      setSelectedMonth("");
                    }
                  }}
                />
                <Label htmlFor="filterTodaySales" className="text-xs md:text-sm cursor-pointer">
                  Today
                </Label>
              </div>
            </div>

            {/* Clear Button */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">&nbsp;</Label>
              <Button variant="outline" onClick={clearFilters} className="h-9 md:h-10 w-full">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Table */}
      {salesData.length > 0 && (
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Daily Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left font-medium">Date</th>
                    <th className="p-2 text-right font-medium">Revenue</th>
                    <th className="p-2 text-right font-medium">Cost</th>
                    <th className="p-2 text-right font-medium">Profit</th>
                    <th className="p-2 text-right font-medium">Items</th>
                    <th className="p-2 text-right font-medium">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((d, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{format(new Date(d.date), 'MMM dd, yyyy')}</td>
                      <td className="p-2 text-right text-green-600 font-medium">Rs.{d.revenue.toFixed(2)}</td>
                      <td className="p-2 text-right text-orange-600">Rs.{d.cost.toFixed(2)}</td>
                      <td className="p-2 text-right text-blue-600 font-medium">Rs.{d.profit.toFixed(2)}</td>
                      <td className="p-2 text-right">{d.itemsSold}</td>
                      <td className="p-2 text-right">{d.revenue > 0 ? ((d.profit / d.revenue) * 100).toFixed(1) : '0.0'}%</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 font-bold bg-muted">
                    <td className="p-2">TOTAL</td>
                    <td className="p-2 text-right text-green-600">Rs.{stats.totalRevenue.toFixed(2)}</td>
                    <td className="p-2 text-right text-orange-600">Rs.{stats.totalCost.toFixed(2)}</td>
                    <td className="p-2 text-right text-blue-600">Rs.{stats.totalProfit.toFixed(2)}</td>
                    <td className="p-2 text-right">{stats.totalItemsSold}</td>
                    <td className="p-2 text-right">{stats.profitMargin}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesSummary;

