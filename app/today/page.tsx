"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, DollarSign, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import { withAuthProtection } from '@/lib/protected-route';
import { formatCurrency, formatNumber } from '@/lib/utils';
import todayService from '@/services/todayService';
import { useToast } from "@/components/ui/use-toast";
import { MainLayout } from '@/components/layout/main-layout';
import { useRouter } from 'next/navigation';
import Chart from 'chart.js/auto';

// Define types for the API response data structure
interface CashDrawerSummary {
  openingBalance: number;
  closingBalance: number;
  totalAdded: number;
  totalRemoved: number;
  currentBalance: number;
}

interface Summary {
  totalSales: number;
  totalExpenses: number;
  profitToday: number;
  itemsSold: number;
  cashDrawerSummary: CashDrawerSummary;
}

interface SaleItem {
  itemId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

interface Sale {
  _id: string;
  receiptNumber: number;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  cashAmount: number;
  change: number;
  customerName: string;
  userId: string;
  date: string;
  printed: boolean;
}

interface Expense {
  _id: string;
  expenseId: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  status: string;
  date: string;
  userId: string;
  createdAt: string;
}

interface CashDrawerOperation {
  _id: string;
  userId: string;
  date: string;
  previousBalance: number;
  amount: number;
  balance: number;
  operation: string;
  reference: string | null;
  notes: string;
}

interface PopularItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface TodayData {
  summary: Summary;
  hourlySales: number[];
  popularItems: PopularItem[];
  sales: Sale[];
  expenses: Expense[];
  cashDrawerOperations: CashDrawerOperation[];
}

function TodayPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<TodayData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Chart references
  const hourlySalesChartRef = useRef<HTMLCanvasElement>(null);
  const popularItemsChartRef = useRef<HTMLCanvasElement>(null);
  
