"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"
import reportService from "@/services/reportService"

interface InventoryValueData {
  name: string
  value: number
}

interface InventoryValueResponse {
  chartData: InventoryValueData[]
}

export function InventoryValueChart() {
  const [data, setData] = useState<InventoryValueData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await reportService.getInventoryValueTrend() as InventoryValueResponse
        
        // Validate response data structure
        if (!response || !response.chartData || !Array.isArray(response.chartData)) {
          console.error("Invalid inventory value data format:", response)
          throw new Error("Invalid data format received from server")
        }
        
        // Validate each data point
        const validData = response.chartData.filter(item => 
          item && typeof item.name === 'string' && typeof item.value === 'number'
        )
        
        if (validData.length === 0) {
          throw new Error("No valid inventory data found")
        }
        
        setData(validData)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch inventory value data:", err)
        setError("Failed to load inventory value data")
        // Provide fallback data for development
        setData([
          { name: "No Data", value: 0 }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-[350px]">Loading inventory data...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-[350px]">{error}</div>
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `PKR ${value / 1000}k`}
        />
        <Tooltip
          formatter={(value: number) => [`PKR ${value.toLocaleString()}`, "Inventory Value"]}
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
          }}
          itemStyle={{ color: "hsl(var(--foreground))" }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#22c55e"
          fillOpacity={1}
          fill="url(#colorValue)"
          name="Inventory Value"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
