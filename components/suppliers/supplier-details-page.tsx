"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Phone, Mail, MapPin, CreditCard, Calendar, Hash, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import supplierService from "@/services/supplierService"

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

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  imageUrl?: string;
}

export function SupplierDetailsPage({ supplierId }: { supplierId: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [supplierInventory, setSupplierInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inventoryLoading, setInventoryLoading] = useState(true)

  useEffect(() => {
    const fetchSupplierDetails = async () => {
      setIsLoading(true)
      try {
        const data = await supplierService.getSupplierById(supplierId)
        setSupplier(data as Supplier)
      } catch (error) {
        console.error("Error fetching supplier details:", error)
        toast({
          title: "Error",
          description: "Failed to load supplier details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    const fetchSupplierInventory = async () => {
      setInventoryLoading(true)
      try {
        const data = await supplierService.getSupplierInventory(supplierId)
        setSupplierInventory(data as InventoryItem[])
      } catch (error) {
        console.error("Error fetching supplier inventory:", error)
        toast({
          title: "Error",
          description: "Failed to load inventory items for this supplier.",
          variant: "destructive",
        })
      } finally {
        setInventoryLoading(false)
      }
    }

    if (supplierId) {
      fetchSupplierDetails()
      fetchSupplierInventory()
    }
  }, [supplierId, toast])

  const handleBackToSuppliers = () => {
    router.push("/suppliers")
  }

  const handleViewInventoryItem = (itemId: string) => {
    router.push(`/inventory/view/${itemId}`)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    
    try {
      const date = new Date(dateString)
      return format(date, "MMM d, yyyy")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={handleBackToSuppliers}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Suppliers
          </Button>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={handleBackToSuppliers}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Suppliers
          </Button>
        </div>
        <div className="flex justify-center items-center h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Supplier Not Found</h2>
            <p className="text-muted-foreground">The supplier you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to view it.</p>
            <Button className="mt-4" onClick={handleBackToSuppliers}>
              Return to Suppliers List
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={handleBackToSuppliers}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Suppliers
          </Button>
        </div>
        <div>
          <Button variant="outline" onClick={() => router.push(`/suppliers/edit/${supplierId}`)}>
            Edit Supplier
          </Button>
        </div>
      </div>

      {/* Supplier Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
        <div className="flex items-center gap-2 mt-1">
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
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Items ({supplierInventory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supplier Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Complete details about this supplier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-[25px_1fr] items-start gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{supplier.email}</p>
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
              </CardContent>
            </Card>

            {/* Order History Card */}
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Order history and supplier information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Created: {formatDate(supplier.createdAt)}</p>
                  <p className="text-sm text-muted-foreground">Updated: {formatDate(supplier.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory from {supplier.name}</CardTitle>
              <CardDescription>Items supplied by this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : supplierInventory.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No inventory items found from this supplier.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierInventory.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>{item.stock}</TableCell>
                        <TableCell>
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => handleViewInventoryItem(item._id)}
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 