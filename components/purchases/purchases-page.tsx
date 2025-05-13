"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowUpDown, Calendar as CalendarIcon, Download, Eye, Search, X, AlertTriangle, RefreshCw, DollarSign 
} from "lucide-react"
import { format, subDays, isAfter, isBefore, differenceInDays } from "date-fns"
import { DateRange } from "react-day-picker"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

import purchaseService from "@/services/purchaseService"
import { withAuthProtection } from "@/lib/protected-route"

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
  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  })
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [sortBy, setSortBy] = useState<string>("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [activeTab, setActiveTab] = useState("all-orders")
  const [minAmount, setMinAmount] = useState<string>("")
  const [maxAmount, setMaxAmount] = useState<string>("")
  const [priceFilterOpen, setPriceFilterOpen] = useState(false)
  const [statsSummary, setStatsSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    recentOrders: 0,
  })
  
  const router = useRouter()
  const { toast } = useToast()

  // Calculate stats when purchases change
  useEffect(() => {
    if (purchases.length > 0) {
      const oneWeekAgo = subDays(new Date(), 7)
      const recentOrders = purchases.filter(p => isAfter(new Date(p.date), oneWeekAgo)).length
      const totalRevenue = purchases.reduce((sum, p) => sum + p.total, 0)
      
      setStatsSummary({
        totalOrders: purchases.length,
        totalRevenue,
        averageOrderValue: totalRevenue / purchases.length,
        recentOrders
      })
    }
  }, [purchases])

  // Load purchases function - wrapped in useCallback
  const loadPurchases = useCallback(async () => {
    try {
      setLoading(true)
      const filters: Record<string, string> = {}
      
      if (dateRange?.from) {
        filters.startDate = dateRange.from.toISOString()
      }
      if (dateRange?.to) {
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
      setRefreshing(false)
    }
  }, [dateRange, toast])
  
  // Apply all filters and sorting - wrapped in useCallback
  const applyFilters = useCallback(() => {
    let result = [...purchases]
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(purchase => 
        purchase._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (purchase.customerName && purchase.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    // Apply price range filter
    if (minAmount && !isNaN(Number(minAmount))) {
      result = result.filter(purchase => purchase.total >= Number(minAmount))
    }
    
    if (maxAmount && !isNaN(Number(maxAmount))) {
      result = result.filter(purchase => purchase.total <= Number(maxAmount))
    }
    
    // Apply tab filters
    if (activeTab === "recent") {
      const oneWeekAgo = subDays(new Date(), 7)
      result = result.filter(purchase => isAfter(new Date(purchase.date), oneWeekAgo))
    } else if (activeTab === "history") {
      const oneWeekAgo = subDays(new Date(), 7)
      result = result.filter(purchase => isBefore(new Date(purchase.date), oneWeekAgo))
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "total":
          comparison = a.total - b.total
          break
        case "items":
          comparison = a.items.length - b.items.length
          break
        case "customer":
          comparison = (a.customerName || "").localeCompare(b.customerName || "")
          break
        default:
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      }
      
      return sortOrder === "asc" ? comparison : -comparison
    })
    
    setFilteredPurchases(result)
  }, [purchases, searchTerm, minAmount, maxAmount, sortBy, sortOrder, activeTab])
  
  // Load purchase orders
  useEffect(() => {
    loadPurchases()
  }, [loadPurchases])
  
  // Apply filters when search or purchases change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])
  
  // Refresh purchases
  const handleRefresh = () => {
    setRefreshing(true)
    loadPurchases()
  }

  // Toggle sort order
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  // Handle view purchase details
  const handleViewPurchase = (purchaseId: string) => {
    router.push(`/purchases/${purchaseId}`)
  }

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
  
  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("")
    setDateRange({ from: undefined, to: undefined })
    setMinAmount("")
    setMaxAmount("")
    setSortBy("date")
    setSortOrder("desc")
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

  // Get the status badge for time since order
  const getTimeBadge = (dateString: string) => {
    const orderDate = new Date(dateString)
    const today = new Date()
    const daysDiff = differenceInDays(today, orderDate)
    
    if (daysDiff === 0) {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Today</Badge>
    } else if (daysDiff === 1) {
      return <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">Yesterday</Badge>
    } else if (daysDiff <= 7) {
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">This Week</Badge>
    } else if (daysDiff <= 30) {
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">This Month</Badge>
    } else {
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">Older</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
          <p className="text-muted-foreground">View and manage your sales transactions</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAllFilters}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            className="gap-1"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsSummary.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statsSummary.recentOrders} in the last 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs {statsSummary.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From all purchase orders
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs {statsSummary.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per transaction
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsSummary.recentOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In the last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-orders" className="space-y-4" onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="all-orders">All Orders</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-2">
            <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={`gap-1 ${dateRange.from ? 'bg-primary/20' : ''}`}>
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'LLL dd, y') : 'Start'} - {dateRange.to ? format(dateRange.to, 'LLL dd, y') : 'End'}
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
                <Calendar
                  initialFocus
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range) {
                      setDateRange(range)
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            
            <Popover open={priceFilterOpen} onOpenChange={setPriceFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`gap-1 ${minAmount || maxAmount ? 'bg-primary/20' : ''}`}
                >
                  <DollarSign className="h-4 w-4" />
                  Price Range
                  {(minAmount || maxAmount) && (
                    <X
                      className="h-4 w-4 ml-1 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMinAmount("")
                        setMaxAmount("")
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium">Filter by Price</h4>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-sm">Min Amount</p>
                      <Input
                        placeholder="0.00"
                        type="number"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <p className="text-sm">Max Amount</p>
                      <Input
                        placeholder="0.00"
                        type="number"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setMinAmount("")
                        setMaxAmount("")
                      }}
                    >
                      Reset
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setPriceFilterOpen(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value)}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="total">Sort by Amount</SelectItem>
                <SelectItem value="items">Sort by Items</SelectItem>
                <SelectItem value="customer">Sort by Customer</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="gap-1"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === "asc" ? "Ascending" : "Descending"}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search orders by ID or customer name..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="all-orders" className="m-0">
          <Card>
            <CardHeader className="p-4">
              <CardTitle>All Purchase Orders</CardTitle>
              <CardDescription>
                Showing {filteredPurchases.length} of {purchases.length} purchase orders
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : filteredPurchases.length === 0 ? (
                <div className="flex flex-col justify-center items-center p-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">No purchase orders found</h3>
                  <p className="text-muted-foreground mt-1 max-w-md">
                    Try changing your search terms or filters to find what you&apos;re looking for.
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={clearAllFilters}
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">
                        <div 
                          className="flex items-center space-x-1 cursor-pointer"
                          onClick={() => toggleSort("date")}
                        >
                          <span>Order #</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div 
                          className="flex items-center space-x-1 cursor-pointer"
                          onClick={() => toggleSort("customer")}
                        >
                          <span>Customer</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">
                        <div 
                          className="flex items-center justify-end space-x-1 cursor-pointer"
                          onClick={() => toggleSort("items")}
                        >
                          <span>Items</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div 
                          className="flex items-center justify-end space-x-1 cursor-pointer"
                          onClick={() => toggleSort("total")}
                        >
                          <span>Total</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.map((purchase) => {
                      const purchaseDate = new Date(purchase.date)
                      return (
                        <TableRow key={purchase._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewPurchase(purchase._id)}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{purchase._id.substring(0, 8)}</span>
                              <span className="text-xs text-muted-foreground mt-1">
                                {getTimeBadge(purchase.date)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate">
                              {purchase.customerName || "Anonymous"}
                            </div>
                          </TableCell>
                          <TableCell>{format(purchaseDate, "MMM d, yyyy")}</TableCell>
                          <TableCell>{format(purchaseDate, "h:mm a")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span>{purchase.items.length}</span>
                              <span className="text-xs text-muted-foreground">
                                {purchase.items.reduce((sum, item) => sum + item.quantity, 0)} units
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">Rs {purchase.total.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewPurchase(purchase._id)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Orders from the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : filteredPurchases.length === 0 ? (
                <div className="flex flex-col justify-center items-center p-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">No recent orders found</h3>
                  <p className="text-muted-foreground mt-1">
                    There are no purchase orders within the last 7 days.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.map((purchase) => {
                      const purchaseDate = new Date(purchase.date)
                      return (
                        <TableRow key={purchase._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewPurchase(purchase._id)}>
                          <TableCell className="font-medium">{purchase._id.substring(0, 8)}</TableCell>
                          <TableCell>{purchase.customerName || "Anonymous"}</TableCell>
                          <TableCell>{format(purchaseDate, "MMM d, yyyy")}</TableCell>
                          <TableCell>{format(purchaseDate, "h:mm a")}</TableCell>
                          <TableCell className="text-right">{purchase.items.length}</TableCell>
                          <TableCell className="text-right font-medium">Rs {purchase.total.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewPurchase(purchase._id)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>Past purchase orders and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : filteredPurchases.length === 0 ? (
                <div className="flex flex-col justify-center items-center p-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">No history found</h3>
                  <p className="text-muted-foreground mt-1">
                    There are no purchase orders older than 7 days.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.map((purchase) => {
                      const purchaseDate = new Date(purchase.date)
                      return (
                        <TableRow key={purchase._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewPurchase(purchase._id)}>
                          <TableCell className="font-medium">{purchase._id.substring(0, 8)}</TableCell>
                          <TableCell>{purchase.customerName || "Anonymous"}</TableCell>
                          <TableCell>{format(purchaseDate, "MMM d, yyyy")}</TableCell>
                          <TableCell>{format(purchaseDate, "h:mm a")}</TableCell>
                          <TableCell className="text-right">{purchase.items.length}</TableCell>
                          <TableCell className="text-right font-medium">Rs {purchase.total.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewPurchase(purchase._id)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Export the protected component
export const PurchasesPage = withAuthProtection(PurchasesPageContent)
