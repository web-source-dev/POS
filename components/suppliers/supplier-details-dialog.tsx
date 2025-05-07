"use client"

import { format } from "date-fns"
import { Eye, Phone, Mail, MapPin, CreditCard, Calendar, Hash } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface Supplier {
  _id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  status: string;
  lastOrder: string | null;
  totalOrders: number;
  createdAt: string;
  updatedAt: string;
}

interface SupplierDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onEdit: () => void;
}

export function SupplierDetailsDialog({ open, onOpenChange, supplier, onEdit }: SupplierDetailsDialogProps) {
  if (!supplier) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{supplier.name}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                supplier.status === "Active"
                  ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-500 dark:hover:bg-green-900/30"
                  : supplier.status === "Inactive"
                    ? "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-500 dark:hover:bg-red-900/30"
                    : "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-500 dark:hover:bg-amber-900/30"
              }
            >
              {supplier.status}
            </Badge>
            <span>Supplier ID: {supplier._id}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-5 py-4">
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Contact Person</p>
              <p className="text-sm text-muted-foreground">{supplier.contact}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Phone</p>
              <p className="text-sm text-muted-foreground">{supplier.phone}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{supplier.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Address</p>
              <p className="text-sm text-muted-foreground">{supplier.address}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Payment Terms</p>
              <p className="text-sm text-muted-foreground">{supplier.paymentTerms}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Last Order</p>
              <p className="text-sm text-muted-foreground">{formatDate(supplier.lastOrder)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Total Orders</p>
              <p className="text-sm text-muted-foreground">{supplier.totalOrders}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground pt-2 border-t">
            <div>
              <p>Created: {formatDate(supplier.createdAt)}</p>
            </div>
            <div>
              <p>Updated: {formatDate(supplier.updatedAt)}</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onEdit}>
            Edit Supplier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 