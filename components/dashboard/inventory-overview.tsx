import { useState, useEffect } from "react"
import { Search, Box, Tag, AlertTriangle, Ban, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import dashboardService from "@/services/dashboardService"

interface InventoryItem {
  _id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  reorderLevel: number
  status: string
}

export function InventoryOverview() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0
  })

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setLoading(true)
        
        // Fetch all inventory items
        const items = await dashboardService.getAllInventory(selectedCategory, searchQuery)
        setInventoryItems(items as InventoryItem[])
        
        // Fetch inventory categories for filter
        const categoryList = await dashboardService.getInventoryCategories()
        setCategories(categoryList as string[])
        
        // Fetch inventory statistics
        const statsData = await dashboardService.getInventoryStats()
        setStats(statsData as { totalItems: number; lowStockItems: number; outOfStockItems: number; totalValue: number })
        
      } catch (error) {
        console.error("Error fetching inventory data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInventoryData()
  }, [selectedCategory, searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is already triggered by the useEffect that depends on searchQuery
  }

  const handleCategoryChange = (value: string) => {
    // Convert "all" value back to empty string for the API call
    setSelectedCategory(value === "all" ? "" : value)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Calculate total value of displayed inventory
  const displayedInventoryValue = inventoryItems.reduce(
    (total, item) => total + item.price * item.stock, 
    0
  )

  // Return loading state if data is not yet available
  if (loading && inventoryItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-[450px]">
        <p className="text-muted-foreground">Loading inventory data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Inventory Overview</h2>
          <p className="text-muted-foreground">Manage your stock levels and product information</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Products in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Below reorder level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outOfStockItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Need immediate ordering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Current inventory value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            {selectedCategory ? `Category: ${selectedCategory}` : "All products"}
            {searchQuery ? ` | Search: "${searchQuery}"` : ""}
          </CardDescription>
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0 pt-4">
            <form onSubmit={handleSearch} className="flex-1 md:max-w-sm">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </form>
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategory === "" ? "all" : selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inventoryItems.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            <Tag className="mr-1 h-3 w-3" />
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell>PKR {item.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={
                            item.status === "Out of Stock" 
                              ? "text-red-600 dark:text-red-500" 
                              : item.status === "Low Stock"
                                ? "text-amber-600 dark:text-amber-500"
                                : ""
                          }>
                            {item.stock}
                          </span>
                          <span className="text-muted-foreground"> / {item.reorderLevel}</span>
                        </TableCell>
                        <TableCell>
                          {item.status === "Low Stock" ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-500 dark:hover:bg-amber-900/30 flex items-center gap-1 w-fit"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </Badge>
                          ) : item.status === "Out of Stock" ? (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-500 dark:hover:bg-red-900/30 flex items-center gap-1 w-fit"
                            >
                              <Ban className="h-3 w-3" />
                              Out of Stock
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-500 dark:hover:bg-green-900/30 flex items-center gap-1 w-fit"
                            >
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {inventoryItems.length} items
                </p>
                <p className="text-sm font-medium">
                  Displayed Value: PKR {displayedInventoryValue.toFixed(2)}
                </p>
              </div>
            </>
          ) : (
            <div className="py-24 text-center">
              <div className="flex justify-center mb-4">
                <Box className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No inventory items found</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                {searchQuery || selectedCategory
                  ? "Try adjusting your search or filter to find what you're looking for."
                  : "You don't have any inventory items yet. Add items to get started."}
              </p>
              {searchQuery || selectedCategory ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                  }}
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 