"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowUp,
  Box,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { InventoryAlerts } from "@/components/dashboard/inventory-alerts"
import { TopSellingItems } from "@/components/dashboard/top-selling-items"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { SalesAnalytics } from "@/components/dashboard/sales-analytics"
import { InventoryOverview } from "@/components/dashboard/inventory-overview"
import dashboardService from "@/services/dashboardService"

// Types for dashboard data
interface FinancialSummary {
  cashBalance: number
  lastUpdated: string
  todaySales: {
    amount: number
    count: number
  }
  todayExpenses: {
    amount: number
    count: number
  }
  todayNetCashFlow: number
}

interface InventoryStats {
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  totalValue: number
}

export function MainDashboard() {
  // State for dashboard data
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null)
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch financial summary
        const summary = await dashboardService.getFinancialSummary('today')
        setFinancialSummary(summary)
        
        // Fetch inventory statistics
        const stats = await dashboardService.getInventoryStats()
        setInventoryStats(stats as InventoryStats)
        
        // Set last updated timestamp
        setLastUpdated(new Date().toLocaleString())
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales Today</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  PKR {loading ? "..." : financialSummary?.todaySales.amount.toFixed(2) || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {/* When we have historical data, we could show a trend */}
                  <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">{financialSummary?.todaySales.count || 0}</span> transactions today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expenses Today</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  PKR {loading ? "..." : financialSummary?.todayExpenses.amount.toFixed(2) || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
                  <span className="text-red-600 font-medium">{financialSummary?.todayExpenses.count || 0}</span> expense transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : (inventoryStats?.lowStockItems || 0) + (inventoryStats?.outOfStockItems || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {inventoryStats?.outOfStockItems || 0} items out of stock
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <Box className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  PKR {loading ? "..." : inventoryStats?.totalValue.toFixed(0) || "0"}
                </div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <ArrowUp className="mr-1 h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">{inventoryStats?.totalItems || 0}</span> total items
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <SalesChart />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Inventory Alerts</CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <InventoryAlerts />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest sales transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentTransactions />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
                <CardDescription>Best performing products this month</CardDescription>
              </CardHeader>
              <CardContent>
                <TopSellingItems />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <SalesAnalytics />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <InventoryOverview />
        </TabsContent>
      </Tabs>
    </div>
  )
}
