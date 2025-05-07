"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"
import reportService from "@/services/reportService"

interface SalesChartData {
  name: string
  sales: number
  profit: number
}

interface SalesReportResponse {
  chartData: SalesChartData[]
  summary: {
    totalSales: number
    averageSale: number
    totalTransactions: number
    profitMargin: number
  }
}

export function SalesReportChart({ timeframe = "daily" }: { timeframe?: string }) {
  const [data, setData] = useState<SalesChartData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await reportService.getSalesReport(timeframe) as SalesReportResponse
        setData(response.chartData)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch sales report data:", err)
        setError("Failed to load sales data")
        // Provide fallback data for development
        setData([
          { name: "No Data", sales: 0, profit: 0 }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeframe])

  if (loading) {
    return <div className="flex items-center justify-center h-[350px]">Loading sales data...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-[350px]">{error}</div>
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `PKR ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <Tooltip
          formatter={(value: number, name: string) => [`PKR ${value}`, name === "sales" ? "Sales" : "Profit"]}
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
          }}
          itemStyle={{ color: "hsl(var(--foreground))" }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Legend />
        <Bar dataKey="sales" fill="#f97316" radius={[4, 4, 0, 0]} name="Sales" />
        <Bar dataKey="profit" fill="#84cc16" radius={[4, 4, 0, 0]} name="Profit" />
      </BarChart>
    </ResponsiveContainer>
  )
}
