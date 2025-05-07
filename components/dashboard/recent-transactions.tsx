import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import dashboardService from "@/services/dashboardService"

interface Transaction {
  _id: string
  customerName: string
  date: string
  total: number
  items: unknown[]
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        setLoading(true)
        const data = await dashboardService.getRecentTransactions(5)
        setTransactions(data as Transaction[])
      } catch (error) {
        console.error("Error fetching recent transactions:", error)
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecentTransactions()
  }, [])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">Loading recent transactions...</p>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">No recent transactions found.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Items</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction._id}>
            <TableCell className="font-medium">{transaction._id.substring(0, 8).toUpperCase()}</TableCell>
            <TableCell>{transaction.customerName || "Guest Customer"}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{formatDate(transaction.date)}</TableCell>
            <TableCell className="text-right">{transaction.items.length}</TableCell>
            <TableCell className="text-right font-medium">PKR {transaction.total.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
