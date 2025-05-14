"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { financeService, Expense, PaymentMethod, ExpenseStatus } from '@/services/financeService';
import { withAuthProtection } from '@/lib/protected-route';
import { 
  Plus, X, Edit, Trash2, Calendar, FileText, DollarSign, 
  CreditCard, CheckCircle, Clock, Eye, Download
} from 'lucide-react';

const paymentMethods: PaymentMethod[] = ['Cash', 'Credit Card', 'Bank Transfer', 'Check', 'Other'];
const expenseStatuses: ExpenseStatus[] = ['Paid', 'Pending', 'Cancelled'];

export const ExpenseManagement = withAuthProtection(() => {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // For filtering
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<ExpenseStatus | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // For expense form
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  
  // Form values
  const [formCategory, setFormCategory] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('Cash');
  const [formStatus, setFormStatus] = useState<ExpenseStatus>('Paid');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newCategory, setNewCategory] = useState<string>('');
  
  // Wrap loadExpenseData in useCallback to prevent infinite re-renders
  const loadExpenseData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: filteredData = {};
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedStatus) filters.status = selectedStatus;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      const data = await financeService.getExpenses(filters);
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load expense data', err);
      setError('Failed to load expense data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, startDate, endDate]);
  
  // Initialize with data
  useEffect(() => {
    loadExpenseData();
    loadExpenseCategories();
  }, [loadExpenseData]);
  
  // Load expenses with filters when filter values change (removed as it's handled by the loadExpenseData dependencies)
  // useEffect(() => {
  //  loadExpenseData();
  // }, [selectedCategory, selectedStatus, startDate, endDate]);
  
  interface filteredData {
    category?: string;
    status?: ExpenseStatus;
    startDate?: string;
    endDate?: string;
  }
  
  const loadExpenseCategories = async () => {
    try {
      const data = await financeService.getExpenseCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load expense categories', err);
    }
  };
  
  const handleViewExpense = (id: string) => {
    router.push(`/accounting/expense/${id}`);
  };
  
  const handleExpenseClick = (expense: Expense) => {
    setIsEditing(true);
    setCurrentExpense(expense);
    setFormCategory(expense.category);
    setFormDescription(expense.description);
    setFormAmount(expense.amount.toString());
    setFormPaymentMethod(expense.paymentMethod);
    setFormStatus(expense.status);
    setFormDate(new Date(expense.date).toISOString().split('T')[0]);
    setIsModalOpen(true);
  };
  
  const handleCreateExpense = () => {
    setIsEditing(false);
    setCurrentExpense(null);
    setFormCategory('');
    setFormDescription('');
    setFormAmount('');
    setFormPaymentMethod('Cash');
    setFormStatus('Paid');
    setFormDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };
  
  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }
    
    setLoading(true);
    try {
      await financeService.deleteExpense(id);
      await loadExpenseData();
      setSuccess('Expense deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to delete expense', err);
      setError('Failed to delete expense. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formCategory || !formAmount || isNaN(parseFloat(formAmount)) || parseFloat(formAmount) <= 0) {
      setError('Please provide a valid category and amount');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const expenseData = {
        category: formCategory,
        description: formDescription,
        amount: parseFloat(formAmount),
        paymentMethod: formPaymentMethod,
        status: formStatus,
        date: formDate
      };
      
      if (isEditing && currentExpense) {
        await financeService.updateExpense(currentExpense._id, expenseData);
        setSuccess('Expense updated successfully');
      } else {
        await financeService.createExpense(expenseData);
        setSuccess('Expense created successfully');
      }
      
      // Refresh data
      await loadExpenseData();
      await loadExpenseCategories();
      
      // Close modal
      setIsModalOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      console.error('Failed to save expense', err);
      setError(err instanceof Error ? err.message : 'Failed to save expense. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setFormCategory(newCategory);
      setNewCategory('');
    }
  };
  
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
  };
  
  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => {
    return expense.status !== 'Cancelled' ? sum + expense.amount : sum;
  }, 0);
  
  const paidExpenses = expenses.reduce((sum, expense) => {
    return expense.status === 'Paid' ? sum + expense.amount : sum;
  }, 0);
  
  const pendingExpenses = expenses.reduce((sum, expense) => {
    return expense.status === 'Pending' ? sum + expense.amount : sum;
  }, 0);
  
  // Helper function to escape CSV values properly
  const escapeCSV = (value: string | number) => {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    // If value contains commas, quotes, or newlines, wrap in quotes and escape any quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };
  
  // Handle export functionality
  const handleExport = () => {
    try {
      // Create CSV content
      const headers = ["ID", "Date", "Category", "Description", "Amount", "Payment Method", "Status"];
      
      const rows = expenses.map(expense => {
        return [
          expense.expenseId,
          financeService.formatDate(expense.date),
          expense.category,
          expense.description || "",
          expense.amount.toFixed(2),
          expense.paymentMethod,
          expense.status,
        ];
      });
      
      // Add summary row at the end
      rows.push([]); // Empty row
      rows.push(["SUMMARY", "", "", "", "", "", "", ""]);
      rows.push(["Total Expenses:", "", "", "", totalExpenses.toFixed(2), "", "", ""]);
      rows.push(["Paid Expenses:", "", "", "", paidExpenses.toFixed(2), "", "", ""]);
      rows.push(["Pending Expenses:", "", "", "", pendingExpenses.toFixed(2), "", "", ""]);
      
      // Format with proper escaping
      let csvContent = '';
      
      // Add headers row
      csvContent += headers.map(header => escapeCSV(header)).join(',') + '\r\n';
      
      // Add data rows
      rows.forEach(row => {
        csvContent += row.map(value => escapeCSV(value)).join(',') + '\r\n';
      });
      
      // Add BOM for better Excel compatibility with UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Create filename with date filter info
      let filename = 'expenses';
      if (startDate && endDate) {
        filename += `_${startDate}_to_${endDate}`;
      } else if (startDate) {
        filename += `_from_${startDate}`;
      } else if (endDate) {
        filename += `_until_${endDate}`;
      }
      
      if (selectedCategory) {
        filename += `_${selectedCategory}`;
      }
      
      if (selectedStatus) {
        filename += `_${selectedStatus}`;
      }
      
      filename += `_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      setSuccess('Expenses exported successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error exporting expenses:', error);
      setError('Failed to export expenses. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Expense Management</h1>
        <p className="text-muted-foreground">Track, categorize, and manage your business expenses</p>
      </header>
      
      {/* Success & Error Messages */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-primary/20 p-3 rounded-full">
              <DollarSign size={24} className="text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-muted-foreground text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-card-foreground">
                {financeService.formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-primary/20 p-3 rounded-full">
              <CheckCircle size={24} className="text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-muted-foreground text-sm font-medium">Paid</p>
              <p className="text-2xl font-bold text-card-foreground">
                {financeService.formatCurrency(paidExpenses)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-primary/20 p-3 rounded-full">
              <Clock size={24} className="text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-muted-foreground text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-card-foreground">
                {financeService.formatCurrency(pendingExpenses)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Actions */}
      <div className="bg-card rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-card-foreground mb-2 md:mb-0">Expense Filters</h2>
          <div className="flex space-x-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 flex items-center"
            >
              <X size={16} className="mr-1" />
              Clear Filters
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 flex items-center"
              disabled={expenses.length === 0}
            >
              <Download size={16} className="mr-1" />
              Export
            </button>
            <button
              onClick={handleCreateExpense}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center"
            >
              <Plus size={16} className="mr-1" />
              Add Expense
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-card-foreground text-sm font-medium mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-ring focus:border-ring"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-card-foreground text-sm font-medium mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ExpenseStatus | '')}
              className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-ring focus:border-ring"
            >
              <option value="">All Statuses</option>
              {expenseStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-card-foreground text-sm font-medium mb-2">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-ring focus:border-ring"
            />
          </div>
          
          <div>
            <label className="block text-card-foreground text-sm font-medium mb-2">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-ring focus:border-ring"
            />
          </div>
        </div>
      </div>
      
      {/* Expenses List */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Expenses</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileText size={40} className="mx-auto mb-2 opacity-30" />
            <p>No expenses found</p>
            <button
              onClick={handleCreateExpense}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center mx-auto"
            >
              <Plus size={16} className="mr-1" />
              Add your first expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-card">
              <thead>
                <tr className="bg-muted text-muted-foreground uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Date</th>
                  <th className="py-3 px-6 text-left">ID</th>
                  <th className="py-3 px-6 text-left">Category</th>
                  <th className="py-3 px-6 text-left">Description</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6 text-left">Payment Method</th>
                  <th className="py-3 px-6 text-left">Status</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-card-foreground text-sm">
                {expenses.map((expense) => {
                  const statusInfo = financeService.getExpenseStatusInfo(expense.status);
                  return (
                    <tr key={expense._id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-6 text-left whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2 text-muted-foreground" />
                          {financeService.formatDate(expense.date)}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-left font-mono text-xs">
                        <span 
                          onClick={() => handleViewExpense(expense._id)} 
                          className="cursor-pointer text-primary hover:underline bg-primary/10 px-2 py-1 rounded"
                        >
                          {expense.expenseId}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-left">{expense.category}</td>
                      <td className="py-3 px-6 text-left">{expense.description || '-'}</td>
                      <td className="py-3 px-6 text-right font-medium">
                        {financeService.formatCurrency(expense.amount)}
                      </td>
                      <td className="py-3 px-6 text-left">
                        <div className="flex items-center">
                          {expense.paymentMethod === 'Cash' ? (
                            <DollarSign size={14} className="mr-1 text-primary" />
                          ) : expense.paymentMethod === 'Credit Card' ? (
                            <CreditCard size={14} className="mr-1 text-primary" />
                          ) : (
                            <FileText size={14} className="mr-1 text-muted-foreground" />
                          )}
                          {expense.paymentMethod}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-left">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.colorClass}`}>
                          {statusInfo.name}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex item-center justify-center">
                          <button
                            onClick={() => handleViewExpense(expense._id)}
                            className="w-4 mr-2 transform hover:text-primary hover:scale-110"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleExpenseClick(expense)}
                            className="w-4 mr-2 transform hover:text-primary hover:scale-110"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense._id)}
                            className="w-4 mr-2 transform hover:text-destructive hover:scale-110"
                            disabled={loading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal for adding/editing expense */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-card-foreground">
                {isEditing ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-card-foreground text-sm font-medium mb-2">
                    Category*
                  </label>
                  <div className="flex">
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full p-2 border border-input rounded-l-md focus:outline-none focus:ring-ring focus:border-ring"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => document.getElementById('newCategoryInput')?.classList.toggle('hidden')}
                      className="bg-primary text-primary-foreground px-3 py-2 rounded-r-md hover:bg-primary/90"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div id="newCategoryInput" className="mt-2 hidden">
                    <div className="flex">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="New category name"
                        className="w-full p-2 border border-input rounded-l-md focus:outline-none focus:ring-ring focus:border-ring"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="bg-primary text-primary-foreground px-3 py-2 rounded-r-md hover:bg-primary/90"
                      >
                        <CheckCircle size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-card-foreground text-sm font-medium mb-2">
                    Amount*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-muted-foreground">Rs</span>
                    </div>
                    <input
                      type="number"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="pl-8 block w-full p-2 border border-input rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-card-foreground text-sm font-medium mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                  />
                </div>
                
                <div>
                  <label className="block text-card-foreground text-sm font-medium mb-2">
                    Payment Method
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-card-foreground text-sm font-medium mb-2">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ExpenseStatus)}
                    className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                  >
                    {expenseStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-card-foreground text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                  placeholder="Optional description for this expense"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-primary-foreground rounded-md ${
                    loading ? 'bg-muted cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
                  }`}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : isEditing ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}); 