"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { ArrowUpDown, Box, Plus, Search, Trash2, AlertCircle, Edit, Package, FileDown, RefreshCw, DollarSign, TrendingUp, CheckCircle, Filter, XCircle, X, Eye, FileUp } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { UpdateStockDialog } from "@/components/inventory/update-stock-dialog"
import { useToast } from "@/hooks/use-toast"
import { inventoryService } from "@/lib/inventory-service"
import { useAuth } from "@/lib/auth"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import supplierService from "@/services/supplierService"

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
  subcategory?: string
  subcategory2?: string
  brand?: string
  vehicleName?: string
  supplier?: string | { _id: string, name: string }
  location?: string
  purchasePrice?: number
  unitOfMeasure?: string
  measureValue?: string
}


export function InventoryPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
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
  const [globalStatistics, setGlobalStatistics] = useState({
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
  const [vehicleNameFilter, setVehicleNameFilter] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [updateStockDialogOpen, setUpdateStockDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [brands, setBrands] = useState<string[]>([])
  const [suppliers, setSuppliers] = useState<{_id: string, name: string}[]>([])
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [subcategories2, setSubcategories2] = useState<string[]>([])
  const [vehicleNames, setVehicleNames] = useState<string[]>([])

  // Check if filters are applied
  const isFiltered = useMemo(() => {
    return Boolean(
      searchTerm || 
      categoryFilter || 
      subcategoryFilter || 
      subcategory2Filter || 
      statusFilter || 
      brandFilter ||
      vehicleNameFilter ||
      supplierFilter
    );
  }, [searchTerm, categoryFilter, subcategoryFilter, subcategory2Filter, statusFilter, brandFilter, vehicleNameFilter, supplierFilter]);

  // Load inventory data
  const loadInventoryData = useCallback(async () => {
    setLoading(true)
    try {
      // First load the global stats (all items, unfiltered)
      const stats = await inventoryService.getStats()
      setGlobalStatistics(stats as { totalItems: number; lowStockItems: number; outOfStockItems: number; totalValue: number; totalPurchaseValue: number; potentialProfit: number })
      
      // Then load filtered items based on current filters
      const filters = {
        search: searchTerm,
        category: categoryFilter,
        subcategory: subcategoryFilter, 
        subcategory2: subcategory2Filter,
        status: statusFilter,
        brand: brandFilter,
        vehicleName: vehicleNameFilter,
        supplier: supplierFilter
      }
      
      const items = await inventoryService.getItems(filters)
      setInventoryItems(items as InventoryItem[])
      
      // Calculate statistics from filtered items
      if (isFiltered) {
        const filteredItems = items as InventoryItem[];
        const filteredStats = {
          totalItems: filteredItems.length,
          lowStockItems: filteredItems.filter(item => item.status === "Low Stock").length,
          outOfStockItems: filteredItems.filter(item => item.status === "Out of Stock").length,
          totalValue: filteredItems.reduce((sum, item) => sum + (item.price * item.stock), 0),
          totalPurchaseValue: filteredItems.reduce((sum, item) => sum + ((item.purchasePrice || 0) * item.stock), 0),
          potentialProfit: filteredItems.reduce((sum, item) => sum + ((item.price - (item.purchasePrice || 0)) * item.stock), 0)
        }
        setStatistics(filteredStats);
      } else {
        // Use global stats when no filters are applied
        setStatistics(stats as { totalItems: number; lowStockItems: number; outOfStockItems: number; totalValue: number; totalPurchaseValue: number; potentialProfit: number });
      }
      
      // Load supporting data (categories)
      const categoriesList = await inventoryService.getCategories()
      setCategories(categoriesList as string[])
      
      // Note: We no longer fetch brands and suppliers here because they are now 
      // fetched in separate useEffect hooks that respect the selected filters
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
  }, [searchTerm, categoryFilter, subcategoryFilter, subcategory2Filter, statusFilter, brandFilter, vehicleNameFilter, supplierFilter, toast, isFiltered])

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

  // Load brands for the selected category
  useEffect(() => {
    if (user) {
      // This hook updates the brands list whenever the category or subcategory changes
      inventoryService.getBrands(categoryFilter || "", subcategoryFilter || "")
        .then(data => {
          const brandsData = data as string[];
          setBrands(brandsData);
          
          // Clear brand filter when category changes and brand is not valid for new category
          if (brandFilter && !brandsData.includes(brandFilter)) {
            setBrandFilter('');
          }
          
          // Log for debugging
          console.log(`Loaded ${brandsData.length} brands for category: ${categoryFilter || 'All'}, subcategory: ${subcategoryFilter || 'All'}`);
        })
        .catch(error => {
          console.error("Failed to load brands:", error);
        });
    }
  }, [categoryFilter, subcategoryFilter, brandFilter, user]);

  // Load vehicle names based on category, subcategory, and brand filters
  useEffect(() => {
    if (user) {
      // This hook updates the vehicle names list whenever any of the related filters change
      inventoryService.getVehicles(categoryFilter || "", subcategoryFilter || "", brandFilter || "")
        .then(data => {
          const vehicleNamesData = data as string[];
          setVehicleNames(vehicleNamesData);
          
          // Clear vehicle filter when filters change and vehicle name is not valid for new filters
          if (vehicleNameFilter && !vehicleNamesData.includes(vehicleNameFilter)) {
            setVehicleNameFilter('');
          }
          
          // Log for debugging
          console.log(`Loaded ${vehicleNamesData.length} vehicles for category: ${categoryFilter || 'All'}, brand: ${brandFilter || 'All'}`);
        })
        .catch(error => {
          console.error("Failed to load vehicle names:", error);
        });
    }
  }, [categoryFilter, subcategoryFilter, brandFilter, vehicleNameFilter, user]);

  // Load suppliers based on category, subcategory, and brand filters
  useEffect(() => {
    if (user) {
      // This hook updates the suppliers list whenever any of the related filters change
      inventoryService.getSuppliers(categoryFilter || "", subcategoryFilter || "", brandFilter || "")
        .then((data) => {
          const suppliersData = data as Array<{ _id: string; name: string; }>;
          setSuppliers(suppliersData);
          
          // Clear supplier filter when filters change and supplier is not valid for new filters
          if (supplierFilter) {
            const supplierExists = suppliersData.some((supplier) => supplier.name === supplierFilter);
            if (!supplierExists) {
              setSupplierFilter('');
            }
          }
          
          // Log for debugging
          console.log(`Loaded ${suppliersData.length} suppliers for category: ${categoryFilter || 'All'}, brand: ${brandFilter || 'All'}`);
        })
        .catch(error => {
          console.error("Failed to load suppliers:", error);
        });
    }
  }, [categoryFilter, subcategoryFilter, brandFilter, supplierFilter, user]);

  // Initial data load and filter change response (with debounce)
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        loadInventoryData()
      }, 500) // Debounce search
      
      return () => clearTimeout(timer)
    }
  }, [searchTerm, categoryFilter, subcategoryFilter, subcategory2Filter, statusFilter, brandFilter, vehicleNameFilter, supplierFilter, user, loadInventoryData])

  // Load suppliers when needed
  useEffect(() => {
    if (user) {
      // Use the proper supplier endpoint
      supplierService.getAllSuppliers()
        .then((suppliersData:   unknown) => {
          setSuppliers(suppliersData as Array<{ _id: string; name: string; }>);
        })
        .catch(error => {
          console.error("Failed to load suppliers:", error);
        });
    }
  }, [user]);

  // Verification that the filtering routes are working correctly
  useEffect(() => {
    if (user) {
      // Log when the component mounts
      console.log("Inventory page mounted - verifying filtering APIs");
      
      // Test the brands filter API
      if (categories.length > 0) {
        const testCategory = categories[0];
        inventoryService.getBrands(testCategory, "")
          .then(data => {
            console.log(`API test: Found ${(data as string[]).length} brands for category '${testCategory}'`);
          })
          .catch(error => {
            console.error("API test failed: Could not load filtered brands:", error);
          });
      }
    }
  }, [user, categories]); // Only run when categories list changes or user changes

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setSubcategoryFilter("");
    setSubcategory2Filter("");
    setStatusFilter("");
    setBrandFilter("");
    setVehicleNameFilter("");
    setSupplierFilter("");
  };

  // Add a helper function to count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (categoryFilter) count++;
    if (subcategoryFilter) count++;
    if (subcategory2Filter) count++;
    if (statusFilter) count++;
    if (brandFilter) count++;
    if (vehicleNameFilter) count++;
    if (supplierFilter) count++;
    return count;
  };

  const handleUpdateStock = () => {
    loadInventoryData()
  }

  const handleEditItem = (item: InventoryItem) => {
    router.push(`/inventory/edit/${item._id}`)
  }

  const handleEditStock = (item: InventoryItem) => {
    setSelectedItem(item)
    setUpdateStockDialogOpen(true)
  }

  const handleExport = () => {
    // Create CSV content
    const headers = ["Name", "SKU", "Category", "Subcategory", "Subcategory2", "Brand", "Vehicle Name", "Supplier", "Stock", "Price", "Purchase Price", "Status", "Location", "Reorder Level"]
    
    // Function to properly escape CSV values
    const escapeCSV = (value: string) => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      
      // If the value contains quotes, commas, or newlines, it needs to be escaped
      if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
        // Double up any quotes and wrap the whole thing in quotes
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
    
    // Create rows with properly escaped data
    const csvRows = [
      // Convert headers to proper CSV format
      headers.map(header => escapeCSV(header)).join(',')
    ];
    
    // Add each inventory item as a row
    inventoryItems.forEach(item => {
      const rowData = [
        escapeCSV(item.name),
        escapeCSV(item.sku),
        escapeCSV(item.category),
        escapeCSV(item.subcategory || ""),
        escapeCSV(item.subcategory2 || ""),
        escapeCSV(item.brand || ""),
        escapeCSV(item.vehicleName || ""),
        escapeCSV(getSupplierName(item.supplier)),
        escapeCSV(item.stock.toString()),
        escapeCSV(item.price.toFixed(2)),
        escapeCSV(item.purchasePrice ? item.purchasePrice.toFixed(2) : ""),
        escapeCSV(item.status),
        escapeCSV(item.location || ""),
        escapeCSV(item.reorderLevel.toString())
      ].join(',');
      
      csvRows.push(rowData);
    });
    
    // Join all rows with newlines to create the complete CSV content
    const csvContent = csvRows.join("\r\n");
    
    // Add UTF-8 BOM for better Excel compatibility
    const BOM = "\uFEFF";
    const csvContentWithBOM = BOM + csvContent;
    
    // Create blob and download
    const blob = new Blob([csvContentWithBOM], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: "Your inventory data has been exported to CSV.",
    });
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

  // Status badge styling
  const getStatusBadgeStyles = (status: string) => {
    switch(status) {
      case "In Stock":
        return "bg-green-100/80 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-500 dark:hover:bg-green-900/40 border-green-200 dark:border-green-800";
      case "Low Stock":
        return "bg-amber-100/80 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-500 dark:hover:bg-amber-900/40 border-amber-200 dark:border-amber-800";
      case "Out of Stock":
        return "bg-red-100/80 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-500 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800";
      default:
        return "";
    }
  };

  // Helper function to get supplier name
  const getSupplierName = (supplier: string | { _id: string, name: string } | undefined): string => {
    if (!supplier) return '';
    if (typeof supplier === 'string') return supplier;
    return supplier.name;
  };

  // Statistics dashboard component
  const StatisticsDashboard = () => (
    <div className="relative">
      {isFiltered && (
        <div className="flex items-center justify-between mb-2">
          <Badge 
            variant="outline" 
            className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 shadow-sm flex items-center gap-2"
          >
            <Filter className="h-3.5 w-3.5" />
            Showing filtered statistics
          </Badge>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-xs h-7 px-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-1.5"
          >
            <XCircle className="h-3.5 w-3.5" />
            Clear All Filters
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {/* First Row - 4 cards */}
        <Card className={`bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background transition-all duration-300 ${isFiltered ? 'shadow-md ring-1 ring-blue-100 dark:ring-blue-900/30' : 'shadow-sm'}`}>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-1">
              <p className="text-sm text-muted-foreground">Total Items</p>
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-bold transition-all duration-300">{statistics.totalItems}</h3>
                <div className="flex items-center gap-2">
                  {isFiltered && globalStatistics.totalItems > 0 && (
                    <span className="text-xs text-muted-foreground">
                      of {globalStatistics.totalItems}
                    </span>
                  )}
                  <Package className="h-5 w-5 text-blue-500 mb-1" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background transition-all duration-300 ${isFiltered ? 'shadow-md ring-1 ring-red-100 dark:ring-red-900/30' : 'shadow-sm'}`}>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-1">
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-bold transition-all duration-300">{statistics.outOfStockItems}</h3>
                <div className="flex items-center gap-2">
                  {isFiltered && globalStatistics.outOfStockItems > 0 && (
                    <span className="text-xs text-muted-foreground">
                      of {globalStatistics.outOfStockItems}
                    </span>
                  )}
                  <AlertCircle className="h-5 w-5 text-red-500 mb-1" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background transition-all duration-300 ${isFiltered ? 'shadow-md ring-1 ring-amber-100 dark:ring-amber-900/30' : 'shadow-sm'}`}>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-1">
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-bold transition-all duration-300">{statistics.lowStockItems}</h3>
                <div className="flex items-center gap-2">
                  {isFiltered && globalStatistics.lowStockItems > 0 && (
                    <span className="text-xs text-muted-foreground">
                      of {globalStatistics.lowStockItems}
                    </span>
                  )}
                  <AlertCircle className="h-5 w-5 text-amber-500 mb-1" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background transition-all duration-300 ${isFiltered ? 'shadow-md ring-1 ring-indigo-100 dark:ring-indigo-900/30' : 'shadow-sm'}`}>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-1">
              <p className="text-sm text-muted-foreground">Net Purchase</p>
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-bold transition-all duration-300">Rs {statistics.totalPurchaseValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
                <div className="flex items-center gap-2">
                  {isFiltered && globalStatistics.totalPurchaseValue > 0 && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      of Rs {globalStatistics.totalPurchaseValue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </span>
                  )}
                  <DollarSign className="h-5 w-5 text-indigo-500 mb-1" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Second Row - 4 additional cards */}
        <Card className={`bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background transition-all duration-300 ${isFiltered ? 'shadow-md ring-1 ring-green-100 dark:ring-green-900/30' : 'shadow-sm'}`}>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-1">
              <p className="text-sm text-muted-foreground">Net Sale</p>
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-bold transition-all duration-300">Rs {statistics.totalValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
                <div className="flex items-center gap-2">
                  {isFiltered && globalStatistics.totalValue > 0 && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      of Rs {globalStatistics.totalValue.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </span>
                  )}
                  <DollarSign className="h-5 w-5 text-green-500 mb-1" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background transition-all duration-300 ${isFiltered ? 'shadow-md ring-1 ring-purple-100 dark:ring-purple-900/30' : 'shadow-sm'}`}>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-1">
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-bold transition-all duration-300">Rs {statistics.potentialProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
                <div className="flex items-center gap-2">
                  {isFiltered && globalStatistics.potentialProfit > 0 && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      of Rs {globalStatistics.potentialProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </span>
                  )}
                  <TrendingUp className="h-5 w-5 text-purple-500 mb-1" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
  // Loading skeleton component
  const TableSkeleton = () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-4 py-2">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-10 w-1/5" />
      </div>
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 py-4">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-6 w-1/6" />
          <Skeleton className="h-6 w-1/5" />
          <Skeleton className="h-6 w-1/6" />
          <Skeleton className="h-6 w-1/8" />
          <Skeleton className="h-6 w-1/12" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.push('/inventory/bulk-upload')} className="shadow-sm transition-all hover:shadow">
            <FileUp className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={() => router.push('/inventory/add')} className="shadow-sm transition-all hover:shadow">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {!loading && <StatisticsDashboard />}

      <Tabs defaultValue="all-items" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <TabsList className="bg-muted/60 p-1 rounded-lg">
            <TabsTrigger value="all-items" className="rounded-md">All Items</TabsTrigger>
            <TabsTrigger value="low-stock" className="rounded-md">
              Low Stock
              <Badge variant="outline" className="ml-1 bg-amber-100/50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                {statistics.lowStockItems}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="out-of-stock" className="rounded-md">
              Out of Stock
              <Badge variant="outline" className="ml-1 bg-red-100/50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                {statistics.outOfStockItems}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-md">Categories</TabsTrigger>
            <TabsTrigger value="suppliers" className="rounded-md">Suppliers</TabsTrigger>
          </TabsList>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 shadow-sm hover:shadow transition-all">
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="outline" size="sm" onClick={loadInventoryData} className="gap-1.5 shadow-sm hover:shadow transition-all">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 flex-wrap bg-muted/40 p-3 rounded-lg">
          <div className="flex flex-1 gap-2 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, SKU, barcode..."
                className="pl-8 bg-background shadow-sm border-muted-foreground/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Add a clear filter button with visual indication of active filters */}
            {isFiltered && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="h-9 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30 dark:hover:bg-red-900/30 flex items-center gap-1.5 shadow-sm"
              >
                <X className="h-4 w-4" />
                Clear Filters
                <span className="ml-1 bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full px-1.5 py-0.5 text-xs font-semibold">
                  {getActiveFilterCount()}
                </span>
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 w-full md:w-auto">
            {/* Category filter */}
            {categories.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground mb-1 ml-1">Category</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
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
            
            {/* Subcategory filter - Only shown when category is selected */}
            {categoryFilter && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground mb-1 ml-1">Subcategory</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
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
                <span className="text-xs text-muted-foreground mt-1 ml-1">
                  Filtered by {categoryFilter}
                </span>
              </div>
            )}
            
            {/* Subcategory2 filter - Only shown when subcategory is selected */}
            {subcategoryFilter && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground mb-1 ml-1">Subcategory 2</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
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
                <span className="text-xs text-muted-foreground mt-1 ml-1">
                  Filtered by {subcategoryFilter}
                </span>
              </div>
            )}
            
            {/* Brand filter */}
            {brands.length > 0 ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground mb-1 ml-1">Brand</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
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
                {categoryFilter && (
                  <span className="text-xs text-muted-foreground mt-1 ml-1">
                    Filtered by {categoryFilter}
                    {subcategoryFilter && ` > ${subcategoryFilter}`}
                  </span>
                )}
              </div>
            ) : categoryFilter ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground mb-1 ml-1">Brand</label>
                <div className="h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground flex items-center justify-center">
                  No brands available for {categoryFilter}
                </div>
                <span className="text-xs text-muted-foreground mt-1 ml-1">
                  Try selecting a different category
                </span>
              </div>
            ) : null}
            
            {/* Vehicle Name filter */}
            {vehicleNames.length > 0 ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground mb-1 ml-1">Vehicle</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  value={vehicleNameFilter}
                  onChange={(e) => setVehicleNameFilter(e.target.value)}
                >
                  <option value="">All Vehicles</option>
                  {vehicleNames.map((vehicle) => (
                    <option key={vehicle} value={vehicle}>
                      {vehicle}
                    </option>
                  ))}
                </select>
                {(categoryFilter || brandFilter) && (
                  <span className="text-xs text-muted-foreground mt-1 ml-1">
                    Filtered by{' '}
                    {[
                      categoryFilter && `category: ${categoryFilter}`,
                      brandFilter && `brand: ${brandFilter}`
                    ].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            ) : (categoryFilter || brandFilter) ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground mb-1 ml-1">Vehicle</label>
                <div className="h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground flex items-center justify-center">
                  No vehicles available for selected filters
                </div>
                <span className="text-xs text-muted-foreground mt-1 ml-1">
                  Try adjusting your filters
                </span>
              </div>
            ) : null}
            
            {/* Supplier filter */}
            {suppliers.length > 0 ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground mb-1 ml-1">Supplier</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {categoryFilter && (
                  <span className="text-xs text-muted-foreground mt-1 ml-1">
                    Filtered by {categoryFilter}
                  </span>
                )}
              </div>
            ) : categoryFilter ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground mb-1 ml-1">Supplier</label>
                <div className="h-9 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground flex items-center justify-center">
                  No suppliers available for {categoryFilter}
                </div>
                <span className="text-xs text-muted-foreground mt-1 ml-1">
                  Try selecting a different category
                </span>
              </div>
            ) : null}
            
            {/* Status filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground mb-1 ml-1">Status</label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
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
        </div>

        <TabsContent value="all-items" className="p-0">
          <Card className="border shadow-sm">
            <CardHeader className="p-4 border-b bg-muted/30">
              <CardTitle>All Inventory Items</CardTitle>
              <CardDescription>Manage your inventory items, stock levels, and pricing</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4">
                  <TableSkeleton />
                </div>
              ) : inventoryItems.length > 0 ? (
                <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px]">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-[250px]">
                          <div className="flex items-center space-x-1">
                            <span>Item Name</span>
                            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                          </div>

                        </TableHead>
                        <TableHead>Vehicle</TableHead>
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
                        <TableRow key={item._id} className="group hover:bg-muted/50 transition-colors">
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
                            {item.vehicleName || '-'}
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
                          <TableCell>
                            {item.brand || '-'}
                            {item.vehicleName && (
                              <div className="text-xs text-muted-foreground">
                                Vehicle: {item.vehicleName}
                              </div>
                            )}
                            {item.supplier && (
                              <div className="text-xs text-muted-foreground">
                                Supplier: {getSupplierName(item.supplier)}
                              </div>
                            )}
                          </TableCell>
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
                              <span>Rs   {item.price.toFixed(2)}</span>
                              {item.purchasePrice && (
                                <span className="text-xs text-muted-foreground">
                                  Cost: Rs   {item.purchasePrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.purchasePrice ? (
                              <span className={`text-sm ${(item.price - item.purchasePrice) > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                {((item.price - item.purchasePrice) / item.price * 100).toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className={getStatusBadgeStyles(item.status)}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => router.push(`/inventory/view/${item._id}`)} 
                                title="View Details"
                                className="opacity-70 hover:opacity-100 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                              >
                                <Eye className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditStock(item)} 
                                title="Update Stock"
                                className="opacity-70 hover:opacity-100 hover:bg-green-100 dark:hover:bg-green-900/20"
                              >
                                <Package className="h-4 w-4 text-green-600 dark:text-green-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditItem(item)} 
                                title="Edit Item"
                                className="opacity-70 hover:opacity-100 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                              >
                                <Edit className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => confirmDelete(item)} 
                                title="Delete Item"
                                className="opacity-70 hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="h-72 flex items-center justify-center border-t">
                  <div className="flex flex-col items-center text-center p-8">
                    <div className="bg-muted/60 rounded-full p-3 mb-4">
                      <Box className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Inventory Items</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {searchTerm || categoryFilter || statusFilter
                        ? "No items match your current filters. Try adjusting your search or filter criteria."
                        : "Your inventory is empty. Click the 'Add Item' button to add your first inventory item."}
                    </p>
                    {!(searchTerm || categoryFilter || statusFilter) && (
                      <Button 
                        onClick={() => router.push('/inventory/add')} 
                        variant="outline" 
                        className="mt-4"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Item
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Items that need to be reordered soon</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4">
                  <TableSkeleton />
                </div>
              ) : lowStockItems.length > 0 ? (
                <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px]">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
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
                        <TableRow key={item._id} className="group hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-right font-medium text-amber-600 dark:text-amber-500">{item.stock}</TableCell>
                          <TableCell className="text-right">{item.reorderLevel}</TableCell>
                          <TableCell className="text-right">Rs   {item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditStock(item)} 
                                title="Update Stock"
                                className="opacity-70 hover:opacity-100 hover:bg-green-100 dark:hover:bg-green-900/20"
                              >
                                <Package className="h-4 w-4 text-green-600 dark:text-green-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditItem(item)} 
                                title="Edit Item"
                                className="opacity-70 hover:opacity-100 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                              >
                                <Edit className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => confirmDelete(item)} 
                                title="Delete Item"
                                className="opacity-70 hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="h-[450px] flex items-center justify-center border-t">
                  <div className="flex flex-col items-center text-center p-8">
                    <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-3 mb-4">
                      <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-500" />
                    </div>
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
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle>Out of Stock Items</CardTitle>
              <CardDescription>Items that need immediate attention</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4">
                  <TableSkeleton />
                </div>
              ) : outOfStockItems.length > 0 ? (
                <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px]">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
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
                        <TableRow key={item._id} className="group hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-right">Rs   {item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditStock(item)} 
                                title="Update Stock"
                                className="opacity-70 hover:opacity-100 hover:bg-green-100 dark:hover:bg-green-900/20"
                              >
                                <Package className="h-4 w-4 text-green-600 dark:text-green-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditItem(item)} 
                                title="Edit Item"
                                className="opacity-70 hover:opacity-100 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                              >
                                <Edit className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => confirmDelete(item)} 
                                title="Delete Item"
                                className="opacity-70 hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="h-[450px] flex items-center justify-center border-t">
                  <div className="flex flex-col items-center text-center p-8">
                    <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-3 mb-4">
                      <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-500" />
                    </div>
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
                    const supplierItems = inventoryItems.filter((item) => {
                      const supplierName = getSupplierName(item.supplier);
                      return supplierName === supplier.name;
                    });
                    const totalItems = supplierItems.length;
                    const totalValue = supplierItems.reduce((sum, item) => sum + (item.price * item.stock), 0);
                    
                    return (
                      <Card key={supplier._id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{supplier.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between">
                            <div>
                              <p className="text-2xl font-bold">{totalItems}</p>
                              <p className="text-sm text-muted-foreground">items</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">Rs   {totalValue.toFixed(2)}</p>
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

      <UpdateStockDialog
        open={updateStockDialogOpen}
        onOpenChange={setUpdateStockDialogOpen}
        onStockUpdated={handleUpdateStock}
        item={selectedItem}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item
              {itemToDelete && <span className="font-medium"> &quot;{itemToDelete.name}&quot;</span>} from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteItem} 
              className="bg-red-600 hover:bg-red-700 transition-colors focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
