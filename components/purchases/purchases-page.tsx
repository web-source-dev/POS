"use client"

import { useEffect, useState, useRef } from "react"
import { ArrowUpDown, Calendar, Download, Eye, Filter, Search, X } from "lucide-react"
import { format, subDays, isAfter, isBefore } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"

import purchaseService from "@/services/purchaseService"
import { withAuthProtection } from "@/lib/protected-route"
import { SelectRangeEventHandler } from "react-day-picker"

// Add interfaces for type safety
interface PurchaseOrder {
  _id: string
  items: Array<{
    itemId: string
    name: string
    sku: string
    quantity: number
    price: number
  }>
  subtotal: number
  discount: number
  total: number
  customerName: string
  date: string
}

// Component for purchase orders
function PurchasesPageContent() {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseOrder | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [showDateFilter, setShowDateFilter] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Load purchase orders
  useEffect(() => {
    async function loadPurchases() {
      try {
        setLoading(true)
        const filters: Record<string, string> = {}
        
        if (dateRange.from) {
          filters.startDate = dateRange.from.toISOString()
        }
        if (dateRange.to) {
          filters.endDate = dateRange.to.toISOString()
        }
        
        const data = await purchaseService.getAllPurchases(filters)
        setPurchases(data)
      } catch (error) {
        console.error("Error loading purchases:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load purchase orders. Please try again."
        })
      } finally {
        setLoading(false)
      }
    }

    loadPurchases()
  }, [dateRange])

  // Handle view purchase details
  const handleViewPurchase = async (purchaseId: string) => {
    try {
      const purchaseDetails = await purchaseService.getPurchaseById(purchaseId)
      setSelectedPurchase(purchaseDetails as PurchaseOrder)
      setViewDialogOpen(true)
    } catch (error) {
      console.error("Error loading purchase details:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load purchase details. Please try again."
      })
    }
  }

  // Filter purchases by search term
  const filteredPurchases = purchases.filter(
    (purchase) =>
      purchase._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (purchase.customerName && purchase.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  // Clear date filters
  const clearDateFilter = () => {
    setDateRange({ from: undefined, to: undefined })
    setShowDateFilter(false)
  }

  // Handle export functionality
  const handleExport = () => {
    try {
      // Create CSV content
      const headers = ["Order ID", "Customer", "Date", "Items", "Total"]
      const rows = filteredPurchases.map(purchase => [
        purchase._id,
        purchase.customerName || "Anonymous",
        formatDate(purchase.date),
        purchase.items.length.toString(),
        purchase.total.toFixed(2)
      ])
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n")
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `purchase_orders_${format(new Date(), "yyyy-MM-dd")}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Export successful",
        description: "Your purchase orders have been exported as CSV."
      })
    } catch (error) {
      console.error("Error exporting purchases:", error)
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting your data. Please try again."
      })
    }
  }

  // Print receipt function
  const handlePrintReceipt = () => {
    if (!selectedPurchase) return
    
    try {
      const printContent = receiptRef.current?.innerHTML
      
      if (printContent) {
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
          throw new Error('Failed to open print window')
        }
        
        printWindow.document.write(`
          <html>
            <head>
              <title>Purchase Receipt</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .receipt { max-width: 800px; margin: 0 auto; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                th { font-weight: bold; }
                .text-right { text-align: right; }
                .header { margin-bottom: 20px; }
                .totals { margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="receipt">
                ${printContent}
              </div>
              <script>
                window.onload = function() { window.print(); window.close(); }
              </script>
            </body>
          </html>
        `)
        printWindow.document.close()
        
        toast({
          title: "Receipt prepared",
          description: "Receipt is ready to print."
        })
      }
    } catch (error) {
      console.error("Error printing receipt:", error)
      toast({
        variant: "destructive", 
        title: "Print failed",
        description: "Failed to prepare receipt for printing. Please try again."
      })
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
      </div>

      <Tabs defaultValue="all-orders" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all-orders">All Orders</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={`gap-1 ${dateRange.from ? 'bg-primary/20' : ''}`}>
                  <Calendar className="h-4 w-4" />
                  {dateRange.from ? 'Date Filter Active' : 'Date Range'}
                  {dateRange.from && (
                    <X
                      className="h-4 w-4 ml-1 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearDateFilter()
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange as SelectRangeEventHandler}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search orders..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <TabsContent value="all-orders">
          <Card>
            <CardHeader className="p-4">
              <CardTitle>All Purchase Orders</CardTitle>
              <CardDescription>Manage your purchase orders and track transactions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <p>Loading purchases...</p>
                </div>
              ) : filteredPurchases.length === 0 ? (
                <div className="flex flex-col justify-center items-center p-8">
                  <p>No purchase orders found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">
                        <div className="flex items-center space-x-1">
                          <span>Order #</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.map((purchase) => (
                      <TableRow key={purchase._id}>
                        <TableCell className="font-medium">{purchase._id.substring(0, 8)}</TableCell>
                        <TableCell>{purchase.customerName || "Anonymous"}</TableCell>
                        <TableCell>{formatDate(purchase.date)}</TableCell>
                        <TableCell className="text-right">{purchase.items.length}</TableCell>
                        <TableCell className="text-right font-medium">Rs {purchase.total.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleViewPurchase(purchase._id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Orders from the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <p>Loading recent purchases...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases
                      .filter((purchase) => {
                        const purchaseDate = new Date(purchase.date)
                        const oneWeekAgo = subDays(new Date(), 7)
                        return isAfter(purchaseDate, oneWeekAgo)
                      })
                      .map((purchase) => (
                        <TableRow key={purchase._id}>
                          <TableCell className="font-medium">{purchase._id.substring(0, 8)}</TableCell>
                          <TableCell>{purchase.customerName || "Anonymous"}</TableCell>
                          <TableCell>{formatDate(purchase.date)}</TableCell>
                          <TableCell className="text-right">{purchase.items.length}</TableCell>
                          <TableCell className="text-right font-medium">Rs {purchase.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => handleViewPurchase(purchase._id)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>Past purchase orders and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <p>Loading order history...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases
                      .filter((purchase) => {
                        const purchaseDate = new Date(purchase.date)
                        const oneWeekAgo = subDays(new Date(), 7)
                        return isBefore(purchaseDate, oneWeekAgo)
                      })
                      .map((purchase) => (
                        <TableRow key={purchase._id}>
                          <TableCell className="font-medium">{purchase._id.substring(0, 8)}</TableCell>
                          <TableCell>{purchase.customerName || "Anonymous"}</TableCell>
                          <TableCell>{formatDate(purchase.date)}</TableCell>
                          <TableCell className="text-right">{purchase.items.length}</TableCell>
                          <TableCell className="text-right font-medium">Rs {purchase.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => handleViewPurchase(purchase._id)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Purchase Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedPurchase?._id.substring(0, 8)} - {formatDate(selectedPurchase?.date || '')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPurchase && (
            <div className="space-y-4">
              <div ref={receiptRef}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm">Customer:</h4>
                    <p>{selectedPurchase.customerName || "Anonymous"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Order Date:</h4>
                    <p>{formatDate(selectedPurchase.date)}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 mt-4">Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPurchase.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">Rs {item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">Rs {(item.price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-between items-center border-t pt-4 mt-4">
                  <div>
                    <h4 className="font-medium">Payment Status</h4>
                    <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-500 dark:hover:bg-green-900/30">
                      Paid
                    </Badge>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium mr-8">Subtotal:</span>
                      <span>Rs {selectedPurchase.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium mr-8">Discount:</span>
                      <span>Rs {selectedPurchase.discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span className="mr-8">Total:</span>
                      <span>Rs {selectedPurchase.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={handlePrintReceipt}>
                  <Download className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Export the protected component
export const PurchasesPage = withAuthProtection(PurchasesPageContent)
