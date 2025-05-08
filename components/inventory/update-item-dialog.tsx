"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"

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
import { useToast } from "@/hooks/use-toast"
import { inventoryService } from "@/lib/inventory-service"

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

interface UpdateItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemUpdated: () => void
  item: InventoryItem | null
}

export function UpdateItemDialog({ open, onOpenChange, onItemUpdated, item }: UpdateItemDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    reorderLevel: "5",
  })
  const [recentCategories, setRecentCategories] = useState<string[]>([])

  // Load item data when dialog opens and item changes
  useEffect(() => {
    if (open && item) {
      setFormData({
        name: item.name,
        sku: item.sku,
        category: item.category,
        price: item.price.toString(),
        stock: item.stock.toString(),
        description: item.description || "",
        reorderLevel: item.reorderLevel.toString(),
      })
    }
  }, [open, item])

  // Load recent categories when dialog opens
  useEffect(() => {
    if (open) {
      inventoryService.getCategories()
        .then(categories => {
          setRecentCategories(categories as string[]);
        })
        .catch(error => {
          console.error("Failed to load categories:", error);
        });
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategorySelect = (category: string) => {
    setFormData((prev) => ({ ...prev, category }))
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
        stock: Number(formData.stock),
        price: Number(formData.price),
        description: formData.description,
        reorderLevel: Number(formData.reorderLevel)
      }

      await inventoryService.updateItem(item._id, itemData)

      toast({
        title: "Item Updated",
        description: `${formData.name} has been updated.`,
      })

      onItemUpdated()
      onOpenChange(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Update Inventory Item</DialogTitle>
          <DialogDescription>
            Edit the details for this inventory item. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Item Name
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
                SKU
              </Label>
              <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <div className="col-span-3 space-y-2">
                <Input 
                  id="category" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange} 
                  placeholder="Enter category" 
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
                        onClick={() => handleCategorySelect(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price (Rs)
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
              <Label htmlFor="stock" className="text-right">
                Stock
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
                min="1"
                value={formData.reorderLevel}
                onChange={handleChange}
                className="col-span-3"
                required
              />
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
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 