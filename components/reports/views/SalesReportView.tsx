"use client";

import { FC, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SalesChart from '../charts/SalesChart';
import BarChartComponent from '../charts/BarChart';
import DataTable from '../tables/DataTable';
import reportService from '@/services/reportService';
import { TrendingUp, CreditCard, ShoppingCart, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Define the DataItem type for chart components
type DataItem = {
  [key: string]: string | number;
};

// Define types for the API response
interface ApiResponse {
  success?: boolean;
  data?: SalesDataRecord[] | CategoryDataRecord[];
  summary?: {
    totalSales: string;
    totalTransactions: string;
    totalItems: number;
    averageTransaction: string;
  };
}

interface SalesDataRecord {
  date: string;
  total: number;
  items: Array<{ quantity: number; [key: string]: unknown }>;
  [key: string]: unknown;
}

interface CategoryDataRecord {
  category: string;
  sales: string;
  percentage: string;
  [key: string]: unknown;
}

interface SalesDataItem {
  date: string;
  sales: number;
  transactions: number;
  items?: number;
  avgTransaction?: number;
  time?: string;
  [key: string]: unknown;
}

interface CategoryDataItem {
  category: string;
  sales: number;
  percentage: number;
  [key: string]: string | number;
}

interface SalesReportViewProps {
  dateRange: { startDate: string; endDate: string };
}

const SalesReportView: FC<SalesReportViewProps> = ({ dateRange }) => {
  const router = useRouter();
  const [salesData, setSalesData] = useState<SalesDataItem[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDataItem[]>([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalTransactions: 0,
    totalItems: 0,
    averageTransaction: 0,
  });
  const [currentView, setCurrentView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dailySalesData, setDailySalesData] = useState<SalesDataItem[]>([]);
  const [weeklySalesData, setWeeklySalesData] = useState<SalesDataItem[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<SalesDataItem[]>([]);
  const [salesResponseData, setSalesResponseData] = useState<SalesDataRecord[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use actual API endpoints instead of mock data
        const salesResponse = await reportService.getSalesReport(dateRange) as ApiResponse;
        const categoryResponse = await reportService.getSalesByCategory(dateRange) as ApiResponse;
        
        console.log('Sales Response:', salesResponse);
        console.log('Category Response:', categoryResponse);
        
        // Process sales data
        if (salesResponse && salesResponse.success) {
          // Get sales data for charts
          if (salesResponse.data) {
            // Store the raw sales data for detailed views
            setSalesResponseData(salesResponse.data as SalesDataRecord[]);
            
            // Transform the data for the chart - including time information
            const chartData = (salesResponse.data as SalesDataRecord[]).map((sale) => {
              const date = new Date(sale.date);
              return {
                date: date.toISOString().split('T')[0],
                time: date.toTimeString().split(' ')[0].substring(0, 5),
                sales: sale.total,
                transactions: 1, // Each sale is one transaction
                items: sale.items.reduce((sum, item) => sum + item.quantity, 0)
              };
            });
            
            // Group sales by date for daily view
            const salesByDate: Record<string, { sales: number, transactions: number, items: number }> = {};
            chartData.forEach((item) => {
              if (!salesByDate[item.date]) {
                salesByDate[item.date] = { sales: 0, transactions: 0, items: 0 };
              }
              salesByDate[item.date].sales += item.sales;
              salesByDate[item.date].transactions += item.transactions;
              salesByDate[item.date].items += item.items;
            });
            
            // Convert to array and sort by date - DAILY data
            const processedDailyData = Object.keys(salesByDate).map(date => ({
              date,
              sales: salesByDate[date].sales,
              transactions: salesByDate[date].transactions,
              items: salesByDate[date].items,
              avgTransaction: salesByDate[date].sales / salesByDate[date].transactions
            }));
            
            processedDailyData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setDailySalesData(processedDailyData);
            setSalesData(processedDailyData);
            
            // Group by week
            const salesByWeek: Record<string, { sales: number, transactions: number, items: number }> = {};
            chartData.forEach((item) => {
              const date = new Date(item.date);
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
              const weekKey = weekStart.toISOString().split('T')[0];
              
              if (!salesByWeek[weekKey]) {
                salesByWeek[weekKey] = { sales: 0, transactions: 0, items: 0 };
              }
              salesByWeek[weekKey].sales += item.sales;
              salesByWeek[weekKey].transactions += item.transactions;
              salesByWeek[weekKey].items += item.items;
            });
            
            // Convert to array for WEEKLY data
            const processedWeeklyData = Object.keys(salesByWeek).map(weekStart => {
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekEnd.getDate() + 6);
              return {
                date: `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd.toISOString().split('T')[0])}`,
                sales: salesByWeek[weekStart].sales,
                transactions: salesByWeek[weekStart].transactions,
                items: salesByWeek[weekStart].items,
                avgTransaction: salesByWeek[weekStart].sales / salesByWeek[weekStart].transactions
              };
            });
            
            processedWeeklyData.sort((a, b) => {
              const dateA = new Date(a.date.split(' - ')[0]);
              const dateB = new Date(b.date.split(' - ')[0]);
              return dateB.getTime() - dateA.getTime();
            });
            setWeeklySalesData(processedWeeklyData);
            
            // Group by month
            const salesByMonth: Record<string, { sales: number, transactions: number, items: number }> = {};
            chartData.forEach((item) => {
              const date = new Date(item.date);
              const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
              
              if (!salesByMonth[monthKey]) {
                salesByMonth[monthKey] = { sales: 0, transactions: 0, items: 0 };
              }
              salesByMonth[monthKey].sales += item.sales;
              salesByMonth[monthKey].transactions += item.transactions;
              salesByMonth[monthKey].items += item.items;
            });
            
            // Convert to array for MONTHLY data
            const processedMonthlyData = Object.keys(salesByMonth).map(monthKey => {
              const year = parseInt(monthKey.split('-')[0]);
              const month = parseInt(monthKey.split('-')[1]) - 1;
              const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
              
              return {
                date: `${monthName} ${year}`,
                sales: salesByMonth[monthKey].sales,
                transactions: salesByMonth[monthKey].transactions,
                items: salesByMonth[monthKey].items,
                avgTransaction: salesByMonth[monthKey].sales / salesByMonth[monthKey].transactions
              };
            });
            
            processedMonthlyData.sort((a, b) => {
              const [monthA, yearA] = a.date.split(' ');
              const [monthB, yearB] = b.date.split(' ');
              const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
              const indexA = monthNames.indexOf(monthA) + parseInt(yearA) * 12;
              const indexB = monthNames.indexOf(monthB) + parseInt(yearB) * 12;
              return indexB - indexA;
            });
            setMonthlySalesData(processedMonthlyData);
          }
          
          // Set summary data
          if (salesResponse.summary) {
            setSummary({
              totalSales: parseFloat(salesResponse.summary.totalSales) || 0,
              totalTransactions: parseInt(salesResponse.summary.totalTransactions) || 0,
              totalItems: salesResponse.summary.totalItems || 0,
              averageTransaction: parseFloat(salesResponse.summary.averageTransaction) || 0,
            });
          }
        }
        
        // Process category data
        if (categoryResponse && categoryResponse.success && categoryResponse.data) {
          setCategoryData(
            (categoryResponse.data as CategoryDataRecord[]).map((item) => ({
              category: item.category,
              sales: parseFloat(item.sales),
              percentage: parseFloat(item.percentage)
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching sales report data:', error);
      } finally {
      }
    };

    fetchData();
  }, [dateRange]);

  // Format date to MM/DD/YYYY
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Format date to MM/DD
  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentView(value as 'daily' | 'weekly' | 'monthly');
    
    switch(value) {
      case 'daily':
        setSalesData(dailySalesData);
        break;
      case 'weekly':
        setSalesData(weeklySalesData);
        break;
      case 'monthly':
        setSalesData(monthlySalesData);
        break;
    }
  };

  // Columns for the sales table
  const salesColumns = [
    {
      header: 'Date',
      accessorKey: 'date',
      cell: (value: unknown) => value as string
    },
    {
      header: 'Sales',
      accessorKey: 'sales',
      cell: (value: unknown) => formatCurrency(value as number),
      align: 'right' as const
    },
    {
      header: 'Transactions',
      accessorKey: 'transactions',
      align: 'right' as const
    },
    {
      header: 'Items Sold',
      accessorKey: 'items',
      align: 'right' as const
    },
    {
      header: 'Avg. Transaction',
      accessorKey: 'avgTransaction',
      cell: (value: unknown) => formatCurrency(value as number),
      align: 'right' as const
    }
  ];

  // Daily sales columns with time
  const dailyDetailColumns = [
    {
      header: 'Date',
      accessorKey: 'date',
      cell: (value: unknown) => formatDate(value as string)
    },
    {
      header: 'Time',
      accessorKey: 'time',
    },
    {
      header: 'Sales',
      accessorKey: 'sales',
      cell: (value: unknown) => formatCurrency(value as number),
      align: 'right' as const
    },
    {
      header: 'Items',
      accessorKey: 'items',
      align: 'right' as const
    }
  ];

  // Add a function to handle row clicks
  const handleSaleRowClick = (sale: Record<string, unknown>) => {
    // For sales data, we'll use the date as part of the ID since we don't have a specific ID
    // In a real app, you'd use the actual sale ID from the database
    if (sale && sale.date) {
      router.push(`/reports/sales/${encodeURIComponent(sale.date as string)}`);
    }
  };


  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from previous period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from previous period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalItems.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              +18.2% from previous period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.averageTransaction)}</div>
            <p className="text-xs text-muted-foreground">
              +5.2% from previous period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <SalesChart data={salesData} />
        <BarChartComponent 
          data={categoryData as DataItem[]}
          title="Sales by Category"
          description="Distribution of sales by product category"
          xAxisKey="category"
          bars={[
            { dataKey: 'sales', color: '#8884d8', name: 'Sales Amount' }
          ]}
          valueFormatter={formatCurrency}
          layout="horizontal"
          height={300}
          showLabels={true}
        />
      </div>

      {/* Detailed Table */}
      <Tabs defaultValue="daily" onValueChange={handleTabChange}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="daily" className="pt-4">
          <DataTable 
            data={dailySalesData} 
            columns={salesColumns}
            title="Daily Sales Summary"
            description="Detailed breakdown of sales performance by day"
            emptyMessage="No daily sales data available for the selected period"
            onRowClick={handleSaleRowClick}
          />
        </TabsContent>
        <TabsContent value="weekly" className="pt-4">
          <DataTable 
            data={weeklySalesData} 
            columns={salesColumns}
            title="Weekly Sales Summary"
            description="Detailed breakdown of sales performance by week"
            emptyMessage="No weekly sales data available for the selected period"
            onRowClick={handleSaleRowClick}
          />
        </TabsContent>
        <TabsContent value="monthly" className="pt-4">
          <DataTable 
            data={monthlySalesData} 
            columns={salesColumns}
            title="Monthly Sales Summary"
            description="Detailed breakdown of sales performance by month"
            emptyMessage="No monthly sales data available for the selected period"
            onRowClick={handleSaleRowClick}
          />
        </TabsContent>
      </Tabs>
      
      {/* Transactions Detail */}
      {currentView === 'daily' && salesData.length > 0 && (
        <Card className="mt-6">
          <CardContent>
            <DataTable 
              data={salesData.length > 0 ? 
                salesResponseData.map((sale) => {
                  const date = new Date(sale.date);
                  return {
                    date: date.toISOString().split('T')[0],
                    time: date.toTimeString().split(' ')[0].substring(0, 5),
                    sales: sale.total,
                    items: sale.items.reduce((sum, item) => sum + item.quantity, 0),
                    originalData: sale // Store the original data for the detail view
                  };
                }) : []
              } 
              columns={dailyDetailColumns}
              title="Transaction Log"
              description="Detailed list of all transactions"
              pageSize={5}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesReportView; 