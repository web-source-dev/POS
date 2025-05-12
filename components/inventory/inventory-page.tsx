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
  barcode?: string
  subcategory?: string
  subcategory2?: string
  brand?: string
  supplier?: string
  location?: string
  purchasePrice?: number
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
    totalValue: 0,
    totalPurchaseValue: 0,
    potentialProfit: 0
  })
  const [categories, setCategories] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState("")
  const [subcategoryFilter, setSubcategoryFilter] = useState("")
  const [subcategory2Filter, setSubcategory2Filter] = useState("")
  const [brandFilter, setBrandFilter] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false)
  const [updateItemDialogOpen, setUpdateItemDialogOpen] = useState(false)
  const [updateStockDialogOpen, setUpdateStockDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [brands, setBrands] = useState<string[]>([])
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [subcategories2, setSubcategories2] = useState<string[]>([])

  // Load inventory data
  const loadInventoryData = useCallback(async () => {
    setLoading(true)
    try {
      const filters = {
        search: searchTerm,
        category: categoryFilter,
        subcategory: subcategoryFilter, 
        subcategory2: subcategory2Filter,
        status: statusFilter,
        brand: brandFilter,
        supplier: supplierFilter
      }
      
      const items = await inventoryService.getItems(filters)
      setInventoryItems(items as InventoryItem[])
      
      // Load stats
      const stats = await inventoryService.getStats()
      setStatistics(stats as { totalItems: number; lowStockItems: number; outOfStockItems: number; totalValue: number; totalPurchaseValue: number; potentialProfit: number })
      
      // Load categories
      const categoriesList = await inventoryService.getCategories()
      setCategories(categoriesList as string[])
      
      // Load brands
      const brandsList = await inventoryService.getBrands()
      setBrands(brandsList as string[])
      
      // Load suppliers
      const suppliersList = await inventoryService.getSuppliers()
      setSuppliers(suppliersList as string[])
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
  }, [searchTerm, categoryFilter, subcategoryFilter, subcategory2Filter, statusFilter, brandFilter, supplierFilter, toast])

  // Load subcategories when category changes
  useEffect(() => {
    if (categoryFilter) {
      inventoryService.getSubcategories(categoryFilter)
        .then(data => {
          const subcategoriesData = data as string[];
          setSubcategories(subcategoriesData);
          // Clear subcategory filter when category changes
          if (subcategoryFilter && !subcategoriesData.includes(subcategoryFilter)) {
            setSubcategoryFilter('');
          }
        })
        .catch(error => {
          console.error("Failed to load subcategories:", error);
        });
    } else {
      setSubcategories([]);
      setSubcategoryFilter('');
    }
  }, [categoryFilter, subcategoryFilter]);

  // Load subcategory2 options when subcategory changes
  useEffect(() => {
    if (categoryFilter && subcategoryFilter) {
      inventoryService.getSubcategories2(categoryFilter, subcategoryFilter)
        .then(data => {
          const subcategories2Data = data as string[];
          setSubcategories2(subcategories2Data);
          // Clear subcategory2 filter when subcategory changes
          if (subcategory2Filter && !subcategories2Data.includes(subcategory2Filter)) {
            setSubcategory2Filter('');
          }
        })
        .catch(error => {
          console.error("Failed to load subcategory2 values:", error);
        });
    } else {
      setSubcategories2([]);
      setSubcategory2Filter('');
    }
  }, [categoryFilter, subcategoryFilter, subcategory2Filter]);

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
  }, [searchTerm, categoryFilter, subcategoryFilter, subcategory2Filter, statusFilter, user, loadInventoryData])

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
    const headers = ["Name", "SKU", "Barcode", "Category", "Subcategory", "Brand", "Supplier", "Stock", "Price", "Purchase Price", "Status", "Location", "Reorder Level"]
    const csvRows = [headers]
    
    inventoryItems.forEach(item => {
      csvRows.push([
        item.name,
        item.sku,
        item.barcode || "",
        item.category,
        item.subcategory ? item.subcategory : "",
        item.subcategory2 ? item.subcategory2 : "",
        item.brand || "",
        item.supplier || "",
        item.stock.toString(),
        item.price.toFixed(2),
        item.purchasePrice ? item.purchasePrice.toFixed(2) : "",
        item.status,
        item.location || "",
        item.reorderLevel.toString()
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
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
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

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, SKU, barcode..."
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
                className="h-9 rounded-md border border-input px-3 py-1 text-sm min-w-[150px]"
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
          
          {/* Subcategory filter */}
          {subcategories.length > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-sm">Subcategory 1:</span>
              <select
                className="h-9 rounded-md border border-input px-3 py-1 text-sm min-w-[150px]"
                value={subcategoryFilter}
                onChange={(e) => setSubcategoryFilter(e.target.value)}
                disabled={!categoryFilter}
              >
                <option value="">All Subcategories</option>
                {subcategories.map((subcat) => (
                  <option key={subcat} value={subcat}>
                    {subcat}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Subcategory2 filter */}
          {subcategories2.length > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-sm">Subcategory 2:</span>
              <select
                className="h-9 rounded-md border border-input px-3 py-1 text-sm min-w-[150px]"
                value={subcategory2Filter}
                onChange={(e) => setSubcategory2Filter(e.target.value)}
                disabled={!subcategoryFilter}
              >
                <option value="">All Subcategories</option>
                {subcategories2.map((subcat2) => (
                  <option key={subcat2} value={subcat2}>
                    {subcat2}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Brand filter */}
          {brands.length > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-sm">Brand:</span>
              <select
                className="h-9 rounded-md border border-input px-3 py-1 text-sm min-w-[150px]"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Supplier filter */}
          {suppliers.length > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-sm">Supplier:</span>
              <select
                className="h-9 rounded-md border border-input px-3 py-1 text-sm min-w-[150px]"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
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
                      <TableHead className="w-[250px]">
                        <div className="flex items-center space-x-1">
                          <span>Item Name</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>SKU/Barcode</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
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
                              <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{item.sku}</span>
                            {item.barcode && (
                              <span className="text-xs text-muted-foreground">
                                {item.barcode}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{item.category}</span>
                            {(item.subcategory || item.subcategory2) && (
                              <span className="text-xs text-muted-foreground">
                                {item.subcategory ? item.subcategory : ''}
                                {item.subcategory && item.subcategory2 ? ' > ' : ''}
                                {item.subcategory2 ? item.subcategory2 : ''}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.brand || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span>{item.stock}</span>
                            {item.location && (
                              <span className="text-xs text-muted-foreground">
                                {item.location}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span>Rs {item.price.toFixed(2)}</span>
                            {item.purchasePrice && (
                              <span className="text-xs text-muted-foreground">
                                Cost: Rs {item.purchasePrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.purchasePrice ? (
                            <span className={`text-sm ${(item.price - item.purchasePrice) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {((item.price - item.purchasePrice) / item.price * 100).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
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
                        <TableCell className="text-right">Rs {item.price.toFixed(2)}</TableCell>
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
                        <TableCell className="text-right">Rs {item.price.toFixed(2)}</TableCell>
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

        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>Suppliers</CardTitle>
              <CardDescription>Manage your inventory suppliers</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-72 flex items-center justify-center">
                  <p>Loading supplier data...</p>
                </div>
              ) : suppliers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suppliers.map((supplier) => {
                    const supplierItems = inventoryItems.filter((item) => item.supplier === supplier);
                    const totalItems = supplierItems.length;
                    const totalValue = supplierItems.reduce((sum, item) => sum + (item.price * item.stock), 0);
                    
                    return (
                      <Card key={supplier}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{supplier}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between">
                            <div>
                              <p className="text-2xl font-bold">{totalItems}</p>
                              <p className="text-sm text-muted-foreground">items</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">Rs {totalValue.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">total value</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="h-[450px] flex items-center justify-center border rounded-md">
                  <div className="flex flex-col items-center text-center p-8">
                    <Box className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Suppliers</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Add inventory items with supplier information to see them listed here.
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
