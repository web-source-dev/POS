"use client"

import { useState } from "react"
import { CheckCircle, CalendarIcon, Plus, Minus, DatabaseIcon, TrendingUp, ArrowRight } from "lucide-react"

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
import { Separator } from "@/components/ui/separator"

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
  unitOfMeasure?: string
  measureValue?: string
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

  // Quick increment/decrement handlers
  const incrementStock = () => {
    const current = parseInt(stockChange) || 0;
    setStockChange((current + 1).toString());
  };

  const decrementStock = () => {
    const current = parseInt(stockChange) || 0;
    setStockChange((current - 1).toString());
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5 text-primary" />
            Update Stock
          </DialogTitle>
          <DialogDescription>
            {item && (
              <div className="mt-1">
                <span className="font-medium text-foreground">{item.name}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">Current stock:</span>
                  <span className="font-semibold text-sm">{item.stock}</span>
                  <span className="text-sm text-muted-foreground">SKU:</span>
                  <span className="font-semibold text-sm">{item.sku}</span>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Operation Type</Label>
              <RadioGroup
                value={operation}
                onValueChange={setOperation}
                className="flex flex-col space-y-2 rounded-lg border p-3 bg-muted/30"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="add" id="add" className="border-primary" />
                  <Label htmlFor="add" className="cursor-pointer font-medium flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5 text-green-600" />
                    <span>Add or subtract from current stock</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="set" id="set" className="border-primary" />
                  <Label htmlFor="set" className="cursor-pointer font-medium flex items-center gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                    <span>Set to specific value</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="stockChange" className="text-sm font-medium">
                {operation === "add" ? "Quantity to Add/Subtract" : "New Stock Value"}
              </Label>
              <div className="flex items-center gap-2">
                {operation === "add" && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10 rounded-full"
                    onClick={decrementStock}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
                <div className="relative flex-1">
                  <Input
                    id="stockChange"
                    type="number"
                    value={stockChange}
                    onChange={(e) => setStockChange(e.target.value)}
                    className={`text-center font-medium text-lg h-10 ${
                      operation === "add" && parseInt(stockChange) < 0 ? "text-red-600" : 
                      operation === "add" && parseInt(stockChange) > 0 ? "text-green-600" : ""
                    }`}
                    min={operation === "set" ? "0" : undefined}
                    placeholder={operation === "add" ? "Enter value" : "Enter new stock value"}
                    required
                  />
                  {operation === "add" && parseInt(stockChange) !== 0 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium">
                      {parseInt(stockChange) > 0 ? "+" : ""}
                    </div>
                  )}
                </div>
                {operation === "add" && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10 rounded-full"
                    onClick={incrementStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {operation === "add" && (
              <div className="rounded-lg border p-3 bg-muted/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    New Total:
                  </span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className={`font-medium ${
                      item && (item.stock + parseInt(stockChange || "0")) < 0 ? "text-red-600" :
                      item && (item.stock + parseInt(stockChange || "0")) <= item.reorderLevel ? "text-amber-600" :
                      "text-green-600"
                    }`}>
                      {item ? Math.max(0, item.stock + parseInt(stockChange || "0")) : 0}
                    </span>
                  </div>
                </div>
                {item && (item.stock + parseInt(stockChange || "0")) <= item.reorderLevel && (item.stock + parseInt(stockChange || "0")) > 0 && (
                  <p className="text-xs text-amber-600 mt-1">This will put the item below reorder level ({item.reorderLevel})</p>
                )}
                {item && (item.stock + parseInt(stockChange || "0")) <= 0 && (
                  <p className="text-xs text-red-600 mt-1">This will mark the item as out of stock</p>
                )}
              </div>
            )}
            
            <Separator className="my-1" />
            
            <div className="pt-2">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox 
                  id="updateExpiry" 
                  checked={updateExpiryDate}
                  onCheckedChange={(checked) => setUpdateExpiryDate(checked === true)}
                  className="border-primary data-[state=checked]:bg-primary/90"
                />
                <Label htmlFor="updateExpiry" className="cursor-pointer font-medium">
                  Update expiry date
                </Label>
              </div>
              
              {updateExpiryDate && (
                <div className="grid grid-cols-4 items-center gap-4 transition-all duration-200 ease-in-out">
                  <Label htmlFor="expiryDate" className="text-right text-sm">
                    Expiry Date
                  </Label>
                  <div className="col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal shadow-sm",
                            !expiryDate && "text-muted-foreground"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expiryDate ? format(expiryDate, "PPP") : "Select expiry date"}
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
          <DialogFooter className="pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="gap-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="gap-2 bg-primary/90 hover:bg-primary transition-colors"
            >
              {isSubmitting ? "Updating..." : (
                <>
                  <CheckCircle className="h-4 w-4" />
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