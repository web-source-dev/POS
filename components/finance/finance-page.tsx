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

export function FinancePage() {
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  
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
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | { from: Date; to?: Date } | undefined>({
    from: new Date(),
    to: new Date(),
  })
  const [transactionType, setTransactionType] = useState("all")
  
  // New expense state
  const [newExpense, setNewExpense] = useState({
    category: "Utilities",
    description: "",
    amount: "",
    paymentMethod: "Cash",
    date: new Date().toISOString().split('T')[0]
  })

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
      // Fetch summary data
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
  
  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount || isNaN(parseFloat(newExpense.amount)) || parseFloat(newExpense.amount) <= 0) {
      toast({
        title: "Invalid input",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      })
      return
    }
    
    try {
      setLoading(true)
      
      await financeService.addExpense({
        category: newExpense.category,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        paymentMethod: newExpense.paymentMethod,
        date: new Date(newExpense.date)
      })
      
      toast({
        title: "Success",
        description: "Expense added successfully",
      })
      
      // Reset form
      setNewExpense({
        category: "Utilities",
        description: "",
        amount: "",
        paymentMethod: "Cash",
        date: new Date().toISOString().split('T')[0]
      })
      
      // Refresh expenses
      const expensesData = await financeService.getExpenses()
      setExpenses(expensesData)
      
      // Refresh summary
      const summaryData = await financeService.getFinancialSummary({ period: 'today' })
      setSummary(summaryData as FinancialSummary)
      
      // Refresh cash drawer if cash payment
      if (newExpense.paymentMethod === 'Cash') {
        const drawerData = await financeService.getCashDrawerData()
        setCashDrawerData(drawerData as CashDrawerData)
      }
      
      // Refresh transactions
      await fetchTransactions()
    } catch (error) {
      console.error("Error adding expense:", error)
      
      // Display more specific error message if available
      const errorMessage = error instanceof Error ? error.message : "Failed to add expense. Please try again."
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
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
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {transaction.type === "Sale" && (
                                <DropdownMenuItem>
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
              <Button type="button" data-bs-toggle="modal" data-bs-target="#addExpenseModal">
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
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {/* Add expense form */}
              <div className="mt-8 border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Add New Expense</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category*</label>
                    <Select 
                      value={newExpense.category}
                      onValueChange={(value) => setNewExpense({...newExpense, category: value})}
                    >
                      <SelectTrigger>
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
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Amount*</label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      min="0.01" 
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Payment Method</label>
                    <Select 
                      value={newExpense.paymentMethod}
                      onValueChange={(value) => setNewExpense({...newExpense, paymentMethod: value})}
                    >
                      <SelectTrigger>
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
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date</label>
                    <Input 
                      type="date" 
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1 block">Description</label>
                    <Textarea 
                      placeholder="Enter expense description" 
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button 
                    onClick={handleAddExpense}
                    disabled={loading || !newExpense.category || !newExpense.amount}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Add Expense
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
