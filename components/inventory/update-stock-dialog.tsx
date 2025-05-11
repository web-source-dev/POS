"use client"

import { useState } from "react"
import { CheckCircle, CalendarIcon } from "lucide-react"

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
import { useToast } from "@/hooks/use-toast"
import { inventoryService } from "@/lib/inventory-service"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"

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
  expiryDate?: string | Date
}

interface UpdateStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStockUpdated: () => void
  item: InventoryItem | null
}

export function UpdateStockDialog({ open, onOpenChange, onStockUpdated, item }: UpdateStockDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stockChange, setStockChange] = useState("0")
  const [operation, setOperation] = useState("add") // "add" or "set"
  const [updateExpiryDate, setUpdateExpiryDate] = useState(false)
  const [expiryDate, setExpiryDate] = useState<Date | null>(null)
  
  // Reset the form when the dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && item?.expiryDate) {
      setExpiryDate(new Date(item.expiryDate));
    } else if (!newOpen) {
      // Reset form when closing
      setStockChange("0");
      setOperation("add");
      setUpdateExpiryDate(false);
      setExpiryDate(null);
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!item) return
    
    setIsSubmitting(true)

    try {
      // Calculate new stock value based on operation
      const change = parseInt(stockChange)
      const newStock = operation === "add" 
        ? item.stock + change 
        : change
      
      // Ensure stock doesn't go below 0
      if (newStock < 0) {
        throw new Error("Stock cannot be negative")
      }

      const updateData = {
        ...item,
        stock: newStock
      }
      
      // Add expiry date if needed
      if (updateExpiryDate && expiryDate) {
        updateData.expiryDate = expiryDate;
      }

      await inventoryService.updateItem(item._id, updateData)

      toast({
        title: "Stock Updated",
        description: `${item.name} stock ${operation === "add" ? "adjusted by" : "set to"} ${operation === "add" ? (change >= 0 ? "+" : "") + change : change}.${updateExpiryDate ? " Expiry date updated." : ""}`,
      })

      onStockUpdated()
      onOpenChange(false)
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update stock. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Stock</DialogTitle>
          <DialogDescription>
            {item && (
              <>
                Quickly update stock level for <span className="font-medium">{item.name}</span>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Operation</Label>
              <RadioGroup
                value={operation}
                onValueChange={setOperation}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="add" id="add" />
                  <Label htmlFor="add" className="cursor-pointer">
                    Add/Subtract from current stock ({item?.stock || 0})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="set" id="set" />
                  <Label htmlFor="set" className="cursor-pointer">
                    Set to specific value
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stockChange" className="text-right">
                {operation === "add" ? "Change" : "New Value"}
              </Label>
              <Input
                id="stockChange"
                type="number"
                value={stockChange}
                onChange={(e) => setStockChange(e.target.value)}
                className="col-span-3"
                min={operation === "set" ? "0" : undefined}
                placeholder={operation === "add" ? "Enter positive or negative value" : "Enter new stock value"}
                required
              />
            </div>
            
            {operation === "add" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right text-sm text-muted-foreground">
                  New Total:
                </div>
                <div className="col-span-3 text-sm font-medium">
                  {item ? item.stock + parseInt(stockChange || "0") : 0}
                </div>
              </div>
            )}
            
            <div className="mt-2 border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="updateExpiry" 
                  checked={updateExpiryDate}
                  onCheckedChange={(checked) => setUpdateExpiryDate(checked === true)}
                />
                <Label htmlFor="updateExpiry" className="cursor-pointer">
                  Update expiry date (for perishable items)
                </Label>
              </div>
              
              {updateExpiryDate && (
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
                            !expiryDate && "text-muted-foreground"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expiryDate ? format(expiryDate, "PPP") : "Set expiry date"}
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
                          selected={expiryDate || undefined}
                          onSelect={(date) => setExpiryDate(date || null)}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Update Stock
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 