"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"
import dashboardService from "@/services/dashboardService"

interface ApiSalesChartData {
  name: string;
  sales: number;
}

interface SalesChartDataPoint {
  name: string
  sales: number
}

export function SalesChart() {
  const [chartData, setChartData] = useState<SalesChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true)
        const data = await dashboardService.getSalesChartData('daily')
        
        // Transform data if needed to match our chart format
        const formattedData = data.map((item: ApiSalesChartData) => ({
          name: item.name || '',
          sales: Number(item.sales) || 0
        }))
        
        setChartData(formattedData)
      } catch (error) {
        console.error("Error fetching sales chart data:", error)
        // Fallback data if API fails
        setChartData([
          { name: "No Data", sales: 0 }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [])

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground">Loading chart data...</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `PKR ${value}`}
        />
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <Tooltip
          formatter={(value: number) => [`PKR ${value}`, "Sales"]}
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
          }}
          itemStyle={{ color: "hsl(var(--foreground))" }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Area type="monotone" dataKey="sales" stroke="#f97316" fillOpacity={1} fill="url(#colorSales)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
