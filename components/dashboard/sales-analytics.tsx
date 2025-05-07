"use client"

import { useState, useEffect } from "react"
import { BarChart2, TrendingUp, DollarSign, ShoppingCart, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import dashboardService from "@/services/dashboardService"

interface SalesReportData {
  chartData: {
    name: string
    sales: number
    profit: number
    transactions: number
  }[]
  summary: {
    totalSales: number
    averageSale: number
    totalTransactions: number
    profitMargin: number
  }
}

interface CategoryData {
  name: string
  value: number
}

export function SalesAnalytics() {
  const [timeframe, setTimeframe] = useState("monthly")
  const [salesData, setSalesData] = useState<SalesReportData | null>(null)
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true)
        
        // Fetch sales report data
        const report = await dashboardService.getSalesReport(timeframe)
        setSalesData(report as SalesReportData)
        
        // Fetch sales by category data
        const categories = await dashboardService.getSalesByCategory(timeframe)
        setCategoryData(categories as CategoryData[])
        
      } catch (error) {
        console.error("Error fetching sales data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSalesData()
  }, [timeframe])

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value)
  }

  // Return loading state if data is not yet available
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[450px]">
        <p className="text-muted-foreground">Loading sales analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Sales Analytics</h2>
          <p className="text-muted-foreground">Performance metrics and trends</p>
        </div>
        <Tabs defaultValue={timeframe} onValueChange={handleTimeframeChange}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {salesData?.summary.totalSales.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <Calendar className="mr-1 h-4 w-4" />
              {timeframe === "daily" ? "Last 7 days" : 
               timeframe === "weekly" ? "Last 4 weeks" : 
               timeframe === "monthly" ? "Last 6 months" : 
               "Last 12 months"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {salesData?.summary.averageSale.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="mr-1 h-4 w-4" />
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData?.summary.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <Calendar className="mr-1 h-4 w-4" />
              Total for period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData?.summary.profitMargin.toFixed(1) || "0"}%</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <DollarSign className="mr-1 h-4 w-4" />
              Gross profit percentage
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Sales Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {salesData && salesData.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData.chartData}>
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `PKR ${value}`} />
                    <Tooltip 
                      formatter={(value: number) => [`PKR ${value.toFixed(2)}`, '']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No sales data available for this period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData && categoryData.length > 0 ? (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Share</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryData.map((category) => (
                        <TableRow key={category.name}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${category.value}%` }}></div>
                              </div>
                              <span>{category.value}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{category.value}%</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">No category data available for this period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 