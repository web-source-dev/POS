"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowDownToLine, ArrowUpDown, Box, Plus, Search, Trash2, AlertCircle, Edit, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { AddItemDialog } from "@/components/inventory/add-item-dialog"
import { UpdateItemDialog } from "@/components/inventory/update-item-dialog"
import { UpdateStockDialog } from "@/components/inventory/update-stock-dialog"
import { useToast } from "@/hooks/use-toast"
import { inventoryService } from "@/lib/inventory-service"
import { useAuth } from "@/lib/auth"

interface InventoryItem {
  _id: string
  name: string
  sku: string
  category: string
  stock: number
  price: number
  status: string
  description: string
  reorderLevel: number
}


export function InventoryPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [statistics, setStatistics] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0
  })
  const [categories, setCategories] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false)
  const [updateItemDialogOpen, setUpdateItemDialogOpen] = useState(false)
  const [updateStockDialogOpen, setUpdateStockDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)

  // Load inventory data
  const loadInventoryData = useCallback(async () => {
    setLoading(true)
    try {
      const filters = {
        search: searchTerm,
        category: categoryFilter,
        status: statusFilter
      }
      
      const items = await inventoryService.getItems(filters)
      setInventoryItems(items as InventoryItem[])
      
      // Load stats
      const stats = await inventoryService.getStats()
      setStatistics(stats as { totalItems: number; lowStockItems: number; outOfStockItems: number; totalValue: number })
      
      // Load categories
      const categoriesList = await inventoryService.getCategories()
      setCategories(categoriesList as string[])
    } catch (error) {
      console.error("Failed to load inventory data:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, categoryFilter, statusFilter, toast])

  // Initial data load
  useEffect(() => {
    if (user) {
      loadInventoryData()
    }
  }, [user, loadInventoryData])

  // Refresh data when filters change
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        loadInventoryData()
      }, 500) // Debounce search
      
      return () => clearTimeout(timer)
    }
  }, [searchTerm, categoryFilter, statusFilter, user, loadInventoryData])

  const handleAddItem = () => {
    loadInventoryData()
  }

  const handleUpdateItem = () => {
    loadInventoryData()
  }

  const handleUpdateStock = () => {
    loadInventoryData()
  }

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setUpdateItemDialogOpen(true)
  }

  const handleEditStock = (item: InventoryItem) => {
    setSelectedItem(item)
    setUpdateStockDialogOpen(true)
  }

  const handleExport = () => {
    // Create CSV content
    const headers = ["Name", "SKU", "Category", "Stock", "Price", "Status"]
    const csvRows = [headers]
    
    inventoryItems.forEach(item => {
      csvRows.push([
        item.name,
        item.sku,
        item.category,
        item.stock.toString(),
        item.price.toFixed(2),
        item.status
      ])
    })
    
    const csvContent = csvRows.map(row => row.join(",")).join("\n")
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "inventory_export.csv")
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Export Complete",
      description: "Your inventory data has been exported to CSV.",
    })
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return
    
    try {
      await inventoryService.deleteItem(itemToDelete._id)
      
      toast({
        title: "Item Deleted",
        description: `${itemToDelete.name} has been removed from inventory.`,
      })
      
      // Refresh data
      loadInventoryData()
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive"
      })
    } finally {
      setItemToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const confirmDelete = (item: InventoryItem) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const lowStockItems = inventoryItems.filter((item) => item.status === "Low Stock")
  const outOfStockItems = inventoryItems.filter((item) => item.status === "Out of Stock")

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setAddItemDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all-items" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all-items">All Items</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock ({statistics.lowStockItems})</TabsTrigger>
            <TabsTrigger value="out-of-stock">Out of Stock ({statistics.outOfStockItems})</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={loadInventoryData}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or SKU..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Category filter */}
          {categories.length > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-sm">Category:</span>
              <select
                className="h-9 rounded-md border border-input px-3 py-1 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Status filter */}
          <div className="flex gap-2 items-center">
            <span className="text-sm">Status:</span>
            <select
              className="h-9 rounded-md border border-input px-3 py-1 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <TabsContent value="all-items">
          <Card>
            <CardHeader className="p-4">
              <CardTitle>All Inventory Items</CardTitle>
              <CardDescription>Manage your inventory items, stock levels, and pricing</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="h-72 flex items-center justify-center">
                  <p>Loading inventory data...</p>
                </div>
              ) : inventoryItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">
                        <div className="flex items-center space-x-1">
                          <span>Item Name</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">{item.stock}</TableCell>
                        <TableCell className="text-right">PKR {item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              item.status === "In Stock"
                                ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-500 dark:hover:bg-green-900/30"
                                : item.status === "Low Stock"
                                  ? "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-500 dark:hover:bg-amber-900/30"
                                  : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-500 dark:hover:bg-red-900/30"
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditStock(item)} title="Update Stock">
                              <Package className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)} title="Edit Item">
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => confirmDelete(item)} title="Delete Item">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="h-72 flex items-center justify-center border-t">
                  <div className="flex flex-col items-center text-center p-8">
                    <Box className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Inventory Items</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {searchTerm || categoryFilter || statusFilter
                        ? "No items match your current filters. Try adjusting your search or filter criteria."
                        : "Your inventory is empty. Click the 'Add Item' button to add your first inventory item."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Items that need to be reordered soon</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-72 flex items-center justify-center">
                  <p>Loading inventory data...</p>
                </div>
              ) : lowStockItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Item Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Reorder Level</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">{item.stock}</TableCell>
                        <TableCell className="text-right">{item.reorderLevel}</TableCell>
                        <TableCell className="text-right">PKR {item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditStock(item)} title="Update Stock">
                              <Package className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)} title="Edit Item">
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => confirmDelete(item)} title="Delete Item">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="h-[450px] flex items-center justify-center border rounded-md">
                  <div className="flex flex-col items-center text-center p-8">
                    <Box className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Low Stock Items</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      All items have sufficient stock levels. No items need to be reordered at this time.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="out-of-stock">
          <Card>
            <CardHeader>
              <CardTitle>Out of Stock Items</CardTitle>
              <CardDescription>Items that need immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-72 flex items-center justify-center">
                  <p>Loading inventory data...</p>
                </div>
              ) : outOfStockItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Item Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outOfStockItems.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">PKR {item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditStock(item)} title="Update Stock">
                              <Package className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)} title="Edit Item">
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => confirmDelete(item)} title="Delete Item">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="h-[450px] flex items-center justify-center border rounded-md">
                  <div className="flex flex-col items-center text-center p-8">
                    <Box className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Out of Stock Items</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      All items are currently in stock. No immediate orders are needed.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Manage inventory categories</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-72 flex items-center justify-center">
                  <p>Loading category data...</p>
                </div>
              ) : categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => {
                    const count = inventoryItems.filter((item) => item.category === category).length
                    return (
                      <Card key={category}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{count}</p>
                          <p className="text-sm text-muted-foreground">items in inventory</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="h-[450px] flex items-center justify-center border rounded-md">
                  <div className="flex flex-col items-center text-center p-8">
                    <Box className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Categories</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Add inventory items with categories to see them listed here.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddItemDialog 
        open={addItemDialogOpen} 
        onOpenChange={setAddItemDialogOpen} 
        onItemAdded={handleAddItem} 
      />

      <UpdateItemDialog
        open={updateItemDialogOpen}
        onOpenChange={setUpdateItemDialogOpen}
        onItemUpdated={handleUpdateItem}
        item={selectedItem}
      />

      <UpdateStockDialog
        open={updateStockDialogOpen}
        onOpenChange={setUpdateStockDialogOpen}
        onStockUpdated={handleUpdateStock}
        item={selectedItem}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item
              {itemToDelete && <span className="font-medium"> &quot;{itemToDelete.name}&quot;</span>} from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
