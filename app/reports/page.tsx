"use client";

import { useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { withAuthProtection } from "@/lib/protected-route";
import DateRangeSelector from "@/components/reports/DateRangeSelector";
import SalesReportView from "@/components/reports/views/SalesReportView";
import InventoryReportView from "@/components/reports/views/InventoryReportView";
import FinancialReportView from "@/components/reports/views/FinancialReportView";
import { BarChart4, Package, CircleDollarSign, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

function Reports() {
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [activeTab, setActiveTab] = useState("sales");

  // Handle date range changes
  const handleDateRangeChange = (range: { startDate: string; endDate: string }) => {
    setDateRange(range);
  };

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6 p-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive reporting and analytics for your business performance.
          </p>
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
          <Button variant="outline" size="sm" className="ml-auto">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
        
        <Tabs 
          defaultValue="sales" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sales" className="flex items-center">
              <BarChart4 className="mr-2 h-4 w-4" />
              Sales Reports
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Inventory Reports
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center">
              <CircleDollarSign className="mr-2 h-4 w-4" />
              Financial Reports
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Sales Performance</CardTitle>
                <CardDescription>
                  Analyze your sales data, trends, and performance metrics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SalesReportView dateRange={dateRange} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Inventory Analysis</CardTitle>
                <CardDescription>
                  Monitor stock levels, product performance, and inventory value.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InventoryReportView />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Financial Insights</CardTitle>
                <CardDescription>
                  Review profit & loss, expenses, and overall financial health.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FinancialReportView dateRange={dateRange} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

export default withAuthProtection(Reports);
