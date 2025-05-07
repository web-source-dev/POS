import { useEffect, useState, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  addTaxRecord, 
  deleteTaxRecord, 
  getTaxRecords, 
  updateTaxRecord 
} from "@/services/taxService";
import { Pencil, Trash2, Plus, Filter, CreditCard } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import TaxPayment from "./TaxPayment";
import { TaxRecord } from "@/types/tax";

// Define filter params interface
interface FilterParams {
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
  [key: string]: string | undefined;
}

const TaxRecords = () => {
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TaxRecord | null>(null);
  const [showHelpInfo, setShowHelpInfo] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    type: "Income Tax" as "Income Tax" | "Sales Tax" | "Zakat" | "Custom Tax" | "Advance Tax",
    taxableAmount: "",
    taxRate: "",
    taxAmount: "",
    description: "",
    paymentStatus: "Pending" as "Paid" | "Pending" | "Partially Paid" | "Exempt",
    paidAmount: "0",
    paymentDate: null as Date | null,
    paymentMethod: "Cash" as "Cash" | "Bank Transfer" | "Check" | "Online" | "Other",
    taxPeriod: {
      startDate: new Date(),
      endDate: new Date()
    },
    reference: "",
    isManualEntry: true,
    isFinalAssessment: false
  });

  // Filter state
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    type: "",
    status: ""
  });
  
  const fetchTaxRecords = useCallback(async () => {
    try {
      setLoading(true);
      // Prepare filter params
      const params: FilterParams = {};
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();
      if (filters.type && filters.type !== "all") params.type = filters.type;
      if (filters.status && filters.status !== "all") params.status = filters.status;
      
      const data = await getTaxRecords(params);
      setTaxRecords(data);
    } catch (error) {
      console.error("Error fetching tax records:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  useEffect(() => {
    fetchTaxRecords();
  }, [fetchTaxRecords]);
  
  const handleAddRecord = async () => {
    try {
      // Calculate tax amount if empty
      if (!formData.taxAmount && formData.taxableAmount && formData.taxRate) {
        const calculatedTaxAmount = (
          parseFloat(formData.taxableAmount) * 
          parseFloat(formData.taxRate) / 100
        ).toFixed(2);
        formData.taxAmount = calculatedTaxAmount;
      }
      
      // Ensure both start and end dates are set
      if (!formData.taxPeriod.startDate || !formData.taxPeriod.endDate) {
        alert("Please select both start and end dates for the tax period.");
        return;
      }
      
      await addTaxRecord({
        ...formData,
        taxableAmount: parseFloat(formData.taxableAmount),
        taxRate: parseFloat(formData.taxRate),
        taxAmount: parseFloat(formData.taxAmount),
        paidAmount: parseFloat(formData.paidAmount || "0")
      });
      
      // Close dialog and refresh records
      setIsAddDialogOpen(false);
      resetFormData();
      fetchTaxRecords();
    } catch (error) {
      console.error("Error adding tax record:", error);
      alert("Failed to add tax record. Please try again.");
    }
  };
  
  const handleEditRecord = async () => {
    if (!selectedRecord) return;
    
    try {
      // Calculate tax amount if empty
      if (!formData.taxAmount && formData.taxableAmount && formData.taxRate) {
        const calculatedTaxAmount = (
          parseFloat(formData.taxableAmount) * 
          parseFloat(formData.taxRate) / 100
        ).toFixed(2);
        formData.taxAmount = calculatedTaxAmount;
      }
      
      await updateTaxRecord(selectedRecord._id, {
        ...formData,
        taxableAmount: parseFloat(formData.taxableAmount),
        taxRate: parseFloat(formData.taxRate),
        taxAmount: parseFloat(formData.taxAmount),
        paidAmount: parseFloat(formData.paidAmount || "0")
      });
      
      // Close dialog and refresh records
      setIsEditDialogOpen(false);
      setSelectedRecord(null);
      resetFormData();
      fetchTaxRecords();
    } catch (error) {
      console.error("Error updating tax record:", error);
      alert("Failed to update tax record. Please try again.");
    }
  };
  
  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;
    
    try {
      await deleteTaxRecord(selectedRecord._id);
      
      // Close dialog and refresh records
      setIsDeleteDialogOpen(false);
      setSelectedRecord(null);
      fetchTaxRecords();
    } catch (error) {
      console.error("Error deleting tax record:", error);
      alert("Failed to delete tax record. Please try again.");
    }
  };
  
  const resetFormData = () => {
    setFormData({
      type: "Income Tax" as "Income Tax" | "Sales Tax" | "Zakat" | "Custom Tax" | "Advance Tax",
      taxableAmount: "",
      taxRate: "",
      taxAmount: "",
      description: "",
      paymentStatus: "Pending" as "Paid" | "Pending" | "Partially Paid" | "Exempt",
      paidAmount: "0",
      paymentDate: null,
      paymentMethod: "Cash" as "Cash" | "Bank Transfer" | "Check" | "Online" | "Other",
      taxPeriod: {
        startDate: new Date(),
        endDate: new Date()
      },
      reference: "",
      isManualEntry: true,
      isFinalAssessment: false
    });
  };
  
  const openEditDialog = (record: TaxRecord) => {
    setSelectedRecord(record);
    
    // Populate form data with selected record
    setFormData({
      type: record.type,
      taxableAmount: record.taxableAmount.toString(),
      taxRate: record.taxRate.toString(),
      taxAmount: record.taxAmount.toString(),
      description: record.description || "",
      paymentStatus: record.paymentStatus,
      paidAmount: record.paidAmount.toString(),
      paymentDate: record.paymentDate ? new Date(record.paymentDate) : null,
      paymentMethod: record.paymentMethod,
      taxPeriod: {
        startDate: new Date(record.taxPeriod.startDate),
        endDate: new Date(record.taxPeriod.endDate)
      },
      reference: record.reference || "",
      isManualEntry: record.isManualEntry,
      isFinalAssessment: record.isFinalAssessment
    });
    
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (record: TaxRecord) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle tax amount calculation when taxable amount or tax rate changes
  const handleTaxableAmountChange = (value: string) => {
    setFormData({
      ...formData,
      taxableAmount: value,
      taxAmount: value && formData.taxRate 
        ? ((parseFloat(value) * parseFloat(formData.taxRate)) / 100).toFixed(2)
        : formData.taxAmount
    });
  };
  
  const handleTaxRateChange = (value: string) => {
    setFormData({
      ...formData,
      taxRate: value,
      taxAmount: value && formData.taxableAmount 
        ? ((parseFloat(formData.taxableAmount) * parseFloat(value)) / 100).toFixed(2)
        : formData.taxAmount
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    fetchTaxRecords();
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      type: "all",
      status: "all"
    });
    
    // Fetch records without filters
    setTimeout(() => {
      fetchTaxRecords();
    }, 0);
  };
  
  // Open payment dialog
  const openPaymentDialog = (record: TaxRecord) => {
    setSelectedRecord(record);
    setIsPaymentDialogOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tax Records</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Tax Record
        </Button>
      </div>
      
      {/* Info Card */}
      {showHelpInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-medium">How to Update Tax Payments</h3>
                <p className="text-sm text-muted-foreground">
                  To record a payment for any outstanding tax:
                </p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>Click the <CreditCard className="h-3 w-3 inline mx-1" /> payment button next to a tax record to make a partial or full payment</li>
                  <li>Or click the <Pencil className="h-3 w-3 inline mx-1" /> edit button to directly update the payment status, amount, and date</li>
                  <li>When a tax is fully paid, its status will automatically change to Paid</li>
                </ul>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowHelpInfo(false)}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Filter section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Filter tax records by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    {filters.startDate ? (
                      format(filters.startDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.startDate || undefined}
                    onSelect={(date) => setFilters({ ...filters, startDate: date || null })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    {filters.endDate ? (
                      format(filters.endDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.endDate || undefined}
                    onSelect={(date) => setFilters({ ...filters, endDate: date || null })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Tax Type</Label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tax type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Income Tax">Income Tax</SelectItem>
                  <SelectItem value="Sales Tax">Sales Tax</SelectItem>
                  <SelectItem value="Zakat">Zakat</SelectItem>
                  <SelectItem value="Custom Tax">Custom Tax</SelectItem>
                  <SelectItem value="Advance Tax">Advance Tax</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Exempt">Exempt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4 space-x-2">
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button onClick={applyFilters}>
              <Filter className="h-4 w-4 mr-2" /> Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Tax records table */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Records List</CardTitle>
          <CardDescription>View and manage your tax records</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <p>Loading tax records...</p>
            </div>
          ) : taxRecords.length === 0 ? (
            <div className="flex flex-col justify-center items-center min-h-[200px] space-y-4">
              <p className="text-muted-foreground">No tax records found.</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Your First Tax Record
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tax ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount (Rs.)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid (Rs.)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxRecords.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell className="font-medium">{record.taxId}</TableCell>
                      <TableCell>{record.type}</TableCell>
                      <TableCell>
                        {record.periodStartFormatted} - {record.periodEndFormatted}
                      </TableCell>
                      <TableCell>
                        {record.taxAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          record.paymentStatus === 'Paid' ? 'default' : 
                          record.paymentStatus === 'Pending' ? 'secondary' : 
                          record.paymentStatus === 'Partially Paid' ? 'outline' : 
                          'destructive'
                        }>
                          {record.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.paidAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {record.paymentStatus !== 'Paid' && record.paymentStatus !== 'Exempt' && (
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => openPaymentDialog(record)}
                              title="Make Payment"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => openEditDialog(record)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(record)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add Tax Record Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Tax Record</DialogTitle>
            <DialogDescription>
              Enter the details for the new tax record
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Tax Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Tax Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value as "Income Tax" | "Sales Tax" | "Zakat" | "Custom Tax" | "Advance Tax" })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select tax type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income Tax">Income Tax</SelectItem>
                  <SelectItem value="Sales Tax">Sales Tax</SelectItem>
                  <SelectItem value="Zakat">Zakat</SelectItem>
                  <SelectItem value="Custom Tax">Custom Tax</SelectItem>
                  <SelectItem value="Advance Tax">Advance Tax</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Taxable Amount */}
            <div className="space-y-2">
              <Label htmlFor="taxableAmount">Taxable Amount (Rs.)</Label>
              <Input 
                id="taxableAmount" 
                type="number" 
                placeholder="Enter taxable amount" 
                value={formData.taxableAmount}
                onChange={(e) => handleTaxableAmountChange(e.target.value)}
              />
            </div>
            
            {/* Tax Rate */}
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input 
                id="taxRate" 
                type="number" 
                placeholder="Enter tax rate" 
                value={formData.taxRate}
                onChange={(e) => handleTaxRateChange(e.target.value)}
              />
            </div>
            
            {/* Tax Amount */}
            <div className="space-y-2">
              <Label htmlFor="taxAmount">Tax Amount (Rs.)</Label>
              <Input 
                id="taxAmount" 
                type="number" 
                placeholder="Enter tax amount" 
                value={formData.taxAmount}
                onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
              />
            </div>
            
            {/* Tax Period Start */}
            <div className="space-y-2">
              <Label htmlFor="periodStart">Period Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="periodStart"
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    {formData.taxPeriod.startDate ? (
                      format(formData.taxPeriod.startDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.taxPeriod.startDate}
                    onSelect={(date) => date && setFormData({
                      ...formData,
                      taxPeriod: {
                        ...formData.taxPeriod,
                        startDate: date
                      }
                    })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Tax Period End */}
            <div className="space-y-2">
              <Label htmlFor="periodEnd">Period End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="periodEnd"
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    {formData.taxPeriod.endDate ? (
                      format(formData.taxPeriod.endDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.taxPeriod.endDate}
                    onSelect={(date) => date && setFormData({
                      ...formData,
                      taxPeriod: {
                        ...formData.taxPeriod,
                        endDate: date
                      }
                    })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Payment Status */}
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select 
                value={formData.paymentStatus} 
                onValueChange={(value) => setFormData({ ...formData, paymentStatus: value as "Paid" | "Pending" | "Partially Paid" | "Exempt" })}
              >
                <SelectTrigger id="paymentStatus">
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Exempt">Exempt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Paid Amount */}
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid Amount (Rs.)</Label>
              <Input 
                id="paidAmount" 
                type="number" 
                placeholder="Enter amount paid" 
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                disabled={formData.paymentStatus === "Pending" || formData.paymentStatus === "Exempt"}
              />
            </div>
            
            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="paymentDate"
                    variant="outline"
                    className="w-full justify-start text-left"
                    disabled={formData.paymentStatus === "Pending" || formData.paymentStatus === "Exempt"}
                  >
                    {formData.paymentDate ? (
                      format(formData.paymentDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.paymentDate || undefined}
                    onSelect={(date) => setFormData({
                      ...formData,
                      paymentDate: date || null
                    })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select 
                value={formData.paymentMethod} 
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as "Cash" | "Bank Transfer" | "Check" | "Online" | "Other" })}
                disabled={formData.paymentStatus === "Pending" || formData.paymentStatus === "Exempt"}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Reference */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reference">Reference</Label>
              <Input 
                id="reference" 
                placeholder="Enter reference number or details" 
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
            
            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter tax description" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            {/* Additional Options */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="finalAssessment" 
                  checked={formData.isFinalAssessment}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    isFinalAssessment: !!checked 
                  })}
                />
                <Label htmlFor="finalAssessment">This is a final tax assessment</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRecord}>Add Tax Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Tax Record Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Tax Record</DialogTitle>
            <DialogDescription>
              Update the details for this tax record
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Tax Type */}
            <div className="space-y-2">
              <Label htmlFor="edit-type">Tax Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value as "Income Tax" | "Sales Tax" | "Zakat" | "Custom Tax" | "Advance Tax" })}
              >
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Select tax type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income Tax">Income Tax</SelectItem>
                  <SelectItem value="Sales Tax">Sales Tax</SelectItem>
                  <SelectItem value="Zakat">Zakat</SelectItem>
                  <SelectItem value="Custom Tax">Custom Tax</SelectItem>
                  <SelectItem value="Advance Tax">Advance Tax</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-taxableAmount">Taxable Amount (Rs.)</Label>
              <Input 
                id="edit-taxableAmount" 
                type="number" 
                placeholder="Enter taxable amount" 
                value={formData.taxableAmount}
                onChange={(e) => handleTaxableAmountChange(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-taxRate">Tax Rate (%)</Label>
              <Input 
                id="edit-taxRate" 
                type="number" 
                placeholder="Enter tax rate" 
                value={formData.taxRate}
                onChange={(e) => handleTaxRateChange(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-taxAmount">Tax Amount (Rs.)</Label>
              <Input 
                id="edit-taxAmount" 
                type="number" 
                placeholder="Enter tax amount" 
                value={formData.taxAmount}
                onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
              />
            </div>
            
            {/* Tax Period Start */}
            <div className="space-y-2">
              <Label htmlFor="edit-periodStart">Period Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="edit-periodStart"
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    {formData.taxPeriod.startDate ? (
                      format(formData.taxPeriod.startDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.taxPeriod.startDate}
                    onSelect={(date) => date && setFormData({
                      ...formData,
                      taxPeriod: {
                        ...formData.taxPeriod,
                        startDate: date
                      }
                    })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Tax Period End */}
            <div className="space-y-2">
              <Label htmlFor="edit-periodEnd">Period End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="edit-periodEnd"
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    {formData.taxPeriod.endDate ? (
                      format(formData.taxPeriod.endDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.taxPeriod.endDate}
                    onSelect={(date) => date && setFormData({
                      ...formData,
                      taxPeriod: {
                        ...formData.taxPeriod,
                        endDate: date
                      }
                    })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Payment section */}
            <div className="md:col-span-2 mt-4">
              <Separator className="mb-4" />
              <h3 className="text-lg font-medium mb-4">Payment Information</h3>
            </div>
            
            {/* Payment Status */}
            <div className="space-y-2">
              <Label htmlFor="edit-paymentStatus">Payment Status</Label>
              <Select 
                value={formData.paymentStatus} 
                onValueChange={(value) => {
                  const newStatus = value as "Paid" | "Pending" | "Partially Paid" | "Exempt";
                  
                  // Auto-adjust paid amount when changing status to certain values
                  let newPaidAmount = formData.paidAmount;
                  let newPaymentDate = formData.paymentDate;
                  
                  if (newStatus === "Paid") {
                    // Set paid amount to tax amount if paid
                    newPaidAmount = formData.taxAmount;
                    // Set payment date to today if not already set
                    if (!newPaymentDate) newPaymentDate = new Date();
                  } else if (newStatus === "Pending") {
                    // Clear paid amount and date if pending
                    newPaidAmount = "0";
                    newPaymentDate = null;
                  } else if (newStatus === "Exempt") {
                    // Clear paid amount if exempt
                    newPaidAmount = "0";
                    newPaymentDate = null;
                  }
                  
                  setFormData({ 
                    ...formData, 
                    paymentStatus: newStatus,
                    paidAmount: newPaidAmount,
                    paymentDate: newPaymentDate
                  });
                }}
              >
                <SelectTrigger id="edit-paymentStatus">
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Exempt">Exempt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Paid Amount */}
            <div className="space-y-2">
              <Label htmlFor="edit-paidAmount">Paid Amount (Rs.)</Label>
              <Input 
                id="edit-paidAmount" 
                type="number" 
                placeholder="Enter amount paid" 
                value={formData.paidAmount}
                onChange={(e) => {
                  const newPaidAmount = e.target.value;
                  let newStatus = formData.paymentStatus;
                  
                  // Update payment status based on paid amount
                  if (parseFloat(newPaidAmount) >= parseFloat(formData.taxAmount)) {
                    newStatus = "Paid";
                  } else if (parseFloat(newPaidAmount) > 0) {
                    newStatus = "Partially Paid";
                  } else if (parseFloat(newPaidAmount) === 0) {
                    newStatus = "Pending";
                  }
                  
                  setFormData({ 
                    ...formData, 
                    paidAmount: newPaidAmount,
                    paymentStatus: newStatus
                  });
                }}
                disabled={formData.paymentStatus === "Pending" || formData.paymentStatus === "Exempt"}
              />
              
              {formData.paymentStatus === "Partially Paid" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Remaining: Rs. {(parseFloat(formData.taxAmount) - parseFloat(formData.paidAmount || "0")).toLocaleString()}
                </p>
              )}
            </div>
            
            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="edit-paymentDate">Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="edit-paymentDate"
                    variant="outline"
                    className="w-full justify-start text-left"
                    disabled={formData.paymentStatus === "Pending" || formData.paymentStatus === "Exempt"}
                  >
                    {formData.paymentDate ? (
                      format(formData.paymentDate, "PPP")
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.paymentDate || undefined}
                    onSelect={(date) => setFormData({
                      ...formData,
                      paymentDate: date || null
                    })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="edit-paymentMethod">Payment Method</Label>
              <Select 
                value={formData.paymentMethod} 
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as "Cash" | "Bank Transfer" | "Check" | "Online" | "Other" })}
                disabled={formData.paymentStatus === "Pending" || formData.paymentStatus === "Exempt"}
              >
                <SelectTrigger id="edit-paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Reference */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-reference">Reference</Label>
              <Input 
                id="edit-reference" 
                placeholder="Enter reference number or details" 
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
            
            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                placeholder="Enter tax description" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            {/* Additional Options */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-finalAssessment" 
                  checked={formData.isFinalAssessment}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    isFinalAssessment: !!checked 
                  })}
                />
                <Label htmlFor="edit-finalAssessment">This is a final tax assessment</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRecord}>Update Tax Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tax record 
              {selectedRecord ? ` &quot;${selectedRecord.taxId}&quot;` : ""}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Tax Payment Dialog */}
      <TaxPayment 
        isOpen={isPaymentDialogOpen} 
        onClose={() => setIsPaymentDialogOpen(false)} 
        taxRecord={selectedRecord} 
        onPaymentComplete={fetchTaxRecords} 
      />
    </div>
  );
};

export default TaxRecords; 