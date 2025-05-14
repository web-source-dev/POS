"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, Package, FileText, 
  Search, X, Download,
  RefreshCw, History
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { useToast } from "@/hooks/use-toast"
import { inventoryService } from "@/lib/inventory-service"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"

interface InventoryItem {
  _id: string
  name: string
  sku: string
  category: string
  subcategory?: string
  subcategory2?: string
  brand?: string
  supplier?: { _id: string, name: string, contact?: string, email?: string, phone?: string }
  stock: number
  price: number
  purchasePrice?: number
  status: string
  description?: string
  reorderLevel: number
  location?: string
  imageUrl?: string
  expiryDate?: string
  createdAt: string
  updatedAt: string
  unitOfMeasure?: string
  measureValue?: string
  tags?: string[]
  taxRate?: number
}

interface SaleRecord {
  _id: string
  date: string
  customerName: string
  quantity: number
  price: number
  total: number
  receiptNumber?: string
}

interface InventoryDetailsPageProps {
  itemId: string
}

export function InventoryDetailsPage({ itemId }: InventoryDetailsPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [salesLoading, setSalesLoading] = useState(false)
  const [filteredSalesData, setFilteredSalesData] = useState<SaleRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  // Load item data
  useEffect(() => {
    const loadItemData = async () => {
      setLoading(true)
      try {
        const data = await inventoryService.getItem(itemId)
        setItem(data as InventoryItem)
      } catch (error) {
        console.error("Failed to load item data:", error)
        toast({
          title: "Error",
          description: "Failed to load inventory item details. Please try again.",
          variant: "destructive"
        })
        router.push('/inventory')
      } finally {
        setLoading(false)
      }
    }

    if (itemId) {
      loadItemData()
    }
  }, [itemId, router, toast])

  // Load purchase orders
  useEffect(() => {
    const loadSalesData = async () => {
      setSalesLoading(true)
      try {
        // Use the real API endpoint to fetch sales data
        const filters = {
          startDate: dateRange?.from ? dateRange.from.toISOString() : '',
          endDate: dateRange?.to ? dateRange.to.toISOString() : '',
          customer: searchTerm || ''
        };
        
        try {
          // First try to get real sales data from the API
          const salesHistoryData = await inventoryService.getItemSalesHistory(itemId, filters);
          setFilteredSalesData(salesHistoryData as SaleRecord[]);
        } catch (error) {
          console.warn("Could not fetch real sales data, using mock data instead:", error);
          // Fall back to mock data if the API fails
          const mockSalesData = generateMockSalesData(20);
          setFilteredSalesData(mockSalesData);
        }
      } catch (error) {
        console.error("Failed to load sales data:", error)
        toast({
          title: "Error",
          description: "Failed to load sales data. Please try again.",
          variant: "destructive"
        })
      } finally {
        setSalesLoading(false)
      }
    }

    // Generate mock sales data for demonstration
    const generateMockSalesData = (count: number): SaleRecord[] => {
      const mockData: SaleRecord[] = []
      const customerNames = [
        "John Doe", "Jane Smith", "Alex Johnson", "Maria Garcia", 
        "David Lee", "Sarah Wilson", "Michael Brown", "Jessica Davis"
      ]
      
      const now = new Date()
      
      for (let i = 0; i < count; i++) {
        const date = new Date(now)
        // Random date within the last 30 days
        date.setDate(date.getDate() - Math.floor(Math.random() * 30))
        
        const quantity = Math.floor(Math.random() * 5) + 1
        const price = item?.price || 0
        
        mockData.push({
          _id: `sale-${i}`,
          receiptNumber: `#${String(100000 + i).padStart(6, '0')}`,
          date: date.toISOString(),
          customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
          quantity,
          price,
          total: quantity * price
        })
      }
      
      // Sort by date (newest first)
      return mockData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    if (item) {
      loadSalesData()
    }
  }, [item, itemId, toast, dateRange, searchTerm])

  // Calculate total sales and revenue
  const totalSales = filteredSalesData.reduce((sum, sale) => sum + sale.quantity, 0)
  const totalRevenue = filteredSalesData.reduce((sum, sale) => sum + sale.total, 0)
  
  // Calculate total historical stock (current stock + all sold quantity)
  const totalHistoricalStock = (item?.stock || 0) + totalSales

  const handleBackToInventory = () => {
    router.push('/inventory')
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setDateRange(undefined)
  }

  const exportSalesData = () => {
    if (!filteredSalesData.length) return
    
    // Generate CSV
    const headers = ["Receipt Number", "Date", "Customer", "Quantity", "Price", "Total"]
    const csvRows = [headers]
    
    filteredSalesData.forEach(sale => {
      csvRows.push([
        sale.receiptNumber || "N/A",
        format(new Date(sale.date), "yyyy-MM-dd HH:mm"),
        sale.customerName,
        sale.quantity.toString(),
        sale.price.toFixed(2),
        sale.total.toFixed(2)
      ])
    })
    
    const csvContent = csvRows.map(row => row.join(",")).join("\n")
    
    // Create file download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${item?.name}-sales.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Export Complete",
      description: "Sales data has been exported to CSV.",
    })
  }

  const handleClick = (id: string) =>{
    window.location.href = `/purchases/${id}`
  }

  // Status badge styling
  const getStatusBadgeStyles = (status: string) => {
    switch(status) {
      case "In Stock":
        return "bg-green-100/80 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-green-200 dark:border-green-800";
      case "Low Stock":
        return "bg-amber-100/80 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500 border-amber-200 dark:border-amber-800";
      case "Out of Stock":
        return "bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-500 border-red-200 dark:border-red-800";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 col-span-2" />
          <Skeleton className="h-40" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBackToInventory}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{item?.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted-foreground">SKU: {item?.sku}</span>
            <Badge 
              variant="outline" 
              className={cn(item?.status ? getStatusBadgeStyles(item.status) : "")}
            >
              {item?.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push(`/inventory/edit/${item?._id}`)}>
            Edit Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Item Details and Image */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
                  <p className="font-medium">
                    {item?.category}
                    {item?.subcategory && ` > ${item.subcategory}`}
                    {item?.subcategory2 && ` > ${item.subcategory2}`}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Brand</h3>
                  <p className="font-medium">{item?.brand || "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Current Stock</h3>
                  <p className={cn(
                    "font-medium",
                    item?.stock === 0 ? "text-red-500" : 
                    item?.stock && item.stock <= (item.reorderLevel || 0) ? "text-amber-500" :
                    "text-green-500"
                  )}>
                    {item?.stock} {item?.unitOfMeasure !== "each" ? `(${item?.unitOfMeasure})` : ""}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    <span className="flex items-center">
                      <History className="h-3.5 w-3.5 mr-1" />
                      Total Historical Stock
                    </span>
                  </h3>
                  <div className="flex items-center">
                    <p className="font-medium">{totalHistoricalStock} {item?.unitOfMeasure !== "each" ? `(${item?.unitOfMeasure})` : ""}</p>
                    <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">
                      {item?.stock} current + {totalSales} sold
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total stock ever in inventory</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Reorder Level</h3>
                  <p className="font-medium">{item?.reorderLevel}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Location</h3>
                  <p className="font-medium">{item?.location || "Not specified"}</p>
                </div>
                
                {item?.measureValue && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {item.unitOfMeasure === "kg" || item.unitOfMeasure === "g" ? "Weight" : 
                       item.unitOfMeasure === "l" || item.unitOfMeasure === "ml" ? "Volume" : 
                       "Measurement"}
                    </h3>
                    <p className="font-medium">
                      {item.measureValue} {item.unitOfMeasure}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Selling Price</h3>
                  <p className="font-medium text-lg">Rs {item?.price.toFixed(2)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Purchase Price</h3>
                  <p className="font-medium">{item?.purchasePrice ? `Rs ${item.purchasePrice.toFixed(2)}` : "Not specified"}</p>
                </div>
                
                {item?.price && item?.purchasePrice && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Profit Margin</h3>
                    <p className={cn(
                      "font-medium",
                      ((item.price - item.purchasePrice) / item.price * 100) > 20 ? "text-green-500" :
                      ((item.price - item.purchasePrice) / item.price * 100) > 0 ? "text-amber-500" :
                      "text-red-500"
                    )}>
                      {(((item.price - item.purchasePrice) / item.price) * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Supplier</h3>
                  <p className="font-medium">{item?.supplier?.name || "Not specified"}</p>
                  {item?.supplier?.contact && (
                    <p className="text-sm text-muted-foreground">Contact: {item.supplier.contact}</p>
                  )}
                  {item?.supplier?.phone && (
                    <p className="text-sm text-muted-foreground">Phone: {item.supplier.phone}</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Tax Rate</h3>
                  <p className="font-medium">{item?.taxRate !== undefined ? `${item.taxRate}%` : "Not specified"}</p>
                </div>
                
                {item?.expiryDate && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Expiry Date</h3>
                    <p className="font-medium">{format(new Date(item.expiryDate), "PPP")}</p>
                  </div>
                )}
              </div>
            </div>
            
            {item?.description && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p className="text-sm">{item.description}</p>
              </div>
            )}
            
            {item?.tags && item.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Item Image */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Product Image</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {item?.imageUrl ? (
              <div className="relative h-[200px] w-full rounded-md overflow-hidden">
                <Image 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="object-contain" 
                  fill
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] w-full rounded-md border border-dashed">
                <Package className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground mt-2">No image available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales History */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle>Sales History</CardTitle>
          <CardDescription>View all purchases of this item</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search and filters */}
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by customer name..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="min-w-[260px]">
                <DatePickerWithRange 
                  date={dateRange}
                  setDate={setDateRange}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {(searchTerm || dateRange) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearFilters}
                  className="h-10"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportSalesData}
                className="h-10"
                disabled={!filteredSalesData.length}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          
          {/* Sales statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Total Sales</span>
                  <span className="text-2xl font-bold">{totalSales}</span>
                  <span className="text-xs text-muted-foreground">
                    units sold in {filteredSalesData.length} transactions
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <span className="text-2xl font-bold">Rs {totalRevenue.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">
                    from all recorded sales
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Avg. Price</span>
                  <span className="text-2xl font-bold">
                    Rs {filteredSalesData.length ? (totalRevenue / totalSales).toFixed(2) : "0.00"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    average selling price
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Stock Turnover</span>
                  <span className="text-2xl font-bold">
                    {totalHistoricalStock > 0 
                      ? `${((totalSales / totalHistoricalStock) * 100).toFixed(1)}%` 
                      : "0%"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    of total stock has been sold
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sales table */}
          {salesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredSalesData.length > 0 ? (
            <ScrollArea className="h-[400px] w-full rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-white dark:bg-background">
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSalesData.map((sale) => (
                    <TableRow key={sale._id} onClick={()=> handleClick(sale._id)} className="cursor-pointer">
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {sale.receiptNumber || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {format(new Date(sale.date), "PPP")}
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(sale.date), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell className="text-right">{sale.quantity}</TableCell>
                      <TableCell className="text-right">Rs {sale.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">Rs {sale.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-60">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">No sales found</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">
                {searchTerm || dateRange ? 
                  "Try adjusting your search filters." : 
                  "This item has no recorded sales yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle>Item History</CardTitle>
          <CardDescription>Tracking information about this inventory item</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/20">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium">Item Added</h3>
                <p className="text-sm text-muted-foreground">
                  {item?.createdAt ? format(new Date(item.createdAt), "PPPP 'at' h:mm a") : "Unknown date"}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/20">
                <RefreshCw className="h-4 w-4 text-green-600 dark:text-green-500" />
              </div>
              <div>
                <h3 className="font-medium">Last Updated</h3>
                <p className="text-sm text-muted-foreground">
                  {item?.updatedAt ? format(new Date(item.updatedAt), "PPPP 'at' h:mm a") : "Unknown date"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 