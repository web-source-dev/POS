import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import dashboardService from "@/services/dashboardService"

interface TopSellingItem {
  _id: string
  name: string
  sku: string
  sold: number
  revenue: number
}

export function TopSellingItems() {
  const [topItems, setTopItems] = useState<TopSellingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopSellingItems = async () => {
      try {
        setLoading(true)
        const data = await dashboardService.getTopSellingItems('monthly', 5)
        setTopItems(data as TopSellingItem[])
      } catch (error) {
        console.error("Error fetching top selling items:", error)
        setTopItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchTopSellingItems()
  }, [])

  if (loading) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">Loading top selling items...</p>
      </div>
    )
  }

  if (topItems.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">No sales data available.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Sold</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {topItems.map((item) => (
          <TableRow key={item._id}>
            <TableCell>
              <div>
                <p className="font-medium truncate max-w-[180px] md:max-w-[220px]">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.sku}</p>
              </div>
            </TableCell>
            <TableCell className="text-right">{item.sold}</TableCell>
            <TableCell className="text-right font-medium">PKR {item.revenue.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
