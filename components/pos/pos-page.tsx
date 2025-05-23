"use client"

import { useEffect, useState } from "react"
import {
  ArrowRight,
  Banknote,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import posService from "@/services/posService.js"
import settingsService from "@/services/settingsService.js"
import { ReceiptPrinter, ReceiptData } from "./receipt-printer"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Types
type InventoryItem = {
  _id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  status: string
  brand?: string
  vehicleName?: string
  subcategory?: string
  purchasePrice?: number
}

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  sku?: string
}

type PrinterSettings = {
  model: string
  connectionType: string
  enabled: boolean
}

type BusinessSettings = {
  business: {
    name: string
    address: string
    phone: string
    email: string
    website: string
    taxId: string
  }
  pos: {
    receiptHeader: string
    receiptFooter: string
    logo: string
  }
  hardware: {
    printer: PrinterSettings
  }
}

type CompletedSale = {
  message: string
  saleDetails: {
    id: string
    receiptNumber: string
    items: CartItem[]
    total: number
    discount: number
    cashAmount: number
    change: number
    customerName: string
    date: string
    userId: string
  }
  inventoryUpdates: unknown[]
  cashDrawer: {
    previousBalance: number
    currentBalance: number
    saleAmount: number
  }
}

// Add this type definition for the inventory response
type InventoryResponse = {
  items: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export function POSPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("")
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<{id: number, name: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [customerName, setCustomerName] = useState("")
  const [discountAmount, setDiscountAmount] = useState("")
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  const [cart, setCart] = useState<CartItem[]>([])
  const [cashAmount, setCashAmount] = useState("")
  const [change, setChange] = useState<number | null>(null)

  // Receipt printing states
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [printingInProgress, setPrintingInProgress] = useState(false)
  const [currentSale, setCurrentSale] = useState<CompletedSale | null>(null)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  // Add state for active category
  const [activeCategory, setActiveCategory] = useState('all')

  // Debounce search term to prevent constant API calls while typing
  // This improves the search input user experience by avoiding focus loss
  useEffect(() => {
    // Use a debounce timer to delay the search application
    const debounceTimer = setTimeout(() => {
      setAppliedSearchTerm(searchTerm);
    }, 500); // 500ms debounce delay
    
    // Clean up the timer if the component unmounts or searchTerm changes again
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Load inventory and settings on component mount or filters change
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Load inventory items with current pagination and search params
        const inventoryResponse = await posService.getInventory({
          page: currentPage,
          limit: itemsPerPage,
          search: appliedSearchTerm || undefined,
          category: activeCategory !== 'all' ? activeCategory : undefined
        }) as InventoryResponse
        
        // Set inventory items directly from response
        setInventoryItems(inventoryResponse.items as InventoryItem[])
        
        // Update pagination based on response
        if (inventoryResponse.pagination) {
          setTotalPages(inventoryResponse.pagination.totalPages)
        }
        
        // If we need to load categories, only do it the first time
        if (categories.length === 0) {
          // Get all categories (separate API call to get all categories regardless of pagination)
          const allInventoryResponse = await posService.getInventory({
            limit: 1000 // Get a large number to capture most/all categories
          }) as InventoryResponse
          
          // Extract categories from all inventory items
          const uniqueCategories = Array.from(
            new Set(allInventoryResponse.items.map((item: InventoryItem) => item.category))
          ).filter(Boolean).map((category, index) => ({
            id: index + 1,
            name: category as string
          }))
          setCategories(uniqueCategories)
        }
        
        // Load business settings
        const settings = await settingsService.getSettings() as BusinessSettings
        setBusinessSettings(settings)
        
        setIsLoading(false)
      } catch (error: unknown) {
        console.error('Error loading data:', error)
        toast({
          title: "Error",
          description: "Failed to load inventory data. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [currentPage, itemsPerPage, appliedSearchTerm, activeCategory, toast, categories.length])

  const addToCart = (item: InventoryItem) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item._id)

    if (existingItem) {
      setCart(
        cart.map((cartItem) => (cartItem.id === item._id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem)),
      )
    } else {
      setCart([...cart, { 
        id: item._id, 
        name: item.name, 
        price: item.price, 
        quantity: 1,
        sku: item.sku
      }])
    }

    toast({
      title: "Item Added",
      description: `${item.name} added to cart.`,
    })
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id))
    toast({
      title: "Item Removed",
      description: "Item has been removed from cart.",
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }

    setCart(cart.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const calculateChange = () => {
    const cashValue = Number.parseFloat(cashAmount)
    if (isNaN(cashValue)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid cash amount.",
        variant: "destructive",
      })
      return
    }

    if (cashValue < total) {
      toast({
        title: "Insufficient Amount",
        description: "Cash amount is less than the total.",
        variant: "destructive",
      })
      return
    }

    setChange(cashValue - total)
    toast({
      title: "Change Calculated",
      description: `Change: Rs ${(cashValue - total).toFixed(2)}`,
    })
  }

  // Prepare receipt data from sale
  const prepareReceiptData = (sale: CompletedSale): ReceiptData => {
    console.log("Preparing receipt data:", sale); // Debug log
    
    // Validate sale items
    if (!sale.saleDetails.items || !Array.isArray(sale.saleDetails.items)) {
      console.error("Sale items are not an array or are missing:", sale.saleDetails.items);
      return {
        id: sale.saleDetails.id,
        receiptNumber: sale.saleDetails.receiptNumber,
        items: [],
        subtotal: sale.saleDetails.total + (sale.saleDetails.discount || 0),
        discount: sale.saleDetails.discount || 0,
        total: sale.saleDetails.total,
        cashAmount: sale.saleDetails.cashAmount,
        change: sale.saleDetails.change,
        customerName: sale.saleDetails.customerName,
        date: sale.saleDetails.date
      };
    }
    
    // Make sure each item has the required properties
    const validItems = sale.saleDetails.items.map((item, index) => {
      if (!item || typeof item !== 'object') {
        console.error(`Invalid item at index ${index}:`, item);
        // Return a placeholder item
        return {
          id: `error-${index}`,
          name: 'Error: Invalid Item',
          quantity: 1,
          price: 0,
          sku: ''
        };
      }
      
      return {
        id: item.id || `item-${index}`,
        name: item.name || 'Unknown Item',
        quantity: item.quantity || 1,
        price: item.price || 0,
        sku: item.sku || ''
      };
    });
    
    // Log the items we're using for the receipt
    console.log("Validated receipt items:", validItems);
    
    return {
      id: sale.saleDetails.id,
      receiptNumber: sale.saleDetails.receiptNumber,
      items: validItems,
      subtotal: sale.saleDetails.total + (sale.saleDetails.discount || 0),
      discount: sale.saleDetails.discount || 0,
      total: sale.saleDetails.total,
      cashAmount: sale.saleDetails.cashAmount,
      change: sale.saleDetails.change,
      customerName: sale.saleDetails.customerName,
      date: sale.saleDetails.date
    }
  }

  // Handle print completion
  const handlePrintComplete = async () => {
    setPrintingInProgress(false)
    
    // Mark the sale as printed in the database
    if (currentSale) {
      try {
        await posService.markAsPrinted(currentSale.saleDetails.id)
      } catch (error) {
        console.error('Error marking sale as printed:', error)
      }
    }
  }

  const printReceipt = async () => {
    if (cart.length === 0 && !currentSale) {
      toast({
        title: "Empty Cart",
        description: "Please add items to the cart before printing.",
        variant: "destructive",
      })
      return
    }

    // If no current sale but we have items in cart, we need to save the sale first
    if (!currentSale && cart.length > 0) {
      if (change === null) {
        toast({
          title: "Calculate Change",
          description: "Please calculate change before printing the receipt.",
          variant: "destructive",
        })
        return
      }
      
      // Complete the sale first
      await completeSale()
      return
    }

    // If we have a current sale, print it
    if (currentSale) {
      setPrintingInProgress(true)
      const receipt = prepareReceiptData(currentSale)
      setReceiptData(receipt)

      // Make sure we have the latest settings data with correct logo path
      if (!businessSettings) {
        try {
          const settings = await posService.getReceiptSettings() as BusinessSettings
          setBusinessSettings(settings)
        } catch (error) {
          console.error('Error fetching business settings:', error)
        }
      }
    }
  }

  const completeSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to the cart before completing the sale.",
        variant: "destructive",
      })
      return
    }

    if (change === null) {
      toast({
        title: "Calculate Change",
        description: "Please calculate change before completing the sale.",
        variant: "destructive",
      })
      return
    }

    try {
      // Complete the sale and update inventory
      const result = await posService.completeSale(cart, {
        total,
        discount: parseFloat(discountAmount) || 0,
        cashAmount: parseFloat(cashAmount) || 0,
        change: change || 0,
        customerName
      }) as CompletedSale

      setCurrentSale(result)
      
      toast({
        title: "Sale Completed",
        description: `Sale ${result.saleDetails.receiptNumber} completed successfully.`,
      })
      
      // Refresh inventory data with current filters
      const inventoryResponse = await posService.getInventory({
        page: currentPage,
        limit: itemsPerPage,
        search: appliedSearchTerm || undefined,
        category: activeCategory !== 'all' ? activeCategory : undefined
      }) as InventoryResponse
      
      // Update the inventory with fresh data
      setInventoryItems(inventoryResponse.items as InventoryItem[])
      
      if (inventoryResponse.pagination) {
        setTotalPages(inventoryResponse.pagination.totalPages)
      }

      // Always show the print dialog after completing a sale
      setShowPrintDialog(true)

      // Reset cart and form
      setCart([])
      setCashAmount("")
      setChange(null)
      setCustomerName("")
      setDiscountAmount("")
      
    } catch (error: unknown) {
      console.error('Error completing sale:', error)
      toast({
        title: "Sale Error",
        description: error instanceof Error ? error.message : "Failed to complete sale.",
        variant: "destructive",
      })
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = parseFloat(discountAmount) || 0
  const total = Math.max(0, subtotal - discount)

  // No need to filter items locally since we're using server-side filtering
  // This removes the TypeScript error since we're no longer using filteredItems
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    // Don't reset page on every keystroke, only when the debounced search is applied
  }
  
  // Apply search filter (called after debounce)
  useEffect(() => {
    if (appliedSearchTerm !== searchTerm) {
      // Only reset page when search is actually applied (not on every keystroke)
      setCurrentPage(1)
    }
  }, [appliedSearchTerm])

  // Get current items - now we directly use the items from the API
  const currentItems = inventoryItems

  // Page navigation functions
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const goToNextPage = () => {
    handlePageChange(currentPage + 1)
  }

  const goToPreviousPage = () => {
    handlePageChange(currentPage - 1)
  }

  const goToPage = (page: number) => {
    handlePageChange(page)
  }

  // Handle tab change to filter by category
  const handleTabChange = (tabValue: string) => {
    // Reset to page 1 when changing category
    setCurrentPage(1)
    
    // Show loading state
    setIsLoading(true)
    
    if (tabValue === 'all') {
      setActiveCategory('all')
    } else {
      // Extract category name from tab value (format: 'cat-1', 'cat-2', etc.)
      const categoryId = parseInt(tabValue.replace('cat-', ''))
      const category = categories.find(cat => cat.id === categoryId)
      if (category) {
        setActiveCategory(category.name)
      }
    }
  }

  if (isLoading && !searchTerm) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mt-2 text-lg">Loading POS data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-screen flex-col lg:flex-row">
      {/* Product Selection Area */}
      <div className="flex-1 p-4 md:p-6 overflow-auto relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Point of Sale</h2>
        </div>

        <div className="sticky top-0 z-10 bg-background pb-2 pt-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products by name, SKU, category, brand, vehicle..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <Tabs defaultValue="all" onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Items</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={`cat-${category.id}`}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Show loading indicator inside each tab content instead of replacing them */}
          <TabsContent value="all" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <p className="text-muted-foreground">Loading inventory items...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentItems.map((item) => (
                    <Card
                      key={item._id}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                        item.stock <= 0 ? 'opacity-50' : ''
                      }`}
                      onClick={() => {
                        if (item.stock > 0) {
                          addToCart(item)
                        }
                      }}
                    >
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">
                          <div className="flex justify-between items-center">
                            <span>{item.name}</span>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              disabled={item.stock <= 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.stock > 0) {
                                  addToCart(item);
                                }
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 pb-3">
                        <div className="text-sm space-y-1">
                          <div className="flex">
                            <span className="w-24 font-medium text-muted-foreground">SKU:</span>
                            <span>{item.sku}</span>
                          </div>
                          
                          {item.brand && (
                            <div className="flex">
                              <span className="w-24 font-medium text-muted-foreground">Brand:</span>
                              <span>{item.brand}</span>
                            </div>
                          )}
                          
                          {item.vehicleName && (
                            <div className="flex">
                              <span className="w-24 font-medium text-muted-foreground">Vehicle:</span>
                              <span>{item.vehicleName}</span>
                            </div>
                          )}
                          
                          <div className="flex">
                            <span className="w-24 font-medium text-muted-foreground">Category:</span>
                            <span>{item.category}</span>
                          </div>
                          
                          <div className="flex">
                            <span className="w-24 font-medium text-muted-foreground">Stock:</span>
                            <span className={`${item.status === 'Low Stock' || item.stock <= 5 ? 'text-amber-500' : (item.stock <= 0 ? 'text-red-500' : 'text-green-500')}`}>
                              {item.stock} ({item.status})
                            </span>
                          </div>
                          
                          <div className="flex">
                            <span className="w-24 font-medium text-muted-foreground">Price:</span>
                            <span className="font-bold">Rs {item.price.toFixed(2)}</span>
                          </div>
                          
                          {item.purchasePrice && (
                            <div className="flex">
                              <span className="w-24 font-medium text-muted-foreground">Cost Price:</span>
                              <span>Rs {item.purchasePrice.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Pagination UI */}
                <div className="flex justify-between items-center mt-6 mb-2">
                  <div className="text-sm text-muted-foreground">
                    Showing {currentItems.length} of {totalPages * itemsPerPage} items
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={goToPreviousPage} 
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Page buttons */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={goToNextPage} 
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {categories.map((category) => {
            const categoryItems = currentItems.filter((item) => item.category === category.name)
            
            return (
              <TabsContent key={category.id} value={`cat-${category.id}`} className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <p className="text-muted-foreground">Loading inventory items...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryItems.map((item) => (
                        <Card
                          key={item._id}
                          className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                            item.stock <= 0 ? 'opacity-50' : ''
                          }`}
                          onClick={() => {
                            if (item.stock > 0) {
                              addToCart(item)
                            }
                          }}
                        >
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base">
                              <div className="flex justify-between items-center">
                                <span>{item.name}</span>
                                <Button 
                                  size="sm" 
                                  variant="secondary" 
                                  disabled={item.stock <= 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.stock > 0) {
                                      addToCart(item);
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" /> Add
                                </Button>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 pb-3">
                            <div className="text-sm space-y-1">
                              <div className="flex">
                                <span className="w-24 font-medium text-muted-foreground">SKU:</span>
                                <span>{item.sku}</span>
                              </div>
                              
                              {item.brand && (
                                <div className="flex">
                                  <span className="w-24 font-medium text-muted-foreground">Brand:</span>
                                  <span>{item.brand}</span>
                                </div>
                              )}
                              
                              {item.vehicleName && (
                                <div className="flex">
                                  <span className="w-24 font-medium text-muted-foreground">Vehicle:</span>
                                  <span>{item.vehicleName}</span>
                                </div>
                              )}
                              
                              <div className="flex">
                                <span className="w-24 font-medium text-muted-foreground">Stock:</span>
                                <span className={`${item.status === 'Low Stock' || item.stock <= 5 ? 'text-amber-500' : (item.stock <= 0 ? 'text-red-500' : 'text-green-500')}`}>
                                  {item.stock} ({item.status})
                                </span>
                              </div>
                              
                              <div className="flex">
                                <span className="w-24 font-medium text-muted-foreground">Price:</span>
                                <span className="font-bold">Rs {item.price.toFixed(2)}</span>
                              </div>
                              
                              {item.purchasePrice && (
                                <div className="flex">
                                  <span className="w-24 font-medium text-muted-foreground">Cost Price:</span>
                                  <span>Rs {item.purchasePrice.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Category pagination */}
                    <div className="flex justify-between items-center mt-6 mb-2">
                      <div className="text-sm text-muted-foreground">
                        Showing {categoryItems.length} of {totalPages * itemsPerPage} items
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={goToPreviousPage} 
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        {/* Page buttons */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={goToNextPage} 
                          disabled={currentPage === totalPages || totalPages === 0}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>

      {/* Cart & Checkout Area */}
      <div className="w-full lg:w-[400px] border-t lg:border-t-0 lg:border-l bg-muted/30 flex flex-col">
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              <h3 className="font-semibold">Current Sale</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
              onClick={() => {
                if (cart.length > 0) {
                  setCart([])
                  toast({
                    title: "Cart Cleared",
                    description: "All items have been removed from the cart.",
                  })
                }
              }}
            >
              <Trash className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Cart is Empty</h3>
              <p className="text-sm text-muted-foreground">Add items from the product list to begin a new sale.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, item.quantity - 1)
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          min="1"
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-12 mx-1 px-1 text-center h-7"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, item.quantity + 1)
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">Rs {(item.price * item.quantity).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.id)
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="border-t p-4 bg-background">
          <div className="space-y-1.5">
            <div className="mb-3">
              <Label htmlFor="customer-name">Customer Name</Label>
              <div className="flex items-center mt-1">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <Input
                  id="customer-name"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>Rs {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Discount</span>
              <div className="w-24">
                <Input
                  type="number"
                  placeholder="0.00"
                  min={0}
                  max={subtotal}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="text-right h-7 px-2"
                />
              </div>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>Rs {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="cash-amount">Cash Amount</Label>
            <div className="flex gap-2">
              <Input
                id="cash-amount"
                type="number"
                placeholder="0.00"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
              />
              <Button variant="outline" className="shrink-0" onClick={calculateChange}>
                Calculate Change
              </Button>
            </div>
            {change !== null && (
              <div className="flex justify-between font-bold text-green-600 dark:text-green-500 mt-2">
                <span>Change</span>
                <span>Rs {change.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 mt-4">
            <Button
              variant="secondary"
              className="w-full gap-1"
              onClick={() => {
                if (cart.length > 0) {
                  setCashAmount(total.toFixed(2))
                  setChange(0)
                  toast({
                    title: "Exact Cash",
                    description: "Exact cash amount has been entered.",
                  })
                }
              }}
            >
              <Banknote className="h-4 w-4" />
              Cash
            </Button>
          </div>

          <Button 
            variant="default" 
            className="w-full gap-1 mt-2 bg-green-600 hover:bg-green-700" 
            onClick={() => completeSale()}
            disabled={printingInProgress}
          >
            Complete Sale
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print Receipt</DialogTitle>
            <DialogDescription>
              Sale {currentSale?.saleDetails.receiptNumber} has been completed successfully.
              Would you like to print a receipt?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowPrintDialog(false)}
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                setShowPrintDialog(false)
                printReceipt()
              }}
            >
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Printer Component */}
      {printingInProgress && receiptData && businessSettings && (
        <ReceiptPrinter
          receiptData={receiptData}
          settings={{
            business: businessSettings.business,
            pos: {
              receiptHeader: businessSettings.pos.receiptHeader,
              receiptFooter: businessSettings.pos.receiptFooter,
              logo: businessSettings.pos.logo
            }
          }}
          onPrintComplete={handlePrintComplete}
        />
      )}
    </div>
  )
}
