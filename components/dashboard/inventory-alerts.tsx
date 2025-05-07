import { useState, useEffect } from "react"
import { AlertTriangle, ArrowDownToLine, Ban } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import dashboardService from "@/services/dashboardService"

interface InventoryItem {
  _id: string
  name: string
  sku: string
  stock: number
  reorderLevel: number
  status: string
}

export function InventoryAlerts() {
  const [alerts, setAlerts] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInventoryAlerts = async () => {
      try {
        setLoading(true)
        const data = await dashboardService.getInventoryAlerts()
        setAlerts(data as InventoryItem[])
      } catch (error) {
        console.error("Error fetching inventory alerts:", error)
        setAlerts([])
      } finally {
        setLoading(false)
      }
    }

    fetchInventoryAlerts()
  }, [])

  if (loading) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">Loading inventory alerts...</p>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">No inventory alerts found.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map((alert) => (
          <TableRow key={alert._id}>
            <TableCell className="font-medium">
              <div>
                <p className="font-medium truncate max-w-[180px] md:max-w-[220px]">{alert.name}</p>
                <p className="text-xs text-muted-foreground">{alert.sku}</p>
              </div>
            </TableCell>
            <TableCell>
              {alert.status === "Low Stock" ? (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-500 dark:hover:bg-amber-900/30 flex items-center gap-1 w-fit"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Low Stock
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-500 dark:hover:bg-red-900/30 flex items-center gap-1 w-fit"
                >
                  <Ban className="h-3 w-3" />
                  Out of Stock
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <span
                className={
                  alert.status === "Out of Stock" ? "text-red-600 dark:text-red-500" : "text-amber-600 dark:text-amber-500"
                }
              >
                {alert.stock}
              </span>
              <span className="text-muted-foreground"> / {alert.reorderLevel}</span>
            </TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <ArrowDownToLine className="h-3.5 w-3.5" />
                Order
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
