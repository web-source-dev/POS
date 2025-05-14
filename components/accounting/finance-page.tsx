"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { financeService, CashDrawerTransaction } from '@/services/financeService';
import { withAuthProtection } from '@/lib/protected-route';
import { ArrowUp, ArrowDown, RefreshCw, Clock, DollarSign, FileText, CreditCard, Download } from 'lucide-react';
import { ExpenseManagement } from './expense-management';

// No need to redefine these interfaces since we're importing them
export const FinancePage = withAuthProtection(() => {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<CashDrawerTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [action, setAction] = useState<'add' | 'remove'>('add');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'cash' | 'expenses'>('cash');

  useEffect(() => {
    if (activeTab === 'cash') {
      loadCashDrawerData();
    }
  }, [activeTab]);

  useEffect(() => {
    // Check if we're returning from an expense page
    const storedTab = localStorage.getItem('financeActiveTab');
    if (storedTab === 'expenses') {
      setActiveTab('expenses');
      localStorage.removeItem('financeActiveTab');
    }
  }, []);

  const loadCashDrawerData = async () => {
    setLoading(true);
    try {
      // Load balance and history in parallel
      const [balanceData, historyData] = await Promise.all([
        financeService.getCashDrawerBalance(),
        financeService.getCashDrawerHistory()
      ]);
      
      setBalance(balanceData.balance);
      setHistory(historyData);
    } catch (err) {
      console.error('Failed to load cash drawer data', err);
      setError('Failed to load cash drawer data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let result;
      if (action === 'add') {
        result = await financeService.addCash(parseFloat(amount), notes);
        setSuccess(`Successfully added ${financeService.formatCurrency(parseFloat(amount))} to cash drawer`);
      } else {
        result = await financeService.removeCash(parseFloat(amount), notes);
        setSuccess(`Successfully removed ${financeService.formatCurrency(parseFloat(amount))} from cash drawer`);
      }

      console.log('Result:', result);
      // Reset form
      setAmount('');
      setNotes('');
      
      // Refresh data
      await loadCashDrawerData();
    } catch (err: unknown) {
      console.error('Cash drawer operation failed', err);
      setError(err instanceof Error ? err.message : 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionClick = (transactionId: string) => {
    router.push(`/accounting/transaction/${transactionId}`);
  };

  const handleTabChange = (tab: 'cash' | 'expenses') => {
    setActiveTab(tab);
    if (tab === 'expenses') {
      localStorage.setItem('financeActiveTab', 'expenses');
    } else {
      localStorage.removeItem('financeActiveTab');
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
  
  // Handle export functionality for cash drawer transactions
  const handleExportTransactions = () => {
    try {
      // Create CSV content
      const headers = ["Date & Time", "Operation", "Amount", "Previous Balance", "New Balance", "Notes"];
      
      const rows = history.map(transaction => {
        return [
          financeService.formatDateTime(transaction.date),
          financeService.getOperationDisplayName(transaction.operation),
          transaction.amount.toFixed(2),
          transaction.previousBalance.toFixed(2),
          transaction.balance.toFixed(2),
          transaction.notes || ""
        ];
      });
      
      // Add summary row at the end
      rows.push([]); // Empty row
      rows.push(["CASH DRAWER SUMMARY", "", "", "", "", ""]);
      rows.push(["Current Balance:", financeService.formatCurrency(balance), "", "", "", ""]);
      rows.push(["Transactions Count:", history.length.toString(), "", "", "", ""]);
      rows.push(["Report Generated:", new Date().toLocaleString(), "", "", "", ""]);
      
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
      link.href = url;
      link.setAttribute('download', `cash_drawer_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      setSuccess('Cash drawer transactions exported successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      setError('Failed to export transactions. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  const renderCashManagement = () => (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Cash Management</h1>
        <p className="text-muted-foreground">Manage your cash drawer and track transactions</p>
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
      
      {/* Cash Drawer Balance */}
      <div className="bg-card rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-card-foreground">Current Balance</h2>
          <button 
            onClick={loadCashDrawerData} 
            className="flex items-center text-primary hover:text-primary/80"
            disabled={loading}
          >
            <RefreshCw size={16} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        <div className="flex items-center">
          <div className="bg-primary/20 p-4 rounded-full">
            <DollarSign size={24} className="text-primary" />
          </div>
          <div className="ml-4">
            <p className="text-muted-foreground">Available Cash</p>
            <p className="text-3xl font-bold text-card-foreground">
              {financeService.formatCurrency(balance)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Cash Operations Form */}
      <div className="bg-card rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Cash Operations</h2>
        
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
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-card-foreground text-sm font-bold mb-2">
              Operation
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center ${
                  action === 'add' 
                    ? 'bg-primary/20 text-primary border-2 border-primary' 
                    : 'bg-secondary text-secondary-foreground border border-border'
                }`}
                onClick={() => setAction('add')}
              >
                <ArrowDown size={20} className="mr-2" />
                Add Cash
              </button>
              <button
                type="button"
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center ${
                  action === 'remove' 
                    ? 'bg-destructive/20 text-destructive border-2 border-destructive' 
                    : 'bg-secondary text-secondary-foreground border border-border'
                }`}
                onClick={() => setAction('remove')}
              >
                <ArrowUp size={20} className="mr-2" />
                Withdraw Cash
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="amount" className="block text-card-foreground text-sm font-bold mb-2">
              Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-muted-foreground">Rs</span>
              </div>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 block w-full py-2 px-3 rounded-md border border-input shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="notes" className="block text-card-foreground text-sm font-bold mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full py-2 px-3 rounded-md border border-input shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
              placeholder="Add notes about this transaction..."
              rows={3}
            />
          </div>
          
          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg font-bold text-primary-foreground ${
              action === 'add' 
                ? 'bg-primary hover:bg-primary/90' 
                : 'bg-destructive hover:bg-destructive/90'
            }`}
            disabled={loading}
          >
            {loading ? 'Processing...' : action === 'add' ? 'Add Cash' : 'Withdraw Cash'}
          </button>
        </form>
      </div>
      
      {/* Transaction History */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-card-foreground">Transaction History</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTransactions}
              className="inline-flex items-center px-3 py-2 border border-input rounded-md text-sm text-card-foreground hover:bg-muted"
              disabled={history.length === 0}
            >
              <Download size={16} className="mr-1" />
              Export
            </button>
            <span className="text-muted-foreground text-sm">Last 50 transactions</span>
          </div>
        </div>
        
        {history.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileText size={40} className="mx-auto mb-2 opacity-30" />
            <p>No transaction history found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-card">
              <thead>
                <tr className="bg-muted text-muted-foreground uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Date & Time</th>
                  <th className="py-3 px-6 text-left">Operation</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6 text-right">Balance</th>
                  <th className="py-3 px-6 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="text-card-foreground text-sm">
                {history.map((transaction) => (
                  <tr key={transaction._id} 
                      className="border-b border-border hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleTransactionClick(transaction._id)}>
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-2 text-muted-foreground" />
                        {financeService.formatDateTime(transaction.date)}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-left">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.operation === 'add' ? 'bg-primary/20 text-primary' :
                        transaction.operation === 'remove' ? 'bg-destructive/20 text-destructive' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {financeService.getOperationDisplayName(transaction.operation)}
                      </span>
                    </td>
                   
                    <td className="py-3 px-6 text-right">
                      <span className={`font-semibold ${
                        transaction.operation === 'add' || transaction.operation === 'sale' ? 'text-primary' :
                        transaction.operation === 'remove' || transaction.operation === 'expense' ? 'text-destructive' :
                        'text-card-foreground'
                      }`}>
                        {transaction.operation === 'add' || transaction.operation === 'sale' ? '+' : 
                         transaction.operation === 'remove' || transaction.operation === 'expense' ? '-' : ''}
                        {financeService.formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right font-semibold">
                      {financeService.formatCurrency(transaction.balance)}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {transaction.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('cash')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'cash'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <DollarSign size={18} className="mr-2" />
              Cash Management
            </button>
            <button
              onClick={() => handleTabChange('expenses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'expenses'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <CreditCard size={18} className="mr-2" />
              Expense Management
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'cash' ? renderCashManagement() : <ExpenseManagement />}
    </div>
  );
});
