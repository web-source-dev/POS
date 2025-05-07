"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowUpDown, Download, Filter, MoreHorizontal, Plus, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddSupplierDialog } from "@/components/suppliers/add-supplier-dialog"
import { EditSupplierDialog } from "@/components/suppliers/edit-supplier-dialog"
import { SupplierDetailsDialog } from "@/components/suppliers/supplier-details-dialog"
import { useToast } from "@/hooks/use-toast"
import supplierService from "@/services/supplierService"

// Define Supplier type
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

export function SuppliersPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [addSupplierDialogOpen, setAddSupplierDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Selected supplier state for view and edit
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await supplierService.getAllSuppliers()
      setSuppliers(data as Supplier[])
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to load suppliers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Load suppliers on component mount
  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers((prev) => [...prev, newSupplier])
  }

  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(suppliers.map(s => s._id === updatedSupplier._id ? updatedSupplier : s))
    setSelectedSupplier(updatedSupplier)
  }

  const handleViewDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setViewDetailsOpen(true)
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setEditDialogOpen(true)
  }

  const handleEditFromDetails = () => {
    setViewDetailsOpen(false)
    setEditDialogOpen(true)
  }

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active"
    
    try {
      await supplierService.updateSupplierStatus(id, newStatus)
      
      // Update the suppliers list
      const updatedSuppliers = suppliers.map((s) => 
        s._id === id ? { ...s, status: newStatus } : s
      )
      setSuppliers(updatedSuppliers)
      
      // If this is the currently selected supplier, update it too
      if (selectedSupplier && selectedSupplier._id === id) {
        setSelectedSupplier({ ...selectedSupplier, status: newStatus })
      }
      
      toast({
        title: newStatus === "Active" ? "Supplier Activated" : "Supplier Deactivated",
        description: `Supplier has been ${newStatus === "Active" ? "activated" : "deactivated"}.`,
      })
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update supplier status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    // Generate CSV from suppliers
    const headers = ["Name", "Contact", "Email", "Phone", "Address", "Status", "Payment Terms"]
    const csvContent = [
      headers.join(","),
      ...suppliers.map(s => [
        `"${s.name}"`,
        `"${s.contact}"`,
        `"${s.email}"`,
        `"${s.phone}"`,
        `"${s.address}"`,
        `"${s.status}"`,
        `"${s.paymentTerms}"`
      ].join(","))
    ].join("\n")
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `suppliers-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Export Complete",
      description: "Your supplier data has been exported to CSV.",
    })
  }


  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Supplier Management</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setAddSupplierDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all-suppliers" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all-suppliers">All Suppliers</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search suppliers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Select defaultValue="all" value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all-suppliers">
          <Card>
            <CardHeader className="p-4">
              <CardTitle>All Suppliers</CardTitle>
              <CardDescription>Manage your supplier relationships and information</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">
                      <div className="flex items-center space-x-1">
                        <span>Supplier Name</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Loading suppliers...
                      </TableCell>
                    </TableRow>
                  ) : filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {searchTerm || statusFilter !== "all" 
                          ? "No suppliers match your search criteria." 
                          : "No suppliers found. Add your first supplier using the button above."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier._id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-xs text-muted-foreground">{supplier.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{supplier.contact}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>{supplier.paymentTerms}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewDetails(supplier)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditSupplier(supplier)}>
                                Edit Supplier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleStatusChange(supplier._id, supplier.status)}
                              >
                                {supplier.status === "Active" ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Suppliers</CardTitle>
              <CardDescription>Currently active supplier accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Supplier Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Loading suppliers...
                      </TableCell>
                    </TableRow>
                  ) : filteredSuppliers.filter(supplier => supplier.status === "Active").length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No active suppliers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers
                      .filter((supplier) => supplier.status === "Active")
                      .map((supplier) => (
                        <TableRow key={supplier._id}>
                          <TableCell className="font-medium">
                            <div>
                              <p className="font-medium">{supplier.name}</p>
                              <p className="text-xs text-muted-foreground">{supplier.address}</p>
                            </div>
                          </TableCell>
                          <TableCell>{supplier.contact}</TableCell>
                          <TableCell>{supplier.phone}</TableCell>
                          <TableCell>{supplier.email}</TableCell>
                          <TableCell>{supplier.paymentTerms}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => handleEditSupplier(supplier)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Supplier Dialog */}
      <AddSupplierDialog
        open={addSupplierDialogOpen}
        onOpenChange={setAddSupplierDialogOpen}
        onSupplierAdded={handleAddSupplier}
      />

      {/* View Supplier Details Dialog */}
      <SupplierDetailsDialog 
        open={viewDetailsOpen}
        onOpenChange={setViewDetailsOpen}
        supplier={selectedSupplier}
        onEdit={handleEditFromDetails}
      />

      {/* Edit Supplier Dialog */}
      <EditSupplierDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        supplier={selectedSupplier}
        onSupplierUpdated={handleUpdateSupplier}
      />
    </div>
  )
}
