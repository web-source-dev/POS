"use client"

import { useEffect, useState } from "react"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "@/components/ui/chart"
import reportService from "@/services/reportService"

interface CategoryData {
  name: string
  value: number
}

interface CategoryResponse {
  chartData: CategoryData[]
}

// Vibrant colors that work well together
const COLORS = ["#f97316", "#84cc16", "#06b6d4", "#8b5cf6", "#ec4899", "#94a3b8"]

export function TopCategoriesChart({ timeframe = "monthly" }: { timeframe?: string }) {
  const [data, setData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await reportService.getCategorySales(timeframe) as CategoryResponse
        setData(response.chartData)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch category data:", err)
        setError("Failed to load category data")
        // Provide fallback data for development
        setData([
          { name: "No Data", value: 100 }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeframe])

  if (loading) {
    return <div className="flex items-center justify-center h-[300px]">Loading category data...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-[300px]">{error}</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value}%`, "Percentage"]}
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
          }}
          itemStyle={{ color: "hsl(var(--foreground))" }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