  // Chart instance refs instead of state
  const hourlySalesChartInstance = useRef<Chart | null>(null);
  const popularItemsChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await todayService.getTodayData();
        setData(response);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error fetching data",
          description: "Could not load today's data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      // Destroy charts on component unmount
      if (hourlySalesChartInstance.current) {
        hourlySalesChartInstance.current.destroy();
        hourlySalesChartInstance.current = null;
      }
      if (popularItemsChartInstance.current) {
        popularItemsChartInstance.current.destroy();
        popularItemsChartInstance.current = null;
      }
    };
  }, [toast]);

  // Create/update charts when data or activeTab changes
  useEffect(() => {
    if (!data || activeTab !== "overview") return;
    
    // Create hourly sales chart
    if (hourlySalesChartRef.current) {
      // Destroy existing chart if it exists
      if (hourlySalesChartInstance.current) {
        hourlySalesChartInstance.current.destroy();
        hourlySalesChartInstance.current = null;
      }
      
      const ctx = hourlySalesChartRef.current.getContext('2d');
      if (ctx) {
        hourlySalesChartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.hourlySales.map((_, index) => `${index}:00`),
            datasets: [{
              label: 'Sales',
              data: data.hourlySales,
              fill: false,
              borderColor: '#8884d8',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return formatCurrency(Number(value), { notation: 'compact' });
                  }
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return formatCurrency(context.parsed.y);
                  }
                }
              }
            }
          }
        });
      }
    }
    
    // Create popular items chart
    if (popularItemsChartRef.current && data.popularItems.length > 0) {
      // Destroy existing chart if it exists
      if (popularItemsChartInstance.current) {
        popularItemsChartInstance.current.destroy();
        popularItemsChartInstance.current = null;
      }
      
      const ctx = popularItemsChartRef.current.getContext('2d');
      if (ctx) {
        popularItemsChartInstance.current = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: data.popularItems.map(item => item.name),
            datasets: [{
              data: data.popularItems.map(item => item.quantity),
              backgroundColor: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'],
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw as number;
                    const dataset = context.dataset;
                    const total = (dataset.data as number[]).reduce((acc: number, data: number) => acc + data, 0);
                    const percentage = total > 0 ? Math.round((value * 100) / total) : 0;
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    }
    
    // Cleanup function to destroy charts when dependencies change
    return () => {
      if (hourlySalesChartInstance.current) {
        hourlySalesChartInstance.current.destroy();
        hourlySalesChartInstance.current = null;
      }
      if (popularItemsChartInstance.current) {
        popularItemsChartInstance.current.destroy();
        popularItemsChartInstance.current = null;
      }
    };
  }, [data, activeTab]);

  const handleExportData = async () => {
    try {
      await todayService.exportTodayData();
      toast({
        title: "Export started",
        description: "Your data is being downloaded.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: "Could not download the data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Navigation handlers for table rows
  const handleSaleClick = (saleId: string) => {
    router.push(`/purchases/${saleId}`);
  };

  const handleExpenseClick = (expenseId: string) => {
    router.push(`/accounting/expense/${expenseId}`);
  };

  const handleCashFlowClick = (transactionId: string) => {
    router.push(`/accounting/transaction/${transactionId}`);
  };

  const handleItemClick = (itemId: string) => {
    router.push(`/inventory/view/${itemId}`);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Today&apos;s Summary</h1>
          <Button onClick={handleExportData} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Sales</CardDescription>
              <CardTitle className="text-2xl flex items-center">
                <DollarSign className="h-5 w-5 mr-1 text-green-500" />
                {data?.summary ? formatCurrency(data.summary.totalSales) : 'N/A'}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Expenses</CardDescription>
              <CardTitle className="text-2xl flex items-center">
                <TrendingDown className="h-5 w-5 mr-1 text-red-500" />
                {data?.summary ? formatCurrency(data.summary.totalExpenses) : 'N/A'}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Net Profit</CardDescription>
              <CardTitle className="text-2xl flex items-center">
                <TrendingUp className="h-5 w-5 mr-1 text-blue-500" />
                {data?.summary ? formatCurrency(data.summary.profitToday) : 'N/A'}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Items Sold</CardDescription>
              <CardTitle className="text-2xl flex items-center">
                <ShoppingCart className="h-5 w-5 mr-1 text-orange-500" />
                {data?.summary ? formatNumber(data.summary.itemsSold) : 'N/A'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Cash Drawer Summary</CardTitle>
            <CardDescription>Today&apos;s cash drawer operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Opening Balance</p>
                <p className="text-xl font-medium">
                  {data?.summary?.cashDrawerSummary 
                    ? formatCurrency(data.summary.cashDrawerSummary.openingBalance) 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Added</p>
                <p className="text-xl font-medium text-green-600">
                  {data?.summary?.cashDrawerSummary 
                    ? formatCurrency(data.summary.cashDrawerSummary.totalAdded) 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Removed</p>
                <p className="text-xl font-medium text-red-600">
                  {data?.summary?.cashDrawerSummary 
                    ? formatCurrency(data.summary.cashDrawerSummary.totalRemoved) 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-xl font-medium">
                  {data?.summary?.cashDrawerSummary 
                    ? formatCurrency(data.summary.cashDrawerSummary.currentBalance) 
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 max-w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="cash">Cash Flow</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Sales</CardTitle>
                  <CardDescription>Sales distributed throughout the day</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <canvas ref={hourlySalesChartRef} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Popular Items</CardTitle>
                  <CardDescription>Most sold items today</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <canvas ref={popularItemsChartRef} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today&apos;s Sales</CardTitle>
                <CardDescription>All sales transactions from today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data?.sales && data.sales.length > 0 ? (
                        data.sales.map((sale: Sale) => (
                          <tr 
                            key={sale._id} 
                            onClick={() => handleSaleClick(sale._id)}
                            className="cursor-pointer hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(sale.date).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{sale.receiptNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sale.items.length} ({sale.items.reduce((sum: number, item: SaleItem) => sum + item.quantity, 0)} units)
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sale.customerName || 'Walk-in'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(sale.total)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            No sales recorded today
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Items Sold Today</CardTitle>
                <CardDescription>Breakdown of all items sold today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  {data?.sales && data.sales.length > 0 ? (
                    <div>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {data.sales.flatMap(sale => 
                            sale.items.map((item: SaleItem, index: number) => (
                              <tr 
                                key={`${sale._id}-${index}`}
                                onClick={() => handleItemClick(item.itemId)}
                                className="cursor-pointer hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.sku || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(item.price)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {formatCurrency(item.price * item.quantity)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-6 py-4 text-center text-sm text-gray-500">
                      No items sold today
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today&apos;s Expenses</CardTitle>
                <CardDescription>All expenses recorded today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data?.expenses && data.expenses.length > 0 ? (
                        data.expenses.map((expense: Expense) => (
                          <tr 
                            key={expense._id}
                            onClick={() => handleExpenseClick(expense._id)}
                            className="cursor-pointer hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(expense.date).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {expense.expenseId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {expense.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {expense.description || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(expense.amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            No expenses recorded today
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cash" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cash Drawer Operations</CardTitle>
                <CardDescription>All cash drawer activities today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data?.cashDrawerOperations && data.cashDrawerOperations.length > 0 ? (
                        data.cashDrawerOperations.map((op: CashDrawerOperation) => (
                          <tr 
                            key={op._id}
                            onClick={() => handleCashFlowClick(op._id)}
                            className="cursor-pointer hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(op.date).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                              {op.operation}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(op.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(op.previousBalance)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(op.balance)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {op.notes || 'N/A'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            No cash drawer operations recorded today
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

export default withAuthProtection(TodayPage); 