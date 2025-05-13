"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Check, Info, Package, Tag, DollarSign, BarChart, ArrowLeft, X, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { inventoryService } from "@/lib/inventory-service"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight } from "lucide-react"
import { AddSupplierDialog } from "@/components/suppliers/add-supplier-dialog"
import supplierService from "@/services/supplierService"

interface InventoryItem {
  _id: string
  name: string
  sku: string
  category: string
  subcategory?: string
  subcategory2?: string
  brand?: string
  barcode?: string
  stock: number
  price: number
  purchasePrice?: number
  status: string
  description: string
  reorderLevel: number
  supplier?: string
  location?: string
  imageUrl?: string
  expiryDate?: string | Date
  unitOfMeasure?: string
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  tags?: string[]
  taxRate?: number
  measureValue?: string
}

interface Supplier {
  _id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  status: string;
}

interface EditInventoryFormProps {
  itemId: string;
}

export function EditInventoryForm({ itemId }: EditInventoryFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [isLoading, setIsLoading] = useState(true)
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    // Basic Info
    name: "",
    sku: "",
    category: "",
    subcategory: "",
    subcategory2: "",
    brand: "",
    price: "",
    description: "",
    
    // Stock & Location
    stock: "",
    reorderLevel: "5",
    location: "",
    
    // Supplier & Pricing
    supplier: "",
    purchasePrice: "",
    taxRate: "0",
    
    // Details & Measurements
    unitOfMeasure: "each",
    measureValue: "",
    
    // Additional
    imageUrl: "",
    expiryDate: null as Date | null,
    tags: [] as string[]
  })
  
  const [recentCategories, setRecentCategories] = useState<string[]>([])
  const [recentBrands, setRecentBrands] = useState<string[]>([])
  const [recentSubcategories, setRecentSubcategories] = useState<string[]>([])
  const [recentSubcategories2, setRecentSubcategories2] = useState<string[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [tempTag, setTempTag] = useState("")
  
  // Add supplier dialog state
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  // Add state for "new" values
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [newSubcategory2, setNewSubcategory2] = useState("");
  const [newBrand, setNewBrand] = useState("");

  // Add measurement unit labels based on unit of measure
  const getMeasureLabel = (unitType: string) => {
    switch(unitType) {
      case 'kg':
      case 'g':
      case 'lb':
      case 'oz':
        return 'Weight';
      case 'm':
      case 'cm':
      case 'inch':
        return 'Length';
      case 'l':
      case 'ml':
        return 'Volume';
      default:
        return 'Quantity';
    }
  };
  
  // Get measurement unit abbreviation
  const getMeasureUnit = (unitType: string) => {
    return unitType;
  };

  // Load item data when component mounts
  useEffect(() => {
    const loadItem = async () => {
      setIsLoading(true);
      try {
        const itemData = await inventoryService.getItem(itemId) as InventoryItem;
        setItem(itemData);
        
        // Populate form data
        setFormData({
          name: itemData.name,
          sku: itemData.sku,
          category: itemData.category,
          subcategory: itemData.subcategory || "",
          subcategory2: itemData.subcategory2 || "",
          brand: itemData.brand || "",
          price: itemData.price.toString(),
          stock: itemData.stock.toString(),
          description: itemData.description || "",
          reorderLevel: itemData.reorderLevel.toString(),
          supplier: itemData.supplier || "",
          purchasePrice: itemData.purchasePrice ? itemData.purchasePrice.toString() : "",
          location: itemData.location || "",
          imageUrl: itemData.imageUrl || "",
          unitOfMeasure: itemData.unitOfMeasure || "each",
          measureValue: itemData.measureValue || "",
          expiryDate: itemData.expiryDate ? new Date(itemData.expiryDate) : null,
          tags: itemData.tags || [],
          taxRate: itemData.taxRate !== undefined ? itemData.taxRate.toString() : "0"
        });
        
        // Set preview URL if there's an image
        if (itemData.imageUrl) {
          setPreviewUrl(itemData.imageUrl);
        }
      } catch (error) {
        console.error("Failed to load item:", error);
        toast({
          title: "Error",
          description: "Failed to load inventory item. Please try again.",
          variant: "destructive"
        });
        router.push('/inventory');
      } finally {
        setIsLoading(false);
      }
    };

    loadItem();
    
    // Load supporting data
    // Load categories
    inventoryService.getCategories()
      .then(categories => {
        setRecentCategories(categories as string[]);
      })
      .catch(error => {
        console.error("Failed to load categories:", error);
      });
      
    // Update the supplier loading code
    loadSuppliers();
      
    // Load brands
    inventoryService.getBrands()
      .then(brands => {
        setRecentBrands(brands as string[]);
      })
      .catch(error => {
        console.error("Failed to load brands:", error);
      });
  }, [itemId, toast, router]);

  // Load subcategories when category changes
  useEffect(() => {
    if (formData.category) {
      inventoryService.getSubcategories(formData.category)
        .then(subcategories => {
          setRecentSubcategories(subcategories as string[]);
        })
        .catch(error => {
          console.error("Failed to load subcategories:", error);
        });
    } else {
      setRecentSubcategories([]);
    }
  }, [formData.category]);
  
  // Load subcategory2 when subcategory changes
  useEffect(() => {
    if (formData.category && formData.subcategory) {
      inventoryService.getSubcategories2(formData.category, formData.subcategory)
        .then(subcategories2 => {
          setRecentSubcategories2(subcategories2 as string[]);
        })
        .catch(error => {
          console.error("Failed to load subcategory2 values:", error);
        });
    } else {
      setRecentSubcategories2([]);
    }
  }, [formData.category, formData.subcategory]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData((prev) => {
        // Create a safe copy of the current object
        const parentObj = prev[parent as keyof typeof prev]
        
        // Only proceed if the parent property exists and is an object
        if (parentObj && typeof parentObj === 'object' && !Array.isArray(parentObj)) {
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: value
            }
          }
        }
        // Return unchanged if parent isn't a proper object
        return prev
      })
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }
 
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Preview image
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    // Upload image
    const formData = new FormData()
    formData.append('image', file)
    
    toast({
      title: "Uploading image...",
      description: "Please wait while we upload your image."
    })
    
    inventoryService.uploadImage(formData)
      .then(data => {
        setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }))
        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded successfully."
        })
      })
      .catch(error => {
        console.error("Failed to upload image:", error)
        toast({
          title: "Upload failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive"
        })
      })
  }
  
  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, expiryDate: date || null }))
  }
  
  const addTag = () => {
    if (tempTag.trim() !== "" && !formData.tags.includes(tempTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tempTag.trim()]
      }))
      setTempTag("")
    }
  }
  
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev, 
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleCancel = () => {
    router.push('/inventory')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!item) return
    
    setIsSubmitting(true)

    try {
      const itemData = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        subcategory: formData.subcategory,
        subcategory2: formData.subcategory2,
        brand: formData.brand,
        supplier: formData.supplier,
        price: Number(formData.price),
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
        stock: Number(formData.stock),
        description: formData.description,
        reorderLevel: Number(formData.reorderLevel),
        location: formData.location,
        imageUrl: formData.imageUrl,
        unitOfMeasure: formData.unitOfMeasure,
        measureValue: formData.measureValue,
        expiryDate: formData.expiryDate,
        tags: formData.tags,
        taxRate: Number(formData.taxRate)
      }

      await inventoryService.updateItem(item._id, itemData)

      toast({
        title: "Item Updated",
        description: `${formData.name} has been updated.`,
      })
      
      // Navigate back to inventory page
      router.push('/inventory')
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update item. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add this function to load suppliers
  const loadSuppliers = () => {
    supplierService.getAllSuppliers()
      .then((supplierData: unknown) => {
        setSuppliers(supplierData as Supplier[]);
      })
      .catch((error: Error) => {
        console.error("Failed to load suppliers:", error);
      });
  };
  
  // Add this handler for when a new supplier is added
  const handleSupplierAdded = (newSupplier: Supplier) => {
    // Reload the suppliers list
    loadSuppliers();
    // Set the current supplier to the newly added one
    setFormData(prev => ({ ...prev, supplier: newSupplier._id }));
  };

  // Add handlers for adding new values
  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      // Add to form data
      setFormData(prev => ({ ...prev, category: newCategory.trim() }));
      // Clear input
      setNewCategory("");
      // Add to recent categories if not already included
      if (!recentCategories.includes(newCategory.trim())) {
        setRecentCategories(prev => [...prev, newCategory.trim()]);
      }
    }
  };
  
  const handleAddNewSubcategory = () => {
    if (newSubcategory.trim()) {
      // Add to form data
      setFormData(prev => ({ ...prev, subcategory: newSubcategory.trim() }));
      // Clear input
      setNewSubcategory("");
      // Add to recent subcategories if not already included
      if (!recentSubcategories.includes(newSubcategory.trim())) {
        setRecentSubcategories(prev => [...prev, newSubcategory.trim()]);
      }
    }
  };
  
  const handleAddNewSubcategory2 = () => {
    if (newSubcategory2.trim()) {
      // Add to form data
      setFormData(prev => ({ ...prev, subcategory2: newSubcategory2.trim() }));
      // Clear input
      setNewSubcategory2("");
      // Add to recent subcategories2 if not already included
      if (!recentSubcategories2.includes(newSubcategory2.trim())) {
        setRecentSubcategories2(prev => [...prev, newSubcategory2.trim()]);
      }
    }
  };
  
  const handleAddNewBrand = () => {
    if (newBrand.trim()) {
      // Add to form data
      setFormData(prev => ({ ...prev, brand: newBrand.trim() }));
      // Clear input
      setNewBrand("");
      // Add to recent brands if not already included
      if (!recentBrands.includes(newBrand.trim())) {
        setRecentBrands(prev => [...prev, newBrand.trim()]);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full border shadow-sm">
        <CardContent className="p-6 min-h-[400px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-10 w-28" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-5 gap-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
            <div className="space-y-6 mt-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="grid grid-cols-4 gap-4">
                  <Skeleton className="h-5 w-24 col-span-1" />
                  <Skeleton className="h-10 w-full col-span-3" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border shadow-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              className="mb-4 shadow-sm transition-colors hover:bg-muted/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
            <h2 className="text-2xl font-bold tracking-tight mb-1">Edit Inventory Item</h2>
            <p className="text-muted-foreground">Update information for this inventory item.</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 mb-5 bg-muted/60 p-1 rounded-lg">
              <TabsTrigger value="basic" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Package className="h-4 w-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="stock" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BarChart className="h-4 w-4 mr-2" />
                Stock
              </TabsTrigger>
              <TabsTrigger value="pricing" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="details" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Info className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="additional" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Tag className="h-4 w-4 mr-2" />
                Additional
              </TabsTrigger>
            </TabsList>
            
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4 bg-muted/10 p-4 rounded-lg border">
              <div className="flex justify-between items-center pb-2">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Required fields are marked with *</Badge>
              </div>
              <Separator className="mb-4" />
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-medium flex gap-1">
                    Item Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full shadow-sm"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sku" className="font-medium flex gap-1">
                    SKU <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      id="sku" 
                      name="sku" 
                      value={formData.sku} 
                      onChange={handleChange}
                      className="w-full shadow-sm pr-8"
                      required 
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute right-2 top-2.5 text-muted-foreground cursor-help">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="max-w-xs">Stock Keeping Unit - A unique identifier for this inventory item</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category" className="font-medium flex gap-1">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  {formData.category === "add_new" ? (
                    <div className="flex gap-2">
                      <Input
                        id="newCategory"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Enter new category"
                        className="shadow-sm flex-1"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleAddNewCategory}
                        className="px-3"
                      >
                        Add
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setFormData(prev => ({ ...prev, category: "" }))}
                        className="px-3"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full h-9 rounded-md border border-input px-3 py-1 shadow-sm focus:ring-1 focus:ring-primary"
                      required
                    >
                      <option value="">Select a category</option>
                      {recentCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      <option value="add_new">-- Add new category --</option>
                    </select>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subcategory" className="font-medium">
                    Subcategory 1
                  </Label>
                  {formData.subcategory === "add_new" ? (
                    <div className="flex gap-2">
                      <Input
                        id="newSubcategory"
                        value={newSubcategory}
                        onChange={(e) => setNewSubcategory(e.target.value)}
                        placeholder="Enter new subcategory"
                        className="shadow-sm flex-1"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleAddNewSubcategory}
                        className="px-3"
                      >
                        Add
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setFormData(prev => ({ ...prev, subcategory: "" }))}
                        className="px-3"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <select
                      id="subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      className="w-full h-9 rounded-md border border-input px-3 py-1 shadow-sm focus:ring-1 focus:ring-primary"
                      disabled={!formData.category}
                    >
                      <option value="">Select a subcategory</option>
                      {recentSubcategories.map((subcategory) => (
                        <option key={subcategory} value={subcategory}>
                          {subcategory}
                        </option>
                      ))}
                      <option value="add_new">-- Add new subcategory --</option>
                    </select>
                  )}
                  {!formData.category && (
                    <p className="text-xs text-muted-foreground mt-1">Select a category first</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subcategory2" className="font-medium">
                    Subcategory 2
                  </Label>
                  {formData.subcategory2 === "add_new" ? (
                    <div className="flex gap-2">
                      <Input
                        id="newSubcategory2"
                        value={newSubcategory2}
                        onChange={(e) => setNewSubcategory2(e.target.value)}
                        placeholder="Enter new subcategory level 2"
                        className="shadow-sm flex-1"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleAddNewSubcategory2}
                        className="px-3"
                      >
                        Add
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setFormData(prev => ({ ...prev, subcategory2: "" }))}
                        className="px-3"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <select
                      id="subcategory2"
                      name="subcategory2"
                      value={formData.subcategory2}
                      onChange={handleChange}
                      className="w-full h-9 rounded-md border border-input px-3 py-1 shadow-sm focus:ring-1 focus:ring-primary"
                      disabled={!formData.subcategory}
                    >
                      <option value="">Select a subcategory</option>
                      {recentSubcategories2.map((subcategory2) => (
                        <option key={subcategory2} value={subcategory2}>
                          {subcategory2}
                        </option>
                      ))}
                      <option value="add_new">-- Add new subcategory --</option>
                    </select>
                  )}
                  {!formData.subcategory && (
                    <p className="text-xs text-muted-foreground mt-1">Select a subcategory first</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="brand" className="font-medium">
                    Brand
                  </Label>
                  {formData.brand === "add_new" ? (
                    <div className="flex gap-2">
                      <Input
                        id="newBrand"
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        placeholder="Enter new brand"
                        className="shadow-sm flex-1"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleAddNewBrand}
                        className="px-3"
                      >
                        Add
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setFormData(prev => ({ ...prev, brand: "" }))}
                        className="px-3"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <select
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className="w-full h-9 rounded-md border border-input px-3 py-1 shadow-sm focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select a brand</option>
                      {recentBrands.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                      <option value="add_new">-- Add new brand --</option>
                    </select>
                  )}
                </div>
                
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description" className="font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full shadow-sm min-h-[100px]"
                    placeholder="Provide a detailed description of the item"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Stock Tab */}
            <TabsContent value="stock" className="space-y-4 mt-4 bg-muted/10 p-4 rounded-lg border">
              <div className="flex justify-between items-center pb-2">
                <h3 className="text-lg font-medium">Stock Information</h3>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Required fields are marked with *</Badge>
              </div>
              <Separator className="mb-4" />
              
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stock" className="font-medium flex gap-1">
                    Stock Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full shadow-sm"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reorderLevel" className="font-medium">
                    Reorder Level
                  </Label>
                  <Input
                    id="reorderLevel"
                    name="reorderLevel"
                    type="number"
                    min="0"
                    value={formData.reorderLevel}
                    onChange={handleChange}
                    className="w-full shadow-sm"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location" className="font-medium">
                    Storage Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full shadow-sm"
                    placeholder="e.g., Shelf A-12, Warehouse B"
                  />
                </div>
                
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="expiryDate" className="font-medium">
                    Expiry Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal shadow-sm",
                          !formData.expiryDate && "text-muted-foreground"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expiryDate ? format(formData.expiryDate, "PPP") : "Set expiry date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0" 
                      align="start"
                      side="bottom"
                      sideOffset={4}
                    >
                      <Calendar
                        mode="single"
                        selected={formData.expiryDate || undefined}
                        onSelect={handleDateChange}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </TabsContent>
            
            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4 mt-4 bg-muted/10 p-4 rounded-lg border">
              <div className="flex justify-between items-center pb-2">
                <h3 className="text-lg font-medium">Pricing Information</h3>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Required fields are marked with *</Badge>
              </div>
              <Separator className="mb-4" />
              
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="font-medium flex gap-1">
                    Selling Price (Rs) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full shadow-sm"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice" className="font-medium">
                    Purchase Price (Rs)
                  </Label>
                  <Input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    className="w-full shadow-sm"
                    placeholder="Cost price for profit calculation"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxRate" className="font-medium">
                    Tax Rate (%)
                  </Label>
                  <Input
                    id="taxRate"
                    name="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={handleChange}
                    className="w-full shadow-sm"
                  />
                </div>
                
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="supplier" className="font-medium">
                    Supplier
                  </Label>
                  <div className="flex gap-2">
                    <select
                      id="supplier"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      className="flex-1 h-9 rounded-md border border-input px-3 py-1 shadow-sm focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSupplierDialogOpen(true)}
                      className="shadow-sm"
                    >
                      Add New
                    </Button>
                  </div>
                </div>
                
                {formData.price && formData.purchasePrice && (
                  <div className="col-span-3">
                    <div className="bg-muted/20 rounded-md p-3 border">
                      <div className="text-sm font-medium mb-1">Profit Margin:</div>
                      <div className="text-sm font-medium">
                        {Number(formData.purchasePrice) > 0 
                          ? `${(((Number(formData.price) - Number(formData.purchasePrice)) / Number(formData.price)) * 100).toFixed(2)}%` 
                          : 'N/A'}
                      </div>
                      {Number(formData.purchasePrice) > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Profit per item: Rs{(Number(formData.price) - Number(formData.purchasePrice)).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-4 bg-muted/10 p-4 rounded-lg border">
              <div className="flex justify-between items-center pb-2">
                <h3 className="text-lg font-medium">Product Details</h3>
              </div>
              <Separator className="mb-4" />
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="unitOfMeasure" className="font-medium">
                    Unit of Measure
                  </Label>
                  <select
                    id="unitOfMeasure"
                    name="unitOfMeasure"
                    value={formData.unitOfMeasure}
                    onChange={handleChange}
                    className="w-full h-9 rounded-md border border-input px-3 py-1 shadow-sm focus:ring-1 focus:ring-primary"
                  >
                    <option value="each">Each (pcs)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="lb">Pound (lb)</option>
                    <option value="oz">Ounce (oz)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="m">Meter (m)</option>
                    <option value="cm">Centimeter (cm)</option>
                    <option value="inch">Inch (in)</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="pair">Pair</option>
                    <option value="set">Set</option>
                    <option value="case">Case</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="measureValue" className="font-medium">
                    {getMeasureLabel(formData.unitOfMeasure)}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="measureValue"
                      name="measureValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.measureValue}
                      onChange={handleChange}
                      placeholder={`Item ${getMeasureLabel(formData.unitOfMeasure).toLowerCase()}`}
                      className="w-full shadow-sm"
                    />
                    <span className="text-sm text-muted-foreground w-20">
                      {getMeasureUnit(formData.unitOfMeasure)}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Additional Tab */}
            <TabsContent value="additional" className="space-y-4 mt-4 bg-muted/10 p-4 rounded-lg border">
              <div className="flex justify-between items-center pb-2">
                <h3 className="text-lg font-medium">Additional Information</h3>
              </div>
              <Separator className="mb-4" />
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="imageUpload" className="font-medium">
                    Product Image
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="flex-1 shadow-sm"
                    />
                    {previewUrl && (
                      <div className="h-20 w-20 rounded-md border overflow-hidden shadow-sm">
                        <Image 
                          src={previewUrl} 
                          alt="Preview" 
                          className="h-full w-full object-cover"
                          width={80}
                          height={80}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tags" className="font-medium">
                    Tags
                  </Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        value={tempTag}
                        onChange={(e) => setTempTag(e.target.value)}
                        placeholder="Add tags for better search"
                        className="shadow-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={addTag}
                        className="shadow-sm"
                      >
                        Add
                      </Button>
                    </div>
                    
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 p-3 border rounded-md bg-muted/30">
                        {formData.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 group"
                          >
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 rounded-full hover:bg-primary hover:text-primary-foreground p-0 opacity-70 group-hover:opacity-100"
                              onClick={() => removeTag(tag)}
                            >
                              <X className="h-2.5 w-2.5" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 flex justify-between border-t pt-6">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  const tabs = ["basic", "stock", "pricing", "details", "additional"];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1]);
                  }
                }}
                disabled={activeTab === "basic"}
                className="bg-muted/50 hover:bg-muted/80 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  const tabs = ["basic", "stock", "pricing", "details", "additional"];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
                disabled={activeTab === "additional"}
                className="bg-muted/50 hover:bg-muted/80 shadow-sm"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                className="shadow-sm"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="shadow-sm bg-primary/90 hover:bg-primary transition-colors gap-2"
              >
                {isSubmitting ? "Saving..." : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
      
      <AddSupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        onSupplierAdded={handleSupplierAdded}
      />
    </Card>
  );
} 