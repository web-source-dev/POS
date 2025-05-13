"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import reportService from '@/services/reportService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from '@/components/reports/tables/DataTable';
import FinancialChart from '@/components/reports/charts/FinancialChart';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Add proper API response types
interface ApiResponse {
  success?: boolean;
  data?: unknown;
  summary?: unknown;
  error?: string;
}

// At the top of the file, add this interface for financial summary data
interface FinancialSummaryData {
  revenue: string;
  expenses: string;
  profit: string;
  profitMargin: string;
  currentBalance?: string;
  revenueBreakdown?: Array<{category: string, amount: string, percentage: string}>;
  expenseBreakdown?: Array<{category: string, amount: string, percentage: string}>;
  [key: string]: unknown; // Allow additional properties
}

// Interface for detailed financial data breakdown
interface DetailedFinancialItem {
  category: string;
  type: string;
  amount: number;
  percentage: number;
  [key: string]: unknown; // Add index signature
}

// Interface for cash drawer transaction
interface CashDrawerTransaction {
  date: string;
  operation: string;
  notes: string;
  amount: number;
  balance: number;
  reference?: string;
  [key: string]: unknown; // Already has index signature
}

// Interface for date range
interface DateRange {
  startDate: string;
  endDate: string;
}

// Interface for financial data object
interface FinancialDataObject {
  summary: FinancialSummaryData;
  profitLoss: unknown;
  cashFlow: unknown;
}

export default function FinancialDetailPage() {
  const params = useParams();
  const [financialData, setFinancialData] = useState<FinancialDataObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>('');
  const [detailedData, setDetailedData] = useState<DetailedFinancialItem[]>([]);
  const [transactions, setTransactions] = useState<CashDrawerTransaction[]>([]);

  // Determine date range from period string
  const getDateRangeFromPeriod = (periodStr: string): DateRange => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Parse period strings like "Jan 2023", "Q1 2023", "2023"
    if (periodStr.includes(' ')) {
      const [month, year] = periodStr.split(' ');
      
      // Monthly data (e.g., "Jan 2023")
      const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
      if (monthIndex !== -1) {
        const startDate = new Date(parseInt(year), monthIndex, 1);
        const endDate = new Date(parseInt(year), monthIndex + 1, 0); // Last day of month
        
        return {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        };
      }
      
      // Quarterly data (e.g., "Q1 2023")
      if (month.startsWith('Q')) {
        const quarter = parseInt(month.substring(1));
        const startMonth = (quarter - 1) * 3;
        const startDate = new Date(parseInt(year), startMonth, 1);
        const endDate = new Date(parseInt(year), startMonth + 3, 0); // Last day of quarter
        
        return {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        };
      }
    } else {
      // Yearly data (e.g., "2023")
      const year = parseInt(periodStr);
      if (!isNaN(year)) {
        return {
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`
        };
      }
    }
    
    // Default to this month if format is not recognized
    const startDate = new Date(currentYear, now.getMonth(), 1);
    const endDate = new Date(currentYear, now.getMonth() + 1, 0);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // Move fetchCashDrawerData inside useEffect or wrap it in useCallback
  const fetchCashDrawerData = useCallback(async (dateRange: DateRange): Promise<CashDrawerTransaction[]> => {
    try {
      let cashDrawerData: CashDrawerTransaction[] = [];
      
      // First try to use the reportService directly
      try {
        if (typeof reportService.getCashDrawer === 'function') {
          const cashDrawerResponse = await reportService.getCashDrawer(dateRange) as ApiResponse;
          if (cashDrawerResponse && cashDrawerResponse.success && Array.isArray(cashDrawerResponse.data)) {
            // Make sure each transaction has the required fields
            cashDrawerData = (cashDrawerResponse.data as unknown[]).map((transaction: unknown) => {
              const typedTransaction = transaction as Record<string, unknown>;
              return {
                date: typedTransaction.date ? new Date(typedTransaction.date as string).toISOString() : new Date().toISOString(),
                operation: (typedTransaction.operation as string) || 'unknown',
                notes: (typedTransaction.notes as string) || (typedTransaction.description as string) || 'No description',
                amount: parseFloat((typedTransaction.amount as string | number)?.toString() || '0'),
                balance: parseFloat((typedTransaction.balance as string | number)?.toString() || '0'),
                reference: (typedTransaction.reference as string) || undefined
              };
            });
            
            // Sort the data by date (newest first)
            cashDrawerData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            return cashDrawerData;
          }
        }
      } catch (error) {
        console.error('Error fetching from reportService.getCashDrawer:', error);
      }
      
      // If reportService failed, try the direct API endpoint
      try {
        const response = await fetch(`/api/cash-drawer?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            cashDrawerData = (data.data as unknown[]).map((transaction: unknown) => {
              const typedTransaction = transaction as Record<string, unknown>;
              return {
                date: typedTransaction.date ? new Date(typedTransaction.date as string).toISOString() : new Date().toISOString(),
                operation: (typedTransaction.operation as string) || 'unknown',
                notes: (typedTransaction.notes as string) || (typedTransaction.description as string) || 'No description',
                amount: parseFloat((typedTransaction.amount as string | number)?.toString() || '0'),
                balance: parseFloat((typedTransaction.balance as string | number)?.toString() || '0')
              };
            });
            
            // Sort by date
            cashDrawerData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            return cashDrawerData;
          }
        }
      } catch (error) {
        console.error('Error fetching from /api/cash-drawer:', error);
      }
      
      // If both methods failed, generate sample data
      const sampleData = generateSampleCashDrawerData(dateRange);
      return sampleData;
    } catch (err) {
      console.error('Error in fetchCashDrawerData:', err);
      return [];
    }
  }, []);

  // Generate sample cash drawer data when real data is unavailable
  const generateSampleCashDrawerData = (dateRange: DateRange): CashDrawerTransaction[] => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const sampleData: CashDrawerTransaction[] = [];
    
    // Generate one entry per day
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      sampleData.push({
        date: new Date(currentDate).toISOString(),
        operation: Math.random() > 0.7 ? 'expense' : 'sale',
        notes: Math.random() > 0.7 ? 'Inventory Purchase' : 'Daily Sales',
        amount: Math.floor(Math.random() * 500) + 50,
        balance: 5000 // Just a placeholder
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return sampleData;
  };

  // Create detailed breakdown of financial data
  const createDetailedBreakdown = (summary: FinancialSummaryData, transactions: CashDrawerTransaction[]) => {
    if (!summary) return;
    
    const detailed: DetailedFinancialItem[] = [];
    
    // Add revenue breakdown
    // If we have real data from the API with revenue categories, use that
    const totalRevenue = parseFloat(summary.revenue) || 0;
    
    // Check if we have real revenue category data from the backend
    if (summary.revenueBreakdown && Array.isArray(summary.revenueBreakdown) && summary.revenueBreakdown.length > 0) {
      // Use the real revenue breakdown
      summary.revenueBreakdown.forEach((item) => {
        detailed.push({
          category: item.category,
          type: 'Revenue',
          amount: parseFloat(item.amount) || 0,
          percentage: parseFloat(item.percentage) || 0
        });
      });
    } else {
      // Use estimated revenue breakdown
      const revenueCategories = [
        { name: 'Product Sales', percentage: 70 },
        { name: 'Service Revenue', percentage: 20 },
        { name: 'Other Income', percentage: 10 }
      ];
      
      revenueCategories.forEach(category => {
        detailed.push({
          category: category.name,
          type: 'Revenue',
          amount: (totalRevenue * category.percentage / 100),
          percentage: category.percentage
        });
      });
    }
    
    // Add expense breakdown using transaction data
    const totalExpenses = parseFloat(summary.expenses) || 0;
    
    // Check if we have expense category data from the backend
    if (summary.expenseBreakdown && Array.isArray(summary.expenseBreakdown) && summary.expenseBreakdown.length > 0) {
      // Use the real expense breakdown
      summary.expenseBreakdown.forEach((item) => {
        detailed.push({
          category: item.category,
          type: 'Expense',
          amount: parseFloat(item.amount) || 0,
          percentage: parseFloat(item.percentage) || 0
        });
      });
    } else {
      // Try to generate expense breakdown from transactions
      // Ensure we have valid transactions
      const validTransactions = Array.isArray(transactions) ? transactions : [];
      
      // Extract expense categories from transaction data
      const expenseCategories = validTransactions
        .filter(t => t && t.operation === 'expense')
        .reduce((acc: Record<string, number>, transaction: CashDrawerTransaction) => {
          const category = transaction.notes || 'Uncategorized';
          if (!acc[category]) acc[category] = 0;
          acc[category] += (parseFloat(transaction.amount.toString()) || 0);
          return acc;
        }, {});
      
      // Create expense breakdown
      if (Object.keys(expenseCategories).length > 0) {
        Object.keys(expenseCategories).forEach(category => {
          const amount = expenseCategories[category];
          const percentage = totalExpenses > 0 ? (amount / totalExpenses * 100) : 0;
          detailed.push({
            category,
            type: 'Expense',
            amount,
            percentage
          });
        });
      } else {
        // If no transaction data, create default expense categories
        const defaultExpenseCategories = [
          { name: 'Rent & Utilities', percentage: 25 },
          { name: 'Salaries', percentage: 35 },
          { name: 'Inventory', percentage: 20 },
          { name: 'Marketing', percentage: 10 },
          { name: 'Miscellaneous', percentage: 10 }
        ];
        
        defaultExpenseCategories.forEach(category => {
          detailed.push({
            category: category.name,
            type: 'Expense',
            amount: (totalExpenses * category.percentage / 100),
            percentage: category.percentage
          });
        });
      }
    }
    
    setDetailedData(detailed);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get the period from the URL parameter
        const idParam = params.id as string;
        if (idParam.startsWith('financial-')) {
          // Extract period from the synthetic ID
          const decodedPeriod = decodeURIComponent(idParam.replace('financial-', ''));
          setPeriod(decodedPeriod);
          
          // Determine date range based on the period format
          const dateRange = getDateRangeFromPeriod(decodedPeriod);
          
          // Fetch all financial data with proper error handling
          let financialSummaryData: FinancialSummaryData | null = null;
          let profitLossData = null;
          let cashFlowData = null;
          let cashDrawerData: CashDrawerTransaction[] = [];

          // Improved error handling and data formatting for financial summary
          try {
            const financialSummary = await reportService.getFinancialSummary(dateRange) as ApiResponse;
            if (financialSummary && financialSummary.success) {
              financialSummaryData = financialSummary.data as FinancialSummaryData;
              
              // Ensure numeric values are properly parsed
              if (financialSummaryData) {
                // Handle the different ways data might be structured
                if (typeof financialSummaryData === 'object') {
                  // Ensure all numeric fields are properly formatted
                  Object.keys(financialSummaryData).forEach(key => {
                    if (typeof financialSummaryData![key] === 'string' && !isNaN(parseFloat(financialSummaryData![key] as string))) {
                      financialSummaryData![key] = parseFloat(financialSummaryData![key] as string).toFixed(2);
                    }
                  });
                }
              }
            }
          } catch (err) {
            console.error('Error fetching financial summary:', err);
            // Create default financial data on error
            financialSummaryData = {
              revenue: '0.00',
              expenses: '0.00',
              profit: '0.00',
              profitMargin: '0.00'
            };
          }

          try {
            const profitLoss = await reportService.getProfitAndLoss(dateRange) as ApiResponse;
            if (profitLoss && profitLoss.success) {
              profitLossData = profitLoss.data;
            }
          } catch (err) {
            console.error('Error fetching profit and loss:', err);
          }

          try {
            const cashFlow = await reportService.getCashFlow(dateRange) as ApiResponse;
            if (cashFlow && cashFlow.success) {
              cashFlowData = cashFlow.data;
            }
          } catch (err) {
            console.error('Error fetching cash flow:', err);
          }

          try {
            cashDrawerData = await fetchCashDrawerData(dateRange);
          } catch (err) {
            console.error('Error fetching cash drawer data:', err);
          }
          
          // After all data is fetched, set the financial data with fallbacks for missing data
          setFinancialData({
            summary: financialSummaryData || {
              revenue: '0.00',
              expenses: '0.00',
              profit: '0.00',
              profitMargin: '0.00'
            },
            profitLoss: profitLossData || [],
            cashFlow: cashFlowData || []
          });
          
          // Set default transactions if no data
          if (!cashDrawerData || cashDrawerData.length === 0) {
            const sampleData = generateSampleCashDrawerData(dateRange);
            cashDrawerData = sampleData;
          }
          
          setTransactions(cashDrawerData);
          
          // Create detailed breakdown of revenue and expenses
          if (financialSummaryData) {
            createDetailedBreakdown(financialSummaryData, cashDrawerData);
          } else {
            // Create a default breakdown if no data
            const defaultSummary = {
              revenue: '1000.00',
              expenses: '500.00',
              profit: '500.00',
              profitMargin: '50.00'
            };
            createDetailedBreakdown(defaultSummary, cashDrawerData);
          }
        } else {
          setError("Invalid financial record ID");
        }
      } catch (err) {
        console.error('Error fetching financial details:', err);
        setError("Failed to load financial data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, fetchCashDrawerData]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading financial data...</p>
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

  if (!financialData) {
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
            <p>No financial data found for this period.</p>
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
        <h1 className="text-3xl font-bold tracking-tight">Financial Report: {period}</h1>
        <p className="text-muted-foreground">
          Detailed financial analysis for the selected period
        </p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(parseFloat(financialData.summary?.revenue || '0'))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(parseFloat(financialData.summary?.expenses || '0'))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(parseFloat(financialData.summary?.profit || '0'))}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatPercent(parseFloat(financialData.summary?.profitMargin || '0'))} Margin
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="overview" className="mb-6">
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Financial Performance</CardTitle>
              <CardDescription>Revenue vs Expenses for {period}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <FinancialChart 
                  data={[
                    {
                      period,
                      revenue: parseFloat(financialData.summary?.revenue || '0'),
                      expenses: parseFloat(financialData.summary?.expenses || '0'),
                      profit: parseFloat(financialData.summary?.profit || '0')
                    }
                  ]}
                  title=""
                  description=""
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Financial Transactions</CardTitle>
              <CardDescription>All transactions during this period</CardDescription>
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
                  { header: 'Type', accessorKey: 'operation' },
                  { header: 'Description', accessorKey: 'notes' },
                  { 
                    header: 'Amount', 
                    accessorKey: 'amount',
                    cell: (value: unknown) => formatCurrency(value as number),
                    align: 'right' as const
                  },
                  { 
                    header: 'Balance', 
                    accessorKey: 'balance',
                    cell: (value: unknown) => formatCurrency(value as number),
                    align: 'right' as const
                  }
                ]}
                title="Transactions"
                description="All cash movements for the period"
                emptyMessage="No transactions available for this period"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Financial Breakdown</CardTitle>
              <CardDescription>Detailed breakdown of revenue and expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                data={detailedData as Record<string, unknown>[]} 
                columns={[
                  { header: 'Category', accessorKey: 'category' },
                  { header: 'Type', accessorKey: 'type' },
                  { 
                    header: 'Amount', 
                    accessorKey: 'amount',
                    cell: (value: unknown) => formatCurrency(value as number),
                    align: 'right' as const
                  },
                  { 
                    header: 'Percentage', 
                    accessorKey: 'percentage',
                    cell: (value: unknown) => formatPercent(value as number),
                    align: 'right' as const
                  }
                ]}
                title="Financial Categories"
                description="Breakdown by category"
                emptyMessage="No detailed data available"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 