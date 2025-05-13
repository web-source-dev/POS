"use client"

import { useState, useEffect, useCallback } from 'react';
import { withAuthProtection } from '@/lib/protected-route';
import dashboardService from '@/services/dashboardService';
import { StatsCards } from './stats-cards';
import { RecentSales } from './recent-sales';
import { LowStockItems } from './low-stock-items';
import { CashDrawerOperations } from './cash-drawer-operations';
import { SalesChart } from './sales-chart';
import { InventoryStatusChart } from './inventory-status-chart';
import { ExpensesBreakdown } from './expenses-breakdown';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Database, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import from the proper component files so types match
interface SaleItem {
  itemId: string;
  name: string;
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
  date: string;
}

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

interface CashDrawerOperation {
  _id: string;
  date: string;
  previousBalance: number;
  amount: number;
  balance: number;
  operation: 'add' | 'remove' | 'count' | 'sale' | 'expense' | 'initialization' | 'close';
  notes: string;
}

interface ExpenseCategory {
  category: string;
  total: number;
}

interface DashboardSummary {
  todaySales: { total: number; count: number };
  todayExpenses: { total: number; count: number };
  monthlySales: Array<{ _id: string; total: number; count: number }>;
  monthlyExpenses: Array<{ _id: string; total: number; count: number }>;
  inventoryStatus: Array<{ _id: string; count: number }>;
  lowStockItems: Array<InventoryItem>;
  cashDrawerOperations: Array<CashDrawerOperation>;
  latestSales: Array<Sale>;
  inventoryValue: { totalValue: number; totalItems: number };
  hasData?: boolean;
  error?: string;
}

interface SampleDataResponse {
  success: boolean;
  message: string;
  counts?: {
    inventory: number;
    sales: number;
    expenses: number;
    cashDrawer: number;
  };
}

function MainDashboardContent() {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noDataFound, setNoDataFound] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch main dashboard data
      const data = await dashboardService.getDashboardSummary() as DashboardSummary;
      setDashboardData(data);
      
      // Check if data was found or if we have an empty dashboard
      setNoDataFound(!data.hasData || !!data.error);
      
      // If there was an error, show it
      if (data.error) {
        setError(data.error);
      }
      
      // Fetch additional chart data
      const expensesData = await dashboardService.getExpensesByCategory(parseInt(selectedTimeframe));
      
      // Only use the expensesByCategory data since it's the only one being used in the UI
      setExpensesByCategory(expensesData);
    } catch (err: unknown) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeframe]);

  // Function to generate sample data for testing
  const generateSampleData = async () => {
    try {
      setIsGeneratingSample(true);
      setError(null);
      
      // Call the API to generate sample data
      const result = await dashboardService.generateSampleData() as SampleDataResponse;
      
      if (result.success) {
        // Refresh dashboard data after generating sample data
        await fetchDashboardData();
        setNoDataFound(false);
      } else {
        setError('Failed to generate sample data');
      }
    } catch (err: unknown) {
      console.error('Error generating sample data:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate sample data');
    } finally {
      setIsGeneratingSample(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeframe, fetchDashboardData]);

  // Count low stock items
  const lowStockCount = dashboardData?.inventoryStatus?.find(
    (status) => status._id === 'Low Stock'
  )?.count || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading dashboard data...</span>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <div>{error}</div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show no data message with option to generate sample data
  if (noDataFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <Alert variant="default" className="max-w-2xl mb-4">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>No Dashboard Data Found</AlertTitle>
          <AlertDescription>
            Your dashboard is empty. You can generate sample data for testing purposes or start adding real data through the inventory, sales, and expenses modules.
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-4 mt-4">
          <Button 
            onClick={generateSampleData}
            disabled={isGeneratingSample}
          >
            {isGeneratingSample ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Generate Sample Data
              </>
            )}
          </Button>
          
          <Button 
            variant="outline"
            onClick={fetchDashboardData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDashboardData}
            className="mr-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Tabs 
            defaultValue={selectedTimeframe} 
            className="w-[400px]"
            onValueChange={setSelectedTimeframe}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="7">Last 7 Days</TabsTrigger>
              <TabsTrigger value="30">Last 30 Days</TabsTrigger>
              <TabsTrigger value="90">Last 90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Key Metrics */}
      <StatsCards 
        todaySales={dashboardData?.todaySales || { total: 0, count: 0 }}
        todayExpenses={dashboardData?.todayExpenses || { total: 0, count: 0 }}
        inventoryValue={dashboardData?.inventoryValue || { totalValue: 0, totalItems: 0 }}
        lowStockCount={lowStockCount}
      />

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <SalesChart 
          salesData={dashboardData?.monthlySales || []}
          expensesData={dashboardData?.monthlyExpenses || []}
        />
        <ExpensesBreakdown expensesData={expensesByCategory} />
      </div>

      {/* Secondary Charts & Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentSales sales={dashboardData?.latestSales || []} />
        <LowStockItems items={dashboardData?.lowStockItems || []} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CashDrawerOperations operations={dashboardData?.cashDrawerOperations || []} />
        <InventoryStatusChart statusData={dashboardData?.inventoryStatus || []} />
      </div>
    </div>
  );
}

export const MainDashboard = withAuthProtection(MainDashboardContent);
