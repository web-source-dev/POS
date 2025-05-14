"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { financeService, CashDrawerTransaction } from '@/services/financeService';
import { withAuthProtection } from '@/lib/protected-route';
import { 
  ArrowLeft, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  ShoppingCart, 
  User, 
  Package, 
  CreditCard,
  ArrowDown,
  ArrowUp,
  Calendar,
  CircleDollarSign,
  CircleCheck,
  Wallet,
  BarChart4,
  Info,
  FileText
} from 'lucide-react';

export const TransactionDetailPage = withAuthProtection(() => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [transaction, setTransaction] = useState<CashDrawerTransaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!id) {
      setError('Transaction ID is missing');
      setLoading(false);
      return;
    }

    const loadTransaction = async () => {
      setLoading(true);
      try {
        const data = await financeService.getCashDrawerTransaction(id);
        setTransaction(data);
      } catch (err) {
        console.error('Failed to load transaction data', err);
        setError('Failed to load transaction details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadTransaction();
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded relative mb-4" role="alert">
          <div className="flex items-center">
            <AlertCircle className="mr-2" />
            <span>{error}</span>
          </div>
        </div>
        <button
          onClick={handleBack}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Cash Management
        </button>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-muted border border-border text-muted-foreground px-4 py-3 rounded relative mb-4" role="alert">
          <span>Transaction not found</span>
        </div>
        <button
          onClick={handleBack}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Cash Management
        </button>
      </div>
    );
  }

  // Determine if this is a sale transaction with details
  const isSaleWithDetails = transaction.operation === 'sale' && transaction.saleDetails;
  
  // Determine transaction type color and classes
  const getTransactionColorClasses = (operation: CashDrawerTransaction['operation']) => {
    switch(operation) {
      case 'add':
        return {
          bgLight: 'bg-primary/10',
          bgMedium: 'bg-primary/20',
          text: 'text-primary',
          icon: <ArrowDown size={18} />,
          opName: 'Cash Added'
        };
      case 'remove':
        return {
          bgLight: 'bg-destructive/10',
          bgMedium: 'bg-destructive/20',
          text: 'text-destructive',
          icon: <ArrowUp size={18} />,
          opName: 'Cash Withdrawn'
        };
      case 'sale':
        return {
          bgLight: 'bg-green-100',
          bgMedium: 'bg-green-200',
          text: 'text-green-600',
          icon: <ShoppingCart size={18} />,
          opName: 'Sale Transaction'
        };
      case 'expense':
        return {
          bgLight: 'bg-amber-100',
          bgMedium: 'bg-amber-200',
          text: 'text-amber-600',
          icon: <CreditCard size={18} />,
          opName: 'Expense Payment'
        };
      default:
        return {
          bgLight: 'bg-muted',
          bgMedium: 'bg-muted/50',
          text: 'text-muted-foreground',
          icon: <CircleDollarSign size={18} />,
          opName: financeService.getOperationDisplayName(operation)
        };
    }
  };
  
  const transactionColors = getTransactionColorClasses(transaction.operation);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb & Back Navigation */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center px-3 py-1.5 text-xs border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <ArrowLeft size={14} className="mr-1" />
          Back
        </button>
      </div>

      {/* Transaction Header */}
      <div className={`mb-8 bg-muted rounded-xl p-6 shadow-sm border border-border`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center">
            <div className={`p-4 rounded-full mr-5 ${transactionColors.bgMedium}`}>
              {transaction.operation === 'sale' ? (
                <ShoppingCart size={28} className={transactionColors.text} />
              ) : transaction.operation === 'expense' ? (
                <CreditCard size={28} className={transactionColors.text} />
              ) : (
                <DollarSign size={28} className={transactionColors.text} />
              )}
            </div>
            <div>
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-foreground">
                  {transactionColors.opName}
                </h1>
                {isSaleWithDetails && transaction.saleDetails?.receiptNumber && (
                  <span className="ml-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {financeService.formatReceiptNumber(transaction._id, transaction.saleDetails.receiptNumber)}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center text-muted-foreground">
                <Calendar size={14} className="mr-2" />
                <span>{financeService.formatDateTime(transaction.date)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className={`text-3xl font-bold flex items-center ${
              transaction.operation === 'add' || transaction.operation === 'sale' ? 'text-primary' :
              transaction.operation === 'remove' || transaction.operation === 'expense' ? 'text-destructive' :
              'text-foreground'
            }`}>
              {transaction.operation === 'add' || transaction.operation === 'sale' ? '+ ' : 
               transaction.operation === 'remove' || transaction.operation === 'expense' ? '- ' : ''}
              {financeService.formatCurrency(transaction.amount)}
            </div>
           
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Financial Details */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <h2 className="text-lg font-semibold text-card-foreground flex items-center">
                <BarChart4 size={18} className="mr-2 text-muted-foreground" />
                Financial Summary
              </h2>
            </div>
            
            <div className="divide-y divide-border">
              {/* Cash Balance Change Timeline */}
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Balance Change</h3>
                </div>
                
                <div className="relative pt-6 pb-2">
                  {/* Timeline */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-border"></div>
                  
                  {/* Previous Balance Node */}
                  <div className="relative flex items-center mb-8">
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full border-4 border-muted bg-background flex items-center justify-center">
                      <Clock size={16} className="text-muted-foreground" />
                    </div>
                    
                    <div className="w-1/2 pr-8 text-right">
                      <div className="text-sm font-medium text-muted-foreground">Previous Balance</div>
                    </div>
                    
                    <div className="w-1/2 pl-8">
                      <div className="text-xl font-bold text-card-foreground">
                        {financeService.formatCurrency(transaction.previousBalance)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Transaction Node */}
                  <div className="relative flex items-center mb-8">
                    <div className={`absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full border-4 ${transactionColors.bgLight} ${transactionColors.text} flex items-center justify-center`}>
                      {transactionColors.icon}
                    </div>
                    
                    <div className="w-1/2 pr-8 text-right">
                      <div className="text-sm font-medium text-muted-foreground">{transaction.operation === 'add' || transaction.operation === 'sale' ? 'Cash In' : 'Cash Out'}</div>
                    </div>
                    
                    <div className="w-1/2 pl-8">
                      <div className={`text-xl font-bold ${transactionColors.text}`}>
                        {transaction.operation === 'add' || transaction.operation === 'sale' ? '+' : '-'} {financeService.formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Current Balance Node */}
                  <div className="relative flex items-center">
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full border-4 border-primary bg-primary/20 flex items-center justify-center">
                      <CircleCheck size={16} className="text-primary" />
                    </div>
                    
                    <div className="w-1/2 pr-8 text-right">
                      <div className="text-sm font-medium text-muted-foreground">Current Balance</div>
                    </div>
                    
                    <div className="w-1/2 pl-8">
                      <div className="text-xl font-bold text-primary">
                        {financeService.formatCurrency(transaction.balance)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Transaction Type */}
              <div className="px-5 py-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Operation Type</span>
                  <span className={`font-medium ${transactionColors.text}`}>
                    {transactionColors.opName}
                  </span>
                </div>
              </div>
              
              {/* Notes Section */}
              {transaction.notes && (
                <div className="px-5 py-4">
                  <div className="flex items-start">
                    <Info size={14} className="text-muted-foreground mt-1 mr-2 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">Transaction Notes</span>
                      <p className="text-card-foreground text-sm">
                        {transaction.notes || 'No notes provided for this transaction.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Payment Details for Sale Transactions */}
          {isSaleWithDetails && (
            <div className="mt-6 bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <h2 className="text-lg font-semibold text-card-foreground flex items-center">
                  <Wallet size={18} className="mr-2 text-muted-foreground" />
                  Payment Details
                </h2>
              </div>
              
              <div className="p-5 space-y-4">
                {transaction.saleDetails?.receiptNumber && (
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <div className="flex items-center">
                      <FileText size={16} className="mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Receipt Number</span>
                    </div>
                    <span className="font-medium">
                      {financeService.formatReceiptNumber(transaction._id, transaction.saleDetails.receiptNumber)}
                    </span>
                  </div>
                )}
                
                {transaction.saleDetails?.customerName && (
                  <div className="flex justify-between items-center pb-3 border-b border-border">
                    <div className="flex items-center">
                      <User size={16} className="mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Customer</span>
                    </div>
                    <span className="font-medium">{transaction.saleDetails.customerName}</span>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Amount</span>
                    <span className="font-bold text-card-foreground">
                      {financeService.formatCurrency(transaction.saleDetails?.total || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cash Received</span>
                    <span className="font-medium">
                      {financeService.formatCurrency(transaction.saleDetails?.cashAmount || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Change Given</span>
                    <span className="font-medium text-primary">
                      {financeService.formatCurrency(transaction.saleDetails?.change || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column - Items & Details */}
        <div className="lg:col-span-2">
          {/* Sale Items Section - if it's a sale transaction */}
          {isSaleWithDetails && transaction.saleDetails?.items && transaction.saleDetails.items.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <h2 className="text-lg font-semibold text-card-foreground flex items-center justify-between">
                  <div className="flex items-center">
                    <Package size={18} className="mr-2 text-muted-foreground" />
                    Purchased Items
                  </div>
                  {transaction.saleDetails?.receiptNumber && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {financeService.formatReceiptNumber(transaction._id, transaction.saleDetails.receiptNumber)}
                    </span>
                  )}
                </h2>
              </div>
              
              <div className="p-5">
                <div className="overflow-x-auto -mx-5">
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-xs uppercase text-muted-foreground">
                        <th className="px-5 py-3 text-left font-medium">Item</th>
                        {transaction.saleDetails?.items.some(item => item.sku) && (
                          <th className="px-5 py-3 text-left font-medium">SKU</th>
                        )}
                        <th className="px-5 py-3 text-center font-medium">Qty</th>
                        <th className="px-5 py-3 text-right font-medium">Price</th>
                        <th className="px-5 py-3 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {transaction.saleDetails.items.map((item, index) => (
                        <tr key={index} className="hover:bg-muted/20">
                          <td className="px-5 py-4 text-sm">
                            <div className="font-medium text-card-foreground">{item.name}</div>
                          </td>
                          {transaction.saleDetails?.items.some(item => item.sku) && (
                            <td className="px-5 py-4 text-xs text-muted-foreground font-mono">
                              {item.sku || '-'}
                            </td>
                          )}
                          <td className="px-5 py-4 text-sm text-center">
                            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground">{item.quantity}x</span>
                          </td>
                          <td className="px-5 py-4 text-sm text-right">
                            {financeService.formatCurrency(item.price)}
                          </td>
                          <td className="px-5 py-4 text-sm font-medium text-right">
                            {financeService.formatCurrency(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/20 text-card-foreground">
                      <tr>
                        <td colSpan={transaction.saleDetails?.items.some(item => item.sku) ? 4 : 3} className="px-5 py-3 text-right text-sm font-medium">
                          Subtotal:
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-medium">
                          {financeService.formatCurrency(transaction.saleDetails?.subtotal || 0)}
                        </td>
                      </tr>
                      {transaction.saleDetails?.discount > 0 && (
                        <tr>
                          <td colSpan={transaction.saleDetails?.items.some(item => item.sku) ? 4 : 3} className="px-5 py-3 text-right text-sm font-medium">
                            Discount:
                          </td>
                          <td className="px-5 py-3 text-right text-sm font-medium text-destructive">
                            -{financeService.formatCurrency(transaction.saleDetails?.discount || 0)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-muted/40">
                        <td colSpan={transaction.saleDetails?.items.some(item => item.sku) ? 4 : 3} className="px-5 py-3 text-right text-sm font-bold">
                          Total:
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-bold">
                          {financeService.formatCurrency(transaction.saleDetails?.total || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}); 