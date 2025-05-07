"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ArrowUpDown,
  Banknote,
  Calendar,
  CreditCard,
  Download,
  MoreHorizontal,
  Plus,
  Printer,
  Receipt,
  Search,
  Loader2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import financeService from "@/services/financeService"
import { useAuth } from "@/lib/auth"

// Define types
interface Transaction {
  id: string
  date: string
  type: string
  reference: string
  amount: number
  paymentMethod: string
  status: string
  originalData?: Record<string, unknown>
}

interface Expense {
  id: string
  expenseId?: string
  displayId?: string
  date: string
  category: string
  description: string
  amount: number
  paymentMethod: string
  status: string
  originalData?: Record<string, unknown>
}

// Add ExpenseFormData interface
interface ExpenseFormData {
  category: string
  description: string
  amount: string
  paymentMethod: string
  date: string
}

interface FinancialSummary {
  cashBalance: number
  lastUpdated: string
  todaySales: {
    amount: number
    count: number
  }
  todayExpenses: {
    amount: number
    count: number
  }
  todayNetCashFlow: number
}

interface CashDrawerData {
  currentBalance: number
  openingBalance: number
  cashSales: number
  cashExpenses: number
  expectedBalance: number
  recentOperations: CashOperation[]
}

// Add CashOperation interface
interface CashOperation {
  type: 'add' | 'remove' | 'close';
  amount?: number;
  reason?: string;
}

// Add Expense Dialog Component
function AddExpenseDialog({ 
  open, 
  onOpenChange, 
  onExpenseAdded 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onExpenseAdded: (expenseData: ExpenseFormData) => Promise<boolean>;
}) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expenseData, setExpenseData] = useState<ExpenseFormData>({
    category: "Utilities",
    description: "",
    amount: "",
    paymentMethod: "Cash",
    date: new Date().toISOString().split('T')[0]
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setExpenseData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setExpenseData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expenseData.category || !expenseData.amount || isNaN(parseFloat(expenseData.amount)) || parseFloat(expenseData.amount) <= 0) {
      toast({
        title: "Invalid input",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the parent's expense handler function with our form data
      const success = await onExpenseAdded(expenseData);
      
      if (success) {
        // Reset form
        setExpenseData({
          category: "Utilities",
          description: "",
          amount: "",
          paymentMethod: "Cash",
          date: new Date().toISOString().split('T')[0]
        });
        
        // Close dialog
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      
      // Display more specific error message if available
      const errorMessage = error instanceof Error ? error.message : "Failed to add expense. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    // Ensure we reset form data before closing
    setExpenseData({
      category: "Utilities",
      description: "",
      amount: "",
      paymentMethod: "Cash",
      date: new Date().toISOString().split('T')[0]
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent 
        className="sm:max-w-[550px]" 
        onPointerDownOutside={(e) => {
          // Prevent unexpected behavior when clicking outside
          e.preventDefault()
        }}
        onEscapeKeyDown={() => handleCloseDialog()}
      >
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Enter the expense details below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category*
              </Label>
              <Select 
                value={expenseData.category}
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Rent">Rent</SelectItem>
                  <SelectItem value="Salaries">Salaries</SelectItem>
                  <SelectItem value="Inventory">Inventory</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount*
              </Label>
              <Input 
                id="amount"
                name="amount"
                type="number" 
                placeholder="0.00" 
                min="0.01" 
                step="0.01"
                value={expenseData.amount}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentMethod" className="text-right">
                Payment Method
              </Label>
              <Select 
                value={expenseData.paymentMethod}
                onValueChange={(value) => handleSelectChange('paymentMethod', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input 
                id="date"
                name="date"
                type="date" 
                value={expenseData.date}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea 
                id="description"
                name="description"
                placeholder="Enter expense description" 
                value={expenseData.description}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Transaction Details Dialog
function TransactionDetailsDialog({ 
  open, 
  onOpenChange, 
  transaction 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  transaction: Transaction | null;
}) {
  if (!transaction) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  const handlePrintReceipt = () => {
    // Implement receipt printing functionality
    // This could open a new window with a printable receipt
    window.alert('Printing receipt...')
    // In a real implementation, you would redirect to a receipt page or open a print dialog
  }

  const handleCloseDialog = () => {
    // Clean up before closing
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent 
        className="sm:max-w-[600px]" 
        onPointerDownOutside={(e) => {
          // Prevent unexpected behavior when clicking outside
          e.preventDefault();
        }}
        onEscapeKeyDown={() => handleCloseDialog()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Transaction Details</DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className={
                transaction.status === "Completed" || transaction.status === "Paid"
                  ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-500 dark:hover:bg-green-900/30"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-500 dark:hover:bg-amber-900/30"
              }
            >
              {transaction.status}
            </Badge>
            <DialogDescription>
              Transaction ID: {transaction.id}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="grid gap-5 py-4">
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Date & Time</p>
              <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Type</p>
              <p className="text-sm text-muted-foreground">{transaction.type}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Payment Method</p>
              <p className="text-sm text-muted-foreground">{transaction.paymentMethod}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Amount</p>
              <p className={`text-sm font-medium ${transaction.amount < 0 ? "text-red-500" : "text-green-500"}`}>
                {transaction.amount < 0 ? "-" : ""}PKR {Math.abs(transaction.amount).toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <Banknote className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Reference</p>
              <p className="text-sm text-muted-foreground">{transaction.reference}</p>
            </div>
          </div>
          
          {transaction.originalData && (
            <div className="mt-4 pt-4 border-t">
              <p className="font-medium mb-2">Additional Information</p>
              <div className="text-sm">
                {Object.entries(transaction.originalData)
                  .filter(([key]) => !['id', 'date', 'type', 'reference', 'amount', 'paymentMethod', 'status'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1">
                      <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          {transaction.type === "Sale" && (
            <Button 
              variant="outline" 
              onClick={handlePrintReceipt}
              className="mr-auto"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          )}
          <Button onClick={handleCloseDialog}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Expense Details Dialog
function ExpenseDetailsDialog({ 
  open, 
  onOpenChange, 
  expense 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  expense: Expense | null;
}) {
  if (!expense) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  const handleCloseDialog = () => {
    // Clean up before closing
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent 
        className="sm:max-w-[600px]" 
        onPointerDownOutside={(e) => {
          // Prevent unexpected behavior when clicking outside
          e.preventDefault();
        }}
        onEscapeKeyDown={() => handleCloseDialog()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Expense Details</DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-500 dark:hover:bg-green-900/30"
            >
              {expense.status}
            </Badge>
            <DialogDescription>
              Expense ID: {expense.displayId || expense.expenseId || expense.id}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="grid gap-5 py-4">
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Date</p>
              <p className="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Amount</p>
              <p className="text-sm font-medium">PKR {expense.amount.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Category</p>
              <p className="text-sm text-muted-foreground">{expense.category}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-[25px_1fr] items-start gap-2">
            <Banknote className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Payment Method</p>
              <p className="text-sm text-muted-foreground">{expense.paymentMethod}</p>
            </div>
          </div>
          
          {expense.description && (
            <div className="grid grid-cols-[25px_1fr] items-start gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Description</p>
                <p className="text-sm text-muted-foreground">{expense.description}</p>
              </div>
            </div>
          )}
          
          {expense.originalData && (
            <div className="mt-4 pt-4 border-t">
              <p className="font-medium mb-2">Additional Information</p>
              <div className="text-sm">
                {Object.entries(expense.originalData)
                  .filter(([key]) => !['id', 'expenseId', 'displayId', 'date', 'category', 'description', 'amount', 'paymentMethod', 'status'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1">
                      <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={handleCloseDialog}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FinancePage() {
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  
  // Helper to get first day of current year
  const getFirstDayOfYear = () => {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1); // January 1st of current year
  };
  
  // Component state
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [cashDrawerData, setCashDrawerData] = useState<CashDrawerData | null>(null)
  const [operationType, setOperationType] = useState("add")
  const [operationAmount, setOperationAmount] = useState("")
  const [operationReason, setOperationReason] = useState("")
  // Set date range to current year
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | { from: Date; to?: Date } | undefined>({
    from: getFirstDayOfYear(),
    to: new Date(),
  })
  const [transactionType, setTransactionType] = useState("all")
  
  // Modal states
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [transactionDetailsOpen, setTransactionDetailsOpen] = useState(false)
  const [expenseDetailsOpen, setExpenseDetailsOpen] = useState(false)
  

  const fetchTransactions = useCallback(async () => {
    try {
      const params: {
        startDate?: string;
        endDate?: string;
        type?: string;
      } = {}
      
      // Add date range filter
      if (dateRange?.from) {
        params.startDate = dateRange.from.toISOString()
      }
      if (dateRange?.to) {
        params.endDate = dateRange.to.toISOString()
      }
      
      // Add transaction type filter
      if (transactionType !== 'all') {
        params.type = transactionType
      }
      
      const data = await financeService.getTransactions(params as { startDate: string; endDate: string; type: string })
      setTransactions(data)
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load transactions. Please try again.",
        variant: "destructive",
      })
    }
  }, [dateRange, transactionType, toast])

  const fetchFinancialData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch summary data (still keep this as today for the summary cards)
      const summaryData = await financeService.getFinancialSummary({ period: 'today' })
      setSummary(summaryData as FinancialSummary)
      
      // Fetch transactions
      await fetchTransactions()
      
      // Fetch expenses
      const expensesData = await financeService.getExpenses()
      setExpenses(expensesData)
      
      // Fetch cash drawer data
      const drawerData = await financeService.getCashDrawerData()
      setCashDrawerData(drawerData as CashDrawerData)
    } catch (error) {
      console.error("Error loading financial data:", error)
      toast({
        title: "Error",
        description: "Failed to load financial data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      
      // Make sure to reset dialog states to prevent any overlay issues
      setTransactionDetailsOpen(false)
      setExpenseDetailsOpen(false)
      setAddExpenseDialogOpen(false)
    }
  }, [fetchTransactions, toast])
  
  // Load data
  useEffect(() => {
    if (!isAuthenticated) return
    
    fetchFinancialData()
  }, [isAuthenticated, fetchFinancialData])
  
  // Filter transactions by date range and type
  useEffect(() => {
    if (!isAuthenticated) return
    
    fetchTransactions()
  }, [dateRange, transactionType, isAuthenticated, fetchTransactions])

  const handleCashOperation = async () => {
    // Validate based on operation type
    if (operationType === 'add' || operationType === 'remove') {
      if (!operationAmount || isNaN(parseFloat(operationAmount)) || parseFloat(operationAmount) <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid positive amount",
          variant: "destructive",
        })
        return
      }
    }
    
    try {
      setLoading(true)
      
      // Build operation payload based on type
      const operation: CashOperation = {
        type: operationType as 'add' | 'remove' | 'close',
        reason: operationReason
      }
      
      // Only include amount for add/remove operations
      if (operationType !== 'close' && operationAmount) {
        operation.amount = parseFloat(operationAmount)
      }
      
      await financeService.performCashOperation(operation)
      
      // Get success message based on operation type
      let successMessage = "Cash operation completed successfully"
      
      if (operationType === 'add') {
        successMessage = `PKR ${operationAmount} added to cash drawer successfully`
      } else if (operationType === 'remove') {
        successMessage = `PKR ${operationAmount} removed from cash drawer successfully`
      } else if (operationType === 'close') {
        successMessage = `Cash drawer closed successfully`
      }
      
      toast({
        title: "Success",
        description: successMessage,
      })
      
      // Reset form
      setOperationAmount("")
      setOperationReason("")
      setOperationType("add")
      
      // Refresh cash drawer data
      const drawerData = await financeService.getCashDrawerData()
      setCashDrawerData(drawerData as CashDrawerData)
      
      // Refresh summary
      const summaryData = await financeService.getFinancialSummary({ period: 'today' })
      setSummary(summaryData as FinancialSummary)
    } catch (error) {
      console.error("Error performing cash operation:", error)
      
      // Get error message from server if possible
      let errorMessage = "Failed to perform cash operation. Please try again."
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Function to handle closing the cash drawer
  const handleCloseDrawer = () => {
    // Set operation type to close
    setOperationType("close")
    setOperationReason("End of day closing")
    
    // Show confirmation dialog
    const confirmed = window.confirm("Are you sure you want to close the cash drawer?")
    
    if (confirmed) {
      handleCashOperation()
    }
  }
  
  const handleAddExpense = async (expenseFormData: ExpenseFormData) => {
    try {
      setLoading(true)
      
      await financeService.addExpense({
        category: expenseFormData.category,
        description: expenseFormData.description,
        amount: parseFloat(expenseFormData.amount),
        paymentMethod: expenseFormData.paymentMethod,
        date: new Date(expenseFormData.date)
      })
      
      toast({
        title: "Success",
        description: "Expense added successfully",
      })
      
      // Refresh expenses
      const expensesData = await financeService.getExpenses()
      setExpenses(expensesData)
      
      // Refresh summary
      const summaryData = await financeService.getFinancialSummary({ period: 'today' })
      setSummary(summaryData as FinancialSummary)
      
      // Refresh cash drawer if cash payment
      if (expenseFormData.paymentMethod === 'Cash') {
        const drawerData = await financeService.getCashDrawerData()
        setCashDrawerData(drawerData as CashDrawerData)
      }
      
      // Refresh transactions
      await fetchTransactions()
      
      return true
    } catch (error) {
      console.error("Error adding expense:", error)
      
      // Display more specific error message if available
      const errorMessage = error instanceof Error ? error.message : "Failed to add expense. Please try again."
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      
      return false
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  // Add useEffect to ensure modal state cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clean up modal states on component unmount
      setTransactionDetailsOpen(false);
      setExpenseDetailsOpen(false);
      setAddExpenseDialogOpen(false);
    };
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading financial data...</span>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Financial Management</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Calendar className="h-4 w-4" />
            {dateRange?.from ? format(dateRange.from, 'LLL dd, y') : 'Start'} - {dateRange?.to ? format(dateRange.to, 'LLL dd, y') : 'End'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {summary?.cashBalance?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Updated as of {formatDate(summary?.lastUpdated || new Date().toString())}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Sales</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {summary?.todaySales?.amount.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {summary?.todaySales?.count || 0} {summary?.todaySales?.count === 1 ? 'transaction' : 'transactions'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {summary?.todayExpenses?.amount.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {summary?.todayExpenses?.count || 0} {summary?.todayExpenses?.count === 1 ? 'transaction' : 'transactions'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow (Today)</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary?.todayNetCashFlow && summary?.todayNetCashFlow < 0 ? 'text-red-500' : 'text-green-500'}`}>
              {summary?.todayNetCashFlow && summary?.todayNetCashFlow < 0 ? '-' : ''}PKR {Math.abs(summary?.todayNetCashFlow || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.todayNetCashFlow && summary?.todayNetCashFlow < 0 
                ? 'Net loss for today' 
                : summary?.todayNetCashFlow && summary?.todayNetCashFlow > 0 
                  ? 'Net profit for today' 
                  : 'Break-even for today'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="cash-management">Cash Management</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search transactions..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DatePickerWithRange 
            date={dateRange}
            setDate={(date) => {
              if (date && date.from) {
                setDateRange({
                  from: date.from,
                  to: date.to
                });
              } else {
                setDateRange(undefined);
              }
            }}
          />
          <Select 
            defaultValue="all"
            value={transactionType}
            onValueChange={setTransactionType}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Transaction Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="sale">Sales</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="transactions">
          <Card>
            <CardHeader className="p-4">
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>View and manage all financial transactions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading transactions...</span>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No transactions found for the selected filters
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">
                        <div className="flex items-center space-x-1">
                          <span>Transaction ID</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              transaction.type === "Sale"
                                ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-500 dark:hover:bg-green-900/30"
                                : transaction.type === "Purchase"
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-500 dark:hover:bg-blue-900/30"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-500 dark:hover:bg-amber-900/30"
                            }
                          >
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.reference}</TableCell>
                        <TableCell>{transaction.paymentMethod}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            transaction.amount < 0 ? "text-red-500" : "text-green-500"
                          }`}
                        >
                          {transaction.amount < 0 ? "-" : ""}PKR {Math.abs(transaction.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              transaction.status === "Completed" || transaction.status === "Paid"
                                ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-500 dark:hover:bg-green-900/30"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-500 dark:hover:bg-amber-900/30"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => {
                                setSelectedTransaction(transaction);
                                setTransactionDetailsOpen(true);
                              }}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {transaction.type === "Sale" && (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setTransactionDetailsOpen(true);
                                  // After a short delay to ensure dialog is open, trigger print
                                  setTimeout(() => {
                                    window.alert('Printing receipt...');
                                    // In a real implementation, this would trigger the print logic
                                  }, 100);
                                }}>
                                  <Printer className="mr-2 h-4 w-4" />
                                  Print Receipt
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-management">
          <Card>
            <CardHeader>
              <CardTitle>Cash Drawer Management</CardTitle>
              <CardDescription>Track and manage cash drawer operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cash Drawer Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2">Loading cash drawer data...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Opening Balance:</span>
                          <span className="font-medium">PKR {cashDrawerData?.openingBalance.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cash Sales:</span>
                          <span className="font-medium text-green-500">+PKR {cashDrawerData?.cashSales.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cash Payments:</span>
                          <span className="font-medium text-red-500">-PKR {cashDrawerData?.cashExpenses.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expected Balance:</span>
                          <span className="font-medium">PKR {cashDrawerData?.expectedBalance.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Balance:</span>
                          <span className="font-medium">PKR {cashDrawerData?.currentBalance.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setOperationType("close")
                        setOperationReason("End of day closing")
                        handleCloseDrawer()
                      }}
                    >
                      Close Drawer
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cash Operations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Operation Type</label>
                        <Select 
                          value={operationType} 
                          onValueChange={setOperationType}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select operation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add">Add Cash</SelectItem>
                            <SelectItem value="remove">Remove Cash</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          {operationType === 'add' ? 'Amount to Add' : 'Amount to Remove'}
                        </label>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          min="0.01" 
                          step="0.01"
                          value={operationAmount}
                          onChange={(e) => setOperationAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Reason</label>
                        <Input 
                          type="text" 
                          placeholder="Reason for operation" 
                          value={operationReason}
                          onChange={(e) => setOperationReason(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={handleCashOperation}
                      disabled={loading || !operationAmount}
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Submit
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader className="flex justify-between items-start">
              <div>
                <CardTitle>Expense Management</CardTitle>
                <CardDescription>Track and manage business expenses</CardDescription>
              </div>
              <Button onClick={() => setAddExpenseDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              {loading && !expenses.length ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading expenses...</span>
                </div>
              ) : !expenses.length ? (
                <div className="text-center p-4 text-muted-foreground">
                  No expenses found. Add your first expense using the button above.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.displayId || expense.expenseId || expense.id}</TableCell>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.paymentMethod}</TableCell>
                        <TableCell className="text-right font-medium">PKR {expense.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-500 dark:hover:bg-green-900/30"
                          >
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => {
                                setSelectedExpense(expense);
                                setExpenseDetailsOpen(true);
                              }}>
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {/* The add expense form is now in a dialog */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddExpenseDialog 
        open={addExpenseDialogOpen} 
        onOpenChange={setAddExpenseDialogOpen} 
        onExpenseAdded={handleAddExpense}
      />

      <TransactionDetailsDialog
        open={transactionDetailsOpen}
        onOpenChange={setTransactionDetailsOpen}
        transaction={selectedTransaction}
      />

      <ExpenseDetailsDialog
        open={expenseDetailsOpen}
        onOpenChange={setExpenseDetailsOpen}
        expense={selectedExpense}
      />
    </div>
  )
}
