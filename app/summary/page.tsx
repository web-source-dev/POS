"use client";

import { useState, useEffect } from 'react';
import { withAuthProtection } from '@/lib/protected-route';
import summaryService from '@/services/summaryService';
import { InventoryPerformanceChart } from '@/components/charts/InventoryPerformanceChart';
import { InventoryPerformanceTable } from '@/components/inventory/InventoryPerformanceTable';
import { SummaryMetrics } from '@/components/Summary/SummaryMetrics';
import { MonthlyStockAnalysis } from '@/components/Summary/MonthlyStockAnalysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MainLayout } from '@/components/layout/main-layout';

// Define the interface for inventory performance data
interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  price: number;
  purchasePrice: number;
  salesQuantity: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  status: string;
}

interface InventoryPerformanceData {
  mostSelling: InventoryItem[];
  mediumSelling: InventoryItem[];
  lowSelling: InventoryItem[];
  notSelling: InventoryItem[];
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    averageProfitMargin: number;
  };
}

// Define interface for monthly stock data
interface CategoryData {
  name: string;
  value: number;
}

interface MonthlyStock {
  month: string;
  year: number;
  totalStock: number;
  stockByCategory: CategoryData[];
}

interface MonthlyStockData {
  monthlyStockData: MonthlyStock[];
  summary: {
    currentMonthStock: number;
    previousMonthStock: number;
    percentChange: number;
  };
}

