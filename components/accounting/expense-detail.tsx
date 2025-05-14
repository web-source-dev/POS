"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { financeService, Expense, PaymentMethod, ExpenseStatus } from '@/services/financeService';
import { withAuthProtection } from '@/lib/protected-route';
import { 
  ArrowLeft, DollarSign, CreditCard, Calendar, 
  AlertCircle, Edit, FileText, List, Download
} from 'lucide-react';

const paymentMethods: PaymentMethod[] = ['Cash', 'Credit Card', 'Bank Transfer', 'Check', 'Other'];
const expenseStatuses: ExpenseStatus[] = ['Paid', 'Pending', 'Cancelled'];

export const ExpenseDetailPage = withAuthProtection(() => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form values for editing
  const [formCategory, setFormCategory] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('Cash');
  const [formStatus, setFormStatus] = useState<ExpenseStatus>('Paid');
  const [formDate, setFormDate] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  
  useEffect(() => {
    if (!id) {
      setError('Expense ID is missing');
      setLoading(false);
      return;
    }

    const loadExpenseData = async () => {
      setLoading(true);
      try {
        const [expenseData, categoriesData] = await Promise.all([
          financeService.getExpense(id),
          financeService.getExpenseCategories()
        ]);
        
        setExpense(expenseData);
        setCategories(categoriesData);
        
        // Initialize form values
        setFormCategory(expenseData.category);
        setFormDescription(expenseData.description);
        setFormAmount(expenseData.amount.toString());
        setFormPaymentMethod(expenseData.paymentMethod);
        setFormStatus(expenseData.status);
        setFormDate(new Date(expenseData.date).toISOString().split('T')[0]);
      } catch (err) {
        console.error('Failed to load expense data', err);
        setError('Failed to load expense details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadExpenseData();
  }, [id]);

  const handleBack = () => {
    // Store that we should be in the expenses tab
    localStorage.setItem('financeActiveTab', 'expenses');
    router.back();
  };

  const handleViewAllExpenses = () => {
    // Store that we should be in the expenses tab
    localStorage.setItem('financeActiveTab', 'expenses');
    router.push('/accounting');
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    // Reset form values to current expense
    if (expense) {
      setFormCategory(expense.category);
      setFormDescription(expense.description);
      setFormAmount(expense.amount.toString());
      setFormPaymentMethod(expense.paymentMethod);
      setFormStatus(expense.status);
      setFormDate(new Date(expense.date).toISOString().split('T')[0]);
    }
    setIsEditing(false);
    setError('');
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
      const updatedExpense = await financeService.updateExpense(id, {
        category: formCategory,
        description: formDescription,
        amount: parseFloat(formAmount),
        paymentMethod: formPaymentMethod,
        status: formStatus,
        date: formDate
      });
      
      setExpense(updatedExpense);
      setIsEditing(false);
      setSuccess('Expense updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      console.error('Failed to update expense', err);
      setError(err instanceof Error ? err.message : 'Failed to update expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await financeService.deleteExpense(id);
      setSuccess('Expense deleted successfully');
      
      // Navigate back to expenses after deletion
      setTimeout(() => {
        router.push('/accounting');
      }, 1500);
    } catch (err: unknown) {
      console.error('Failed to delete expense', err);
      setError(err instanceof Error ? err.message : 'Failed to delete expense. Please try again.');
      setLoading(false);
    }
  };

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
    if (!expense) return;
    
    try {
      // Create CSV content with two sections: headers and details
      const rows = [];
      
      // Add header section
      rows.push(['EXPENSE DETAILS REPORT', '', '']);
      rows.push(['Date Generated:', new Date().toLocaleString(), '']);
      rows.push(['', '', '']);
      
      // Add basic info
      rows.push(['BASIC INFORMATION', '', '']);
      rows.push(['Expense ID:', expense.expenseId, '']);
      rows.push(['Category:', expense.category, '']);
      rows.push(['Amount:', financeService.formatCurrency(expense.amount), '']);
      rows.push(['Status:', expense.status, '']);
      rows.push(['Date:', financeService.formatDate(expense.date), '']);
      rows.push(['Payment Method:', expense.paymentMethod, '']);
      rows.push(['Description:', expense.description || 'N/A', '']);
      rows.push(['Created At:', financeService.formatDateTime(expense.createdAt), '']);
      rows.push(['', '', '']);
      
      // Format with proper escaping
      let csvContent = '';
      
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
      link.href = url;
      link.setAttribute('download', `expense_${expense.expenseId}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      setSuccess('Expense details exported successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error exporting expense details:', error);
      setError('Failed to export expense details. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading && !expense) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !expense) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded relative mb-4" role="alert">
          <div className="flex items-center">
            <AlertCircle className="mr-2" />
            <span>{error}</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90"
          >
            <ArrowLeft size={16} className="mr-2" />
            Go Back
          </button>
          <button
            onClick={handleViewAllExpenses}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90"
          >
            <List size={16} className="mr-2" />
            View All Expenses
          </button>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-muted border border-border text-muted-foreground px-4 py-3 rounded relative mb-4" role="alert">
          <span>Expense not found</span>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90"
          >
            <ArrowLeft size={16} className="mr-2" />
            Go Back
          </button>
          <button
            onClick={handleViewAllExpenses}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90"
          >
            <List size={16} className="mr-2" />
            View All Expenses
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = financeService.getExpenseStatusInfo(expense.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 inline-flex items-center px-3 py-2 border border-border shadow-sm text-sm leading-4 font-medium rounded-md text-foreground bg-background hover:bg-muted"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-foreground">Expense Details</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md shadow-sm text-foreground bg-background hover:bg-muted"
          >
            <Download size={16} className="mr-2" />
            Export
          </button>
          <button
            onClick={handleViewAllExpenses}
            className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md shadow-sm text-foreground bg-background hover:bg-muted"
          >
            <List size={16} className="mr-2" />
            View All Expenses
          </button>
        </div>
      </div>
      
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

      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        {/* Expense Header */}
        <div className="p-6 bg-muted border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 rounded-full mr-4 bg-primary/20">
                <DollarSign size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-card-foreground">
                  {expense.category}
                </h2>
                <div className="flex items-center text-muted-foreground">
                  <Calendar size={14} className="mr-1" />
                  <span>{financeService.formatDate(expense.date)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-sm">Expense ID</div>
              <div className="font-mono text-xs">{expense.expenseId}</div>
            </div>
          </div>
        </div>

        {/* Expense Edit Form or Details */}
        {isEditing ? (
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-card-foreground text-sm font-medium mb-2">
                    Category*
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-ring focus:border-ring"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
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
              
              <div className="mb-6">
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
              
              <div className="flex justify-between">
                <div>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                    disabled={loading}
                  >
                    Delete Expense
                  </button>
                </div>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-end mb-6">
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-card-foreground bg-card hover:bg-muted"
              >
                <Edit size={16} className="mr-2" />
                Edit Expense
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Amount</h3>
                <p className="text-2xl font-bold text-card-foreground">
                  {financeService.formatCurrency(expense.amount)}
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Payment Method</h3>
                <div className="flex items-center">
                  {expense.paymentMethod === 'Cash' ? (
                    <DollarSign size={20} className="mr-2 text-primary" />
                  ) : expense.paymentMethod === 'Credit Card' ? (
                    <CreditCard size={20} className="mr-2 text-primary" />
                  ) : (
                    <FileText size={20} className="mr-2 text-muted-foreground" />
                  )}
                  <p className="text-lg font-semibold text-card-foreground">
                    {expense.paymentMethod}
                  </p>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
                <p className="flex items-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.colorClass} mr-2`}>
                    {statusInfo.name}
                  </span>
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Created At</h3>
                <p className="text-lg text-card-foreground">
                  {financeService.formatDateTime(expense.createdAt)}
                </p>
              </div>
            </div>
            
            {/* Description Section */}
            <div className="mt-6 bg-muted p-4 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
              <p className="text-card-foreground">
                {expense.description || 'No description provided for this expense.'}
              </p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-border">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                disabled={loading}
              >
                Delete Expense
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}); 