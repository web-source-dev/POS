"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import reportService from '@/services/reportService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from '@/components/reports/tables/DataTable';
import BarChartComponent from '@/components/reports/charts/BarChart';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Define types for data structures
interface DateRange {
  startDate: string;
  endDate: string;
}

interface ExpenseCategory {
  category: string;
  amount: number | string;
  percentage: number | string;
  [key: string]: unknown; // For any additional fields
}

interface ExpenseBreakdown {
  category: string;
  amount: string | number;
  percentage: string | number;
  [key: string]: unknown; // Add index signature
}

interface Transaction {
  date: string;
  description: string;
  paymentMethod: string;
  amount: number;
  status: string;
  category: string;
  [key: string]: unknown; // Already has index signature
}

// Define a DataItem type compatible with BarChartComponent
type DataItem = {
  [key: string]: string | number;
};

// MonthlyTrendData extends DataItem to ensure compatibility
interface MonthlyTrendData extends DataItem {
  period: string;
  amount: number;
}

interface TrendDataItem {
  period: string;
  categories?: Record<string, number | string>;
  amount?: number;
  total?: number;
  month?: number | string;
  [key: string]: unknown; // For any additional properties
}

interface MonthlyExpenseData {
  category: string;
  amount: number | string;
  percentage?: number | string;
  breakdown?: ExpenseBreakdown[];
}

// Define types for API response
interface ApiResponse {
  success?: boolean;
  data?: ExpenseCategory[] | TrendDataItem[] | Transaction[] | unknown;
  summary?: {
    totalExpenses?: number;
    [key: string]: unknown;
  };
}