function SummaryPage() {
  const [performanceData, setPerformanceData] = useState<InventoryPerformanceData | null>(null);
  const [stockData, setStockData] = useState<MonthlyStockData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch both datasets in parallel
        const [inventoryPerformance, monthlyStock] = await Promise.all([
          summaryService.getInventoryPerformance(),
          summaryService.getMonthlyStockAnalysis()
        ]);
        
        setPerformanceData(inventoryPerformance as InventoryPerformanceData);
        setStockData(monthlyStock as MonthlyStockData);
        setError(null);
      } catch (err) {
        console.error('Error fetching summary data:', err);
        setError('Failed to load summary data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-xl font-medium">Loading summary data...</p>
        </div>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto p-4 md:p-6">
          <Alert variant="destructive" className="mb-6 shadow-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }
  
  // If data is null, return loading view as fallback (shouldn't happen with our current flow)
  if (!performanceData) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-xl font-medium">Loading summary data...</p>
        </div>
      </MainLayout>
    );
  }
  
  // Helper function to get insight icon by type
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-[hsl(var(--primary))]" />;
      case 'success':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'danger':
        return <TrendingDown className="h-5 w-5 text-[hsl(var(--destructive))]" />;
      default:
        return <Lightbulb className="h-5 w-5 text-[hsl(var(--primary))]" />;
    }
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 md:px-6">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Inventory Performance Summary</h1>
          <p className="text-muted-foreground">
            Analyze how your inventory items are performing in terms of sales, revenue, and profit.
          </p>
        </div>
        
        {/* Key Metrics Section */}
        <div className="mb-8">
          <SummaryMetrics data={performanceData} previousData={null} />
        </div>
        
        {/* Charts and Tables Tabs */}
        <Tabs defaultValue="charts" className="w-full mb-8">
          <div className="border-b mb-4">
            <TabsList className="mb-0">
              <TabsTrigger value="charts" className="text-sm sm:text-base">Performance Charts</TabsTrigger>
              <TabsTrigger value="tables" className="text-sm sm:text-base">Detailed Tables</TabsTrigger>
              <TabsTrigger value="stock" className="text-sm sm:text-base">Stock Analysis</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="charts" className="mt-0">
            <div className="grid gap-6">
              <InventoryPerformanceChart data={performanceData} />
              
              {/* Distribution Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-green-700 dark:text-green-300 text-lg">Most Selling</CardTitle>
                    <CardDescription className="text-green-600/80 dark:text-green-400/80">Top performing items</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {performanceData.mostSelling.length} items
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-[hsl(var(--primary)/0.05)] to-[hsl(var(--primary)/0.1)] dark:from-[hsl(var(--primary)/0.15)] dark:to-[hsl(var(--primary)/0.25)] border-[hsl(var(--primary)/0.2)] shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[hsl(var(--primary))] text-lg">Medium Selling</CardTitle>
                    <CardDescription className="text-[hsl(var(--primary)/0.8)]">Good performers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[hsl(var(--primary))]">
                      {performanceData.mediumSelling.length} items
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-blue-700 dark:text-blue-300 text-lg">Low Selling</CardTitle>
                    <CardDescription className="text-blue-600/80 dark:text-blue-400/80">Underperforming items</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {performanceData.lowSelling.length} items
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-[hsl(var(--destructive)/0.05)] to-[hsl(var(--destructive)/0.1)] dark:from-[hsl(var(--destructive)/0.15)] dark:to-[hsl(var(--destructive)/0.25)] border-[hsl(var(--destructive)/0.2)] shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[hsl(var(--destructive))] dark:text-[hsl(var(--destructive)/0.8)] text-lg">Not Selling</CardTitle>
                    <CardDescription className="text-[hsl(var(--destructive)/0.8)] dark:text-[hsl(var(--destructive)/0.6)]">Items with minimal/no sales</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[hsl(var(--destructive))] dark:text-[hsl(var(--destructive)/0.8)]">
                      {performanceData.notSelling.length} items
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tables" className="mt-0">
            <InventoryPerformanceTable data={performanceData} />
          </TabsContent>
          
          <TabsContent value="stock" className="mt-0">
            <MonthlyStockAnalysis data={stockData} />
          </TabsContent>
        </Tabs>
        
        {/* Actionable Insights Section */}
        <Card className="mb-8 shadow-sm">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-xl">Actionable Insights</CardTitle>
            <CardDescription>
              Based on your inventory performance, here are some recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {performanceData.notSelling.length > 0 && (
                <div className="flex gap-3">
                  {getInsightIcon('danger')}
                  <div>
                    <h3 className="font-medium text-lg mb-1.5">Non-Performing Items</h3>
                    <p className="text-muted-foreground">
                      You have <span className="text-[hsl(var(--destructive))] font-medium">{performanceData.notSelling.length} items</span> that are not selling well. 
                      Consider running promotions, bundle deals, or reassessing your pricing strategy 
                      for these items.
                    </p>
                  </div>
                </div>
              )}
              
              {performanceData.lowSelling.length > 0 && (
                <div className="flex gap-3">
                  {getInsightIcon('warning')}
                  <div>
                    <h3 className="font-medium text-lg mb-1.5">Underperforming Items</h3>
                    <p className="text-muted-foreground">
                      There are <span className="text-[hsl(var(--primary))] font-medium">{performanceData.lowSelling.length} items</span> that could perform better. 
                      Try different marketing approaches or better placement in your store.
                    </p>
                  </div>
                </div>
              )}
              
              {performanceData.mostSelling.length > 0 && (
                <div className="flex gap-3">
                  {getInsightIcon('success')}
                  <div>
                    <h3 className="font-medium text-lg mb-1.5">Top Performers</h3>
                    <p className="text-muted-foreground">
                      Your <span className="text-green-500 font-medium">{performanceData.mostSelling.length} best-selling items</span> are driving significant revenue. 
                      Ensure you maintain adequate stock levels and consider featuring these items 
                      prominently in your marketing.
                    </p>
                  </div>
                </div>
              )}
              
              {stockData && stockData.summary?.percentChange < -10 && (
                <div className="flex gap-3">
                  {getInsightIcon('warning')}
                  <div>
                    <h3 className="font-medium text-lg mb-1.5">Declining Stock Levels</h3>
                    <p className="text-muted-foreground">
                      Your inventory stock has decreased by <span className="text-[hsl(var(--primary))] font-medium">{Math.abs(stockData.summary.percentChange).toFixed(2)}%</span> compared to last month.
                      Review your reordering process to ensure you&apos;re maintaining adequate stock levels.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                {getInsightIcon(performanceData.summary.averageProfitMargin < 20 ? 'warning' : performanceData.summary.averageProfitMargin > 40 ? 'success' : 'normal')}
                <div>
                  <h3 className="font-medium text-lg mb-1.5">Profit Margin Optimization</h3>
                  <p className="text-muted-foreground">
                    Your overall profit margin is <span className={`font-medium ${
                      performanceData.summary.averageProfitMargin < 20 
                        ? "text-[hsl(var(--primary))]"
                        : performanceData.summary.averageProfitMargin > 40
                          ? "text-green-500"
                          : "text-muted-foreground"
                    }`}>{performanceData.summary.averageProfitMargin.toFixed(2)}%</span>. 
                    {performanceData.summary.averageProfitMargin < 20 
                      ? "This is on the lower side. Consider adjusting prices or finding ways to reduce costs."
                      : performanceData.summary.averageProfitMargin > 40
                        ? "This is excellent! Maintain your current pricing strategy while monitoring competition."
                        : "This is within a healthy range. Continue to monitor and optimize costs."
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

// Wrap with auth protection
export default withAuthProtection(SummaryPage);
