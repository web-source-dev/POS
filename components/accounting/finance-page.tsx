"use client";

import { useState, useEffect } from 'react';
import { financeService, CashDrawerTransaction } from '@/services/financeService';
import { withAuthProtection } from '@/lib/protected-route';
import { ArrowUp, ArrowDown, RefreshCw, Clock, DollarSign, FileText } from 'lucide-react';

// No need to redefine these interfaces since we're importing them
export const FinancePage = withAuthProtection(() => {
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<CashDrawerTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [action, setAction] = useState<'add' | 'remove'>('add');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    loadCashDrawerData();
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

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Cash Management</h1>
        <p className="text-gray-600">Manage your cash drawer and track transactions</p>
      </header>
      
      {/* Cash Drawer Balance */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Current Balance</h2>
          <button 
            onClick={loadCashDrawerData} 
            className="flex items-center text-blue-600 hover:text-blue-800"
            disabled={loading}
          >
            <RefreshCw size={16} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        <div className="flex items-center">
          <div className="bg-blue-100 p-4 rounded-full">
            <DollarSign size={24} className="text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-gray-600">Available Cash</p>
            <p className="text-3xl font-bold text-gray-800">
              {financeService.formatCurrency(balance)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Cash Operations Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Cash Operations</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Operation
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center ${
                  action === 'add' 
                    ? 'bg-green-100 text-green-800 border-2 border-green-500' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
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
                    ? 'bg-red-100 text-red-800 border-2 border-red-500' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
                onClick={() => setAction('remove')}
              >
                <ArrowUp size={20} className="mr-2" />
                Withdraw Cash
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">
              Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 block w-full py-2 px-3 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full py-2 px-3 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add notes about this transaction..."
              rows={3}
            />
          </div>
          
          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg font-bold text-white ${
              action === 'add' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
            disabled={loading}
          >
            {loading ? 'Processing...' : action === 'add' ? 'Add Cash' : 'Withdraw Cash'}
          </button>
        </form>
      </div>
      
      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
          <span className="text-gray-500 text-sm">Last 50 transactions</span>
        </div>
        
        {history.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <FileText size={40} className="mx-auto mb-2 opacity-30" />
            <p>No transaction history found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Date & Time</th>
                  <th className="py-3 px-6 text-left">Operation</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6 text-right">Balance</th>
                  <th className="py-3 px-6 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {history.map((transaction) => (
                  <tr key={transaction._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-2 text-gray-400" />
                        {financeService.formatDateTime(transaction.date)}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-left">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.operation === 'add' ? 'bg-green-100 text-green-800' :
                        transaction.operation === 'remove' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {financeService.getOperationDisplayName(transaction.operation)}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <span className={`font-semibold ${
                        transaction.operation === 'add' || transaction.operation === 'sale' ? 'text-green-600' :
                        transaction.operation === 'remove' || transaction.operation === 'expense' ? 'text-red-600' :
                        'text-gray-600'
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
    </div>
  );
});
