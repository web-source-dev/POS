"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Check, Info, Package, Tag, DollarSign, BarChart } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import Image from "next/image"
interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemAdded: () => void
}

export function AddItemDialog({ open, onOpenChange, onItemAdded }: AddItemDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [formData, setFormData] = useState({
    // Basic Info
    name: "",
    sku: "",
    barcode: "",
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
    weight: "",
    dimensions: {
      length: "",
      width: "",
      height: ""
    },
    
    // Additional
    imageUrl: "",
    expiryDate: null as Date | null,
    tags: [] as string[]
  })
  
  const [recentCategories, setRecentCategories] = useState<string[]>([])
  const [recentSuppliers, setRecentSuppliers] = useState<string[]>([])
  const [recentBrands, setRecentBrands] = useState<string[]>([])
  const [recentSubcategories, setRecentSubcategories] = useState<string[]>([])
  const [recentSubcategories2, setRecentSubcategories2] = useState<string[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [tempTag, setTempTag] = useState("")

  // Load recent data when dialog opens
  useEffect(() => {
    if (open) {
      // Load categories
      inventoryService.getCategories()
        .then(categories => {
          setRecentCategories(categories as string[]);
        })
        .catch(error => {
          console.error("Failed to load categories:", error);
        });
        
      // Load suppliers
      inventoryService.getSuppliers()
        .then(suppliers => {
          setRecentSuppliers(suppliers as string[]);
        })
        .catch(error => {
          console.error("Failed to load suppliers:", error);
        });
        
      // Load brands
      inventoryService.getBrands()
        .then(brands => {
          setRecentBrands(brands as string[]);
        })
        .catch(error => {
          console.error("Failed to load brands:", error);
        });
        
      // Subcategories and subcategory2 are loaded in their respective useEffects
    }
  }, [open]);
  
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
      console.log('Loading subcategory2 values for:', formData.category, formData.subcategory);
      inventoryService.getSubcategories2(formData.category, formData.subcategory)
        .then(subcategories2 => {
          console.log('Loaded subcategory2 values:', subcategories2);
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
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value
        }
      }))
    } else {
    setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }
  
  const handleSelect = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const itemData = {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
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
        weight: formData.weight ? Number(formData.weight) : undefined,
        dimensions: {
          length: formData.dimensions.length ? Number(formData.dimensions.length) : undefined,
          width: formData.dimensions.width ? Number(formData.dimensions.width) : undefined,
          height: formData.dimensions.height ? Number(formData.dimensions.height) : undefined
        },
        expiryDate: formData.expiryDate,
        tags: formData.tags,
        taxRate: Number(formData.taxRate)
      }

      await inventoryService.createItem(itemData)

      toast({
        title: "Item Added",
        description: `${formData.name} has been added to inventory.`,
      })

      // Reset form and close dialog
      setFormData({
        name: "",
        sku: "",
        barcode: "",
        category: "",
        subcategory: "",
        subcategory2: "",
        brand: "",
        price: "",
        stock: "",
        description: "",
        reorderLevel: "5",
        supplier: "",
        purchasePrice: "",
        location: "",
        imageUrl: "",
        unitOfMeasure: "each",
        weight: "",
        dimensions: {
          length: "",
          width: "",
          height: ""
        },
        expiryDate: null,
        tags: [],
        taxRate: "0"
      })
      setPreviewUrl(null)

      onItemAdded()
      onOpenChange(false)
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
          <DialogDescription>
            Enter the details for the new inventory item. Navigate through tabs to fill all information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="basic">
                <Package className="h-4 w-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="stock">
                <BarChart className="h-4 w-4 mr-2" />
                Stock
              </TabsTrigger>
              <TabsTrigger value="pricing">
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="details">
                <Info className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="additional">
                <Tag className="h-4 w-4 mr-2" />
                Additional
              </TabsTrigger>
            </TabsList>
            
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                  Item Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
              
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">
                  SKU *
              </Label>
                <Input 
                  id="sku" 
                  name="sku" 
                  value={formData.sku} 
                  onChange={handleChange} 
                  className="col-span-3" 
                  required 
                />
            </div>
              
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="barcode" className="text-right">
                  Barcode/UPC
              </Label>
                <Input 
                  id="barcode" 
                  name="barcode" 
                  value={formData.barcode} 
                  onChange={handleChange} 
                  className="col-span-3" 
                  placeholder="Optional barcode or UPC"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category *
                </Label>
                <div className="col-span-3">
                <Input 
                  id="category" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange} 
                  required 
                />
                  
                {recentCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {recentCategories.map((category) => (
                      <Button
                        key={category}
                        type="button"
                        variant="outline"
                        size="sm"
                          onClick={() => handleSelect("category", category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subcategory" className="text-right">
                  Subcategory 1
                </Label>
                <div className="col-span-3">
                  <Input 
                    id="subcategory" 
                    name="subcategory" 
                    value={formData.subcategory} 
                    onChange={handleChange} 
                    placeholder="First level subcategory"
                  />
                  
                  {recentSubcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {recentSubcategories.map((subcategory) => (
                        <Button
                          key={subcategory}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelect("subcategory", subcategory)}
                        >
                          {subcategory}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subcategory2" className="text-right">
                  Subcategory 2
                </Label>
                <div className="col-span-3">
                  <Input 
                    id="subcategory2" 
                    name="subcategory2" 
                    value={formData.subcategory2} 
                    onChange={handleChange} 
                    placeholder={formData.subcategory ? "Second level subcategory" : "Select a subcategory first"}
                    disabled={!formData.subcategory}
                  />
                  
                  {formData.subcategory && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {recentSubcategories2.length > 0 
                        ? "Select from existing or enter a new one" 
                        : "No existing subcategory level 2. Enter a new one."}
                    </div>
                  )}
                  
                  {recentSubcategories2.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {recentSubcategories2.map((subcategory2) => (
                        <Button
                          key={subcategory2}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelect("subcategory2", subcategory2)}
                        >
                          {subcategory2}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="brand" className="text-right">
                  Brand
              </Label>
                <div className="col-span-3">
              <Input
                    id="brand" 
                    name="brand" 
                    value={formData.brand} 
                    onChange={handleChange} 
                    placeholder="Optional brand name"
                  />
                  
                  {recentBrands.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {recentBrands.map((brand) => (
                        <Button
                          key={brand}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelect("brand", brand)}
                        >
                          {brand}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                onChange={handleChange}
                className="col-span-3"
                  placeholder="Optional description"
                  rows={3}
              />
            </div>
            </TabsContent>
            
            {/* Stock Tab */}
            <TabsContent value="stock" className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                  Stock Quantity *
              </Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
              
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reorderLevel" className="text-right">
                Reorder Level
              </Label>
              <Input
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                  min="0"
                value={formData.reorderLevel}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Storage Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="e.g., Shelf A-12, Warehouse B"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiryDate" className="text-right">
                  Expiry Date
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
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
            <TabsContent value="pricing" className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Selling Price (Rs) *
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="purchasePrice" className="text-right">
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
                  className="col-span-3"
                  placeholder="Cost price for profit calculation"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="taxRate" className="text-right">
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
                className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier" className="text-right">
                  Supplier
                </Label>
                <div className="col-span-3">
                  <Input 
                    id="supplier" 
                    name="supplier" 
                    value={formData.supplier} 
                    onChange={handleChange} 
                    placeholder="Who supplies this item?"
                  />
                  
                  {recentSuppliers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {recentSuppliers.map((supplier) => (
                        <Button
                          key={supplier}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelect("supplier", supplier)}
                        >
                          {supplier}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {formData.price && formData.purchasePrice && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right text-sm text-muted-foreground">
                    Profit Margin:
                  </div>
                  <div className="col-span-3 text-sm font-medium">
                    {Number(formData.purchasePrice) > 0 
                      ? `${(((Number(formData.price) - Number(formData.purchasePrice)) / Number(formData.price)) * 100).toFixed(2)}%` 
                      : 'N/A'}
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unitOfMeasure" className="text-right">
                  Unit of Measure
                </Label>
                <select
                  id="unitOfMeasure"
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleChange}
                  className="col-span-3 h-9 rounded-md border border-input px-3 py-1"
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
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                  <option value="pair">Pair</option>
                  <option value="set">Set</option>
                  <option value="case">Case</option>
                </select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="weight" className="text-right">
                  Weight
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="Item weight"
                  />
                  <span className="text-sm text-muted-foreground w-20">
                    {formData.unitOfMeasure === "kg" ? "kg" : 
                     formData.unitOfMeasure === "g" ? "g" : 
                     formData.unitOfMeasure === "lb" ? "lb" : 
                     formData.unitOfMeasure === "oz" ? "oz" : "kg"}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Dimensions
                </Label>
                <div className="col-span-3 grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      id="dimensions.length"
                      name="dimensions.length"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.dimensions.length}
                      onChange={handleChange}
                      placeholder="Length"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dimensions.width"
                      name="dimensions.width"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.dimensions.width}
                      onChange={handleChange}
                      placeholder="Width"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dimensions.height"
                      name="dimensions.height"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.dimensions.height}
                      onChange={handleChange}
                      placeholder="Height"
              />
            </div>
          </div>
              </div>
              <div className="text-sm text-muted-foreground text-right pr-4">
                All dimensions in centimeters (cm)
              </div>
            </TabsContent>
            
            {/* Additional Tab */}
            <TabsContent value="additional" className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageUpload" className="text-right">
                  Product Image
                </Label>
                <div className="col-span-3">
                  <div className="flex items-center gap-4">
                    <Input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="flex-1"
                    />
                    {previewUrl && (
                      <div className="h-20 w-20 rounded border overflow-hidden">
                        <Image 
                          src={previewUrl} 
                          alt="Preview" 
                          className="h-full w-full object-cover" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="tags" className="text-right pt-2">
                  Tags
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tempTag}
                      onChange={(e) => setTempTag(e.target.value)}
                      placeholder="Add tags for better search"
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
                    >
                      Add
                    </Button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <Button
                          key={tag}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeTag(tag)}
                          className="group"
                        >
                          {tag}
                          <span className="ml-2 text-muted-foreground group-hover:text-foreground">×</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <div className="flex w-full justify-between items-center">
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
                >
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
                >
                  Next
                </Button>
              </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Item
                </>
              )}
            </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
