"use client"

import { useState, useEffect } from "react"
import { BarChart, Calendar, Download, LineChart, PieChart, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesReportChart } from "@/components/reports/sales-report-chart"
import { InventoryValueChart } from "@/components/reports/inventory-value-chart"
import { TopCategoriesChart } from "@/components/reports/top-categories-chart"
import reportService from "@/services/reportService"

interface ApiSalesChartData {
  name: string
  sales: number
}

interface SalesReportSummary {
  totalSales: number
  averageSale: number
  totalTransactions: number
  profitMargin: number
}

interface SalesReportResponse {
  chartData: ApiSalesChartData[]
  summary: SalesReportSummary
}

export function ReportsPage() {
  const [timeframe, setTimeframe] = useState<string>("daily")
  const [salesSummary, setSalesSummary] = useState<SalesReportSummary>({
    totalSales: 0,
    averageSale: 0,
    totalTransactions: 0,
    profitMargin: 0
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [dateRange, setDateRange] = useState<string>("")

  // Fetch summary data for sales dashboard
  useEffect(() => {
    const fetchSalesSummary = async () => {
      try {
        setLoading(true)
        const response = await reportService.getSalesReport(timeframe) as SalesReportResponse
        setSalesSummary(response.summary)
        
        // Update date range display
        const now = new Date()
        const startDate = new Date()
        
        // Set start date based on timeframe
        if (timeframe === "daily") {
          startDate.setDate(now.getDate() - 7)
          setDateRange(`${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`)
        } else if (timeframe === "weekly") {
          startDate.setDate(now.getDate() - 28)
          setDateRange(`${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`)
        } else if (timeframe === "monthly") {
          startDate.setMonth(now.getMonth() - 6)
          setDateRange(`${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`)
        } else if (timeframe === "yearly") {
          startDate.setFullYear(now.getFullYear() - 1)
          setDateRange(`${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`)
        }
      } catch (error) {
        console.error("Error fetching sales summary:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSalesSummary()
  }, [timeframe])

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value)
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const response = await reportService.getSalesReport(timeframe) as SalesReportResponse
      setSalesSummary(response.summary)
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const blob = await reportService.exportReport("sales", "csv", { timeframe })
      
      // Create a temporary link to download the file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `sales-report-${timeframe}-${new Date().toISOString().split("T")[0]}.csv`
      
      // Append to the document and trigger the download
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting report:", error)
      // You could add a toast notification here
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Calendar className="h-4 w-4" />
            {dateRange || "Select Date Range"}
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs {salesSummary.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground mt-1">From {dateRange}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs {salesSummary.averageSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesSummary.totalTransactions}</div>
                <p className="text-xs text-muted-foreground mt-1">Completed sales</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesSummary.profitMargin.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Avg. across all products</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>Sales performance for the selected period</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <SalesReportChart timeframe={timeframe} />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
                <CardDescription>Sales distribution by product category</CardDescription>
              </CardHeader>
              <CardContent>
                <TopCategoriesChart timeframe={timeframe} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Inventory Value Trend</CardTitle>
                <CardDescription>Total inventory value over time</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <InventoryValueChart />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>Current inventory breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border rounded-md">
                  <div className="flex flex-col items-center text-center p-8">
                    <PieChart className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Inventory Status</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {loading ? "Loading inventory status..." : "Showing current inventory status breakdown."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