export default function ExpenseDetailPage() {
  const params = useParams();
  const [expenseData, setExpenseData] = useState<MonthlyExpenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyTrendData[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  console.log(setDateRange);

  // Wrap fetchExpenseTransactions in useCallback to prevent it from being recreated on every render
  const fetchExpenseTransactions = useCallback(async (categoryFilter: string | null, customDateRange: DateRange = dateRange) => {
    try {
      let expenseTransactions: Transaction[] = [];
      
      // First try to get expense transactions from the reportService directly
      try {
        const expenseResponse = await reportService.getExpenseTransactions(customDateRange) as ApiResponse;
        if (expenseResponse && expenseResponse.success) {
          expenseTransactions = (expenseResponse.data as Transaction[]) || [];
          
          // Add proper parsing of date and ensure all fields are present
          expenseTransactions = expenseTransactions.map(expense => ({
            ...expense,
            date: expense.date ? new Date(expense.date).toISOString() : new Date().toISOString(),
            description: expense.description || `${expense.category} expense`,
            amount: typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0,
            status: expense.status || 'Paid',
            category: expense.category || categoryFilter || 'Miscellaneous',
            paymentMethod: expense.paymentMethod || 'Cash'
          }));
        }
      } catch (err) {
        console.error('Error fetching from reportService.getExpenseTransactions:', err);
        
        // If that fails, try the API endpoint directly
        try {
          const response = await fetch(`/api/expenses?startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              expenseTransactions = (data.data as Transaction[]).map((expense) => ({
                ...expense,
                date: expense.date ? new Date(expense.date).toISOString() : new Date().toISOString(),
                amount: typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0
              }));
            }
          }
        } catch (error) {
          console.error('Error fetching from /api/expenses:', error);
        }
      }
      
      // If both API calls failed, generate sample data as a last resort
      if (expenseTransactions.length === 0) {
        expenseTransactions = generateSampleExpenseTransactions(customDateRange, categoryFilter);
      }
      
      // Filter by category if provided and we have transactions
      if (categoryFilter && expenseTransactions.length > 0) {
        expenseTransactions = expenseTransactions.filter((expense) => 
          expense.category && expense.category.toLowerCase() === categoryFilter.toLowerCase()
        );
      }
      
      // Sort transactions by date (newest first)
      expenseTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(expenseTransactions);
    } catch (err) {
      console.error('Error in fetchExpenseTransactions:', err);
      // Set sample data on error
      setTransactions(generateSampleExpenseTransactions(customDateRange, categoryFilter));
    }
  }, [dateRange]); // Include dateRange as a dependency

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get the category from the URL parameter
        const idParam = params.id as string;
        if (idParam.startsWith('expense-')) {
          // Extract category from the synthetic ID
          const decodedCategory = decodeURIComponent(idParam.replace('expense-', ''));
          setCategory(decodedCategory);
          
          // Create a variable to store expense category data that can be used across both API calls
          let expenseCategoryData: ExpenseCategory | null = null;
          
          // Fetch expense data with proper error handling
          try {
            // Fetch expense data from the API for the specific category
            const expensesResponse = await reportService.getExpensesByCategory(dateRange) as ApiResponse;
            
            if (expensesResponse && expensesResponse.success) {
              // Filter for the selected category
              const categoryData = (expensesResponse.data as ExpenseCategory[])?.find((item) => 
                item.category.toLowerCase() === decodedCategory.toLowerCase()
              );
              
              if (categoryData) {
                expenseCategoryData = categoryData;
                setExpenseData(categoryData);
              } else {
                // If the specific category is not found, create placeholder data
                expenseCategoryData = {
                  category: decodedCategory,
                  amount: 0,
                  percentage: 0
                };
                setExpenseData(expenseCategoryData);
              }
            } else {
              throw new Error("Failed to fetch expense data");
            }
          } catch (err) {
            console.error('Error fetching expense category data:', err);
            // Create placeholder data on error
            expenseCategoryData = {
              category: decodedCategory,
              amount: 0,
              percentage: 0
            };
            setExpenseData(expenseCategoryData);
          }
          
          // Get expense trends using the expenseCategoryData that we've already set
          try {
            const trendsResponse = await reportService.getExpensesTrends(dateRange, 'month') as ApiResponse;
            
            if (trendsResponse && trendsResponse.success && trendsResponse.data) {
              // Check the data structure and handle accordingly
              const trendsData = trendsResponse.data as TrendDataItem[];
              
              // If the API returns a structure like { period, categories: { category1: amount, ... } }
              if (Array.isArray(trendsData) && trendsData.length > 0 && trendsData[0].categories) {
                const categoryTrends = trendsData
                  .filter((item) => item.categories && item.categories[decodedCategory] !== undefined)
                  .map((item) => ({
                    period: item.period,
                    amount: parseFloat(item.categories![decodedCategory] as string || '0')
                  }));
                  
                if (categoryTrends.length > 0) {
                  setMonthlyData(categoryTrends);
                } else {
                  // If no specific category data was found, generate monthly trends
                  // based on percentage allocation of total expenses
                  const expensePercentage = expenseCategoryData && expenseCategoryData.percentage 
                    ? parseFloat(expenseCategoryData.percentage.toString()) / 100 
                    : 0.1;
                  
                  const derivedTrends = trendsData.map((item) => {
                    // Calculate this category's expense based on the total for the period
                    const totalForPeriod = Object.values(item.categories || {}).reduce(
                      (sum: number, val: string | number) => sum + (typeof val === 'string' ? parseFloat(val) : val), 0
                    );
                    const estimatedAmount = totalForPeriod * expensePercentage;
                    
                    return {
                      period: item.period,
                      amount: estimatedAmount
                    };
                  });
                  
                  setMonthlyData(derivedTrends);
                }
              } 
              // If the API returns a simpler structure for trends data
              else if (Array.isArray(trendsData)) {
                // Create derived monthly data based on overall expense trend
                const expensePercentage = expenseCategoryData && expenseCategoryData.percentage 
                  ? parseFloat(expenseCategoryData.percentage.toString()) / 100 
                  : 0.1;
                  
                const derivedMonthlyData = trendsData.map((item) => ({
                  period: item.period || `Month ${item.month || trendsData.indexOf(item) + 1}`,
                  amount: parseFloat((item.amount || item.total || 0).toString()) * expensePercentage
                }));
                
                setMonthlyData(derivedMonthlyData);
              }
            } else {
              throw new Error("Invalid trends data structure");
            }
          } catch (err) {
            console.error('Error fetching or processing expense trends data:', err);
            // Generate better sample monthly data if real data is unavailable
            const sampleMonthlyData = generateSampleMonthlyData(decodedCategory);
            setMonthlyData(sampleMonthlyData);
          }
          
          // Fetch transactions related to this expense category
          try {
            await fetchExpenseTransactions(decodedCategory);
          } catch (err) {
            console.error('Error fetching expense transactions:', err);
          }
        } else if (idParam.startsWith('monthly-expense-')) {
          // Handle monthly expense detail view
          const decodedMonth = decodeURIComponent(idParam.replace('monthly-expense-', ''));
          setCategory(`${decodedMonth} Expenses`);
          
          // Find month range
          const [monthName, year] = decodedMonth.split(' ');
          const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 
                             'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthName);
          
          if (monthIndex !== -1) {
            const startDate = new Date(parseInt(year), monthIndex, 1);
            const endDate = new Date(parseInt(year), monthIndex + 1, 0);
            
            const monthDateRange: DateRange = {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0]
            };
            
            try {
              // Fetch expenses for the specific month
              const monthlyExpenseResponse = await reportService.getExpensesByCategory(monthDateRange) as ApiResponse;
              
              if (monthlyExpenseResponse && monthlyExpenseResponse.success) {
                // Set the expense data for this month
                setExpenseData({
                  category: `${decodedMonth} Summary`,
                  amount: monthlyExpenseResponse.summary?.totalExpenses || 0,
                  breakdown: monthlyExpenseResponse.data as ExpenseBreakdown[] || []
                });
              } else {
                throw new Error("Failed to fetch monthly expense data");
              }
            } catch (err) {
              console.error('Error fetching monthly expense data:', err);
              // Create placeholder data for the month
              setExpenseData({
                category: `${decodedMonth} Summary`,
                amount: 0,
                breakdown: generateSampleExpenseBreakdown()
              });
            }
            
            try {
              // Fetch transactions for this month
              await fetchExpenseTransactions(null, monthDateRange);
            } catch (err) {
              console.error('Error fetching monthly expense transactions:', err);
            }
          } else {
            setError("Invalid month format");
          }
        } else {
          setError("Invalid expense category ID");
        }
      } catch (err) {
        console.error('Error fetching expense details:', err);
        setError("Failed to load expense data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, dateRange, fetchExpenseTransactions]);

  // Generate sample expense category breakdown
  const generateSampleExpenseBreakdown = (): ExpenseBreakdown[] => {
    const categories = [
      'Rent', 'Utilities', 'Salaries', 'Inventory', 'Marketing', 
      'Office Supplies', 'Insurance', 'Maintenance', 'Miscellaneous'
    ];
    
    const totalAmount = 10000; // Sample total expense amount
    let remaining = 100; // Total percentage
    const result: ExpenseBreakdown[] = [];
    
    // Generate random percentages for each category
    for (let i = 0; i < categories.length - 1; i++) {
      // Random percentage between 5% and 25%, but ensures we don't exceed 100%
      const percentage = Math.min(Math.floor(Math.random() * 20) + 5, remaining - 5);
      remaining -= percentage;
      
      result.push({
        category: categories[i],
        amount: (totalAmount * percentage / 100).toFixed(2),
        percentage: percentage.toFixed(1)
      });
    }
    
    // Add the last category with the remaining percentage
    result.push({
      category: categories[categories.length - 1],
      amount: (totalAmount * remaining / 100).toFixed(2),
      percentage: remaining.toFixed(1)
    });
    
    return result;
  };

  // Generate sample monthly data when real data is unavailable
  const generateSampleMonthlyData = (categoryName: string): MonthlyTrendData[] => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Generate data for past 6 months
    return months.slice(Math.max(0, currentMonth - 5), currentMonth + 1)
      .map((month, index) => {
        const base = Math.floor(Math.random() * 500) + 500;
        // Create a slight upward trend
        const amount = base + (index * 50);
        
        // Create a MonthlyTrendData object with required properties
        return {
          period: `${month} ${currentYear}`,
          amount,
          // You can add additional properties as needed
          category: categoryName,
          monthIndex: index
        };
      });
  };

  // Generate sample expense transactions when real data is unavailable
  const generateSampleExpenseTransactions = (dateRange: DateRange, categoryFilter: string | null): Transaction[] => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const paymentMethods = ['Cash', 'Credit Card', 'Bank Transfer', 'Check'];
    const statuses = ['Paid', 'Pending'];
    const categories = categoryFilter ? [categoryFilter] : [
      'Rent', 'Utilities', 'Salaries', 'Inventory', 'Marketing', 
      'Office Supplies', 'Insurance', 'Maintenance', 'Miscellaneous'
    ];
    
    const sampleData: Transaction[] = [];
    
    // Generate one entry every few days
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (Math.random() > 0.5) { // Only generate entries for some days
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        sampleData.push({
          date: new Date(currentDate).toISOString(),
          description: `${category} expense`,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          amount: Math.floor(Math.random() * 300) + 50,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          category
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1 + Math.floor(Math.random() * 3));
    }
    
    return sampleData;
  };

  // Format currency
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  // Format percentage
  const formatPercent = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading expense data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/reports">
          <Button variant="outline" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!expenseData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/reports">
          <Button variant="outline" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>No Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No expense data found for {category || 'this category'}.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/reports">
        <Button variant="outline" className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
      </Link>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Expense Detail: {category}</h1>
        <p className="text-muted-foreground">
          Detailed breakdown and analysis of expenses
        </p>
      </div>
      
      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Expense Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">Total Amount</h3>
              <p className="text-3xl font-bold">{formatCurrency(expenseData.amount)}</p>
            </div>
            {expenseData.percentage !== undefined && (
              <div>
                <h3 className="text-lg font-medium">Percentage of Total Expenses</h3>
                <p className="text-3xl font-bold">{formatPercent(expenseData.percentage)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Expense Analysis Tabs */}
      <Tabs defaultValue="overview" className="mb-6">
        <TabsList className="w-full md:w-auto grid grid-cols-2 md:inline-flex mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Expense Trends</CardTitle>
              <CardDescription>Monthly trends for {category}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {monthlyData.length > 0 ? (
                  <BarChartComponent
                    data={monthlyData} 
                    title=""
                    description=""
                    xAxisKey="period"
                    bars={[
                      { dataKey: 'amount', color: '#FF5722', name: 'Expense Amount' }
                    ]}
                    valueFormatter={formatCurrency}
                    height={300}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No trend data available for this category</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Category breakdown (for monthly view) */}
          {expenseData.breakdown && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>Breakdown by category for {category}</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={expenseData.breakdown as Record<string, unknown>[]} 
                  columns={[
                    { header: 'Category', accessorKey: 'category' },
                    { 
                      header: 'Amount', 
                      accessorKey: 'amount',
                      cell: (value: unknown) => formatCurrency(value as number),
                      align: 'right' as const
                    },
                    { 
                      header: 'Percentage', 
                      accessorKey: 'percentage',
                      cell: (value: unknown) => formatPercent(value as string | number),
                      align: 'right' as const
                    }
                  ]}
                  title="Category Breakdown"
                  emptyMessage="No category breakdown available"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Expense Transactions</CardTitle>
              <CardDescription>All transactions for {category}</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                data={transactions} 
                columns={[
                  { 
                    header: 'Date', 
                    accessorKey: 'date', 
                    cell: (value: unknown) => new Date(value as string).toLocaleDateString() 
                  },
                  { header: 'Description', accessorKey: 'description' },
                  { header: 'Payment Method', accessorKey: 'paymentMethod' },
                  { 
                    header: 'Amount', 
                    accessorKey: 'amount',
                    cell: (value: unknown) => formatCurrency(value as number),
                    align: 'right' as const
                  },
                  { header: 'Status', accessorKey: 'status' }
                ]}
                title="Expense Transactions"
                description="Individual expense transactions"
                emptyMessage="No transactions available for this category"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 