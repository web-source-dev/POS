"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"
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
        console.log(response)
        
        // Validate response data structure
        if (!response || !response.chartData || !Array.isArray(response.chartData)) {
          console.error("Invalid category data format:", response)
          throw new Error("Invalid data format received from server")
        }
        
        // Validate each data point
        const validData = response.chartData.filter(item => 
          item && typeof item.name === 'string' && typeof item.value === 'number'
        )
        
        if (validData.length === 0) {
          throw new Error("No valid category data found")
        }
        
        setData(validData)
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
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          formatter={(value: number) => [`${value}`, "Value"]}
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
          }}
          itemStyle={{ color: "hsl(var(--foreground))" }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Bar dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
