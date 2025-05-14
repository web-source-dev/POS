import { api } from '@/lib/api';

// Define type for cash drawer transaction
export interface CashDrawerTransaction {
  _id: string;
  userId: string;
  date: string;
  previousBalance: number;
  amount: number;
  balance: number;
  operation: 'add' | 'remove' | 'count' | 'sale' | 'expense' | 'initialization' | 'close';
  reference: string | null;
  notes: string;
  saleDetails?: {
    receiptNumber: string;
    items: Array<{
      itemId: string;
      name: string;
      sku?: string;
      quantity: number;
      price: number;
    }>;
    subtotal: number;
    discount: number;
    total: number;
    cashAmount: number;
    change: number;
    customerName?: string;
    date: string;
  };
}

// Define type for expense
export interface Expense {
  _id: string;
  expenseId: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Check' | 'Other';
  status: 'Paid' | 'Pending' | 'Cancelled';
  date: string;
  userId: string;
  createdAt: string;
}

// Define type for balance response
export interface BalanceResponse {
  balance: number;
}

// Define operation types
export type OperationType = 'add' | 'remove' | 'count' | 'sale' | 'expense' | 'initialization' | 'close';

// Define payment method and status types
export type PaymentMethod = 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Check' | 'Other';
export type ExpenseStatus = 'Paid' | 'Pending' | 'Cancelled';

/**
 * Service for managing finance-related operations
 */
export const financeService = {
  /**
   * Get the cash drawer history
   */
  getCashDrawerHistory: async (): Promise<CashDrawerTransaction[]> => {
    return api.get<CashDrawerTransaction[]>('/finance/cash-drawer/history');
  },

  /**
   * Get a single cash drawer transaction by ID
   * @param {string} id - Transaction ID to fetch
   */
  getCashDrawerTransaction: async (id: string): Promise<CashDrawerTransaction> => {
    return api.get<CashDrawerTransaction>(`/finance/cash-drawer/transaction/${id}`);
  },

  /**
   * Get the current cash drawer balance
   */
  getCashDrawerBalance: async (): Promise<BalanceResponse> => {
    return api.get<BalanceResponse>('/finance/cash-drawer/balance');
  },

  /**
   * Add cash to the drawer
   * @param {number} amount - Amount to add
   * @param {string} notes - Optional notes about the transaction
   */
  addCash: async (amount: number, notes: string = ''): Promise<CashDrawerTransaction> => {
    return api.post<CashDrawerTransaction>('/finance/cash-drawer/add', { amount, notes });
  },

  /**
   * Remove cash from the drawer
   * @param {number} amount - Amount to remove
   * @param {string} notes - Optional notes about the transaction
   */
  removeCash: async (amount: number, notes: string = ''): Promise<CashDrawerTransaction> => {
    return api.post<CashDrawerTransaction>('/finance/cash-drawer/remove', { amount, notes });
  },

  /**
   * Get cash drawer summary by date range
   * @param {Date|string} startDate - Start date for the summary
   * @param {Date|string} endDate - End date for the summary
   */
  getCashDrawerSummary: async (startDate?: Date | string, endDate?: Date | string): Promise<any> => {
    return api.get('/finance/cash-drawer/summary', {
      params: {
        startDate,
        endDate
      }
    });
  },

  /**
   * Get all expenses with optional filtering
   * @param {object} filters - Optional filters for expenses
   */
  getExpenses: async (filters: {
    startDate?: Date | string;
    endDate?: Date | string;
    category?: string;
    status?: ExpenseStatus;
  } = {}): Promise<Expense[]> => {
    return api.get<Expense[]>('/finance/expenses', { params: filters });
  },

  /**
   * Get a single expense by ID
   * @param {string} id - Expense ID to fetch
   */
  getExpense: async (id: string): Promise<Expense> => {
    return api.get<Expense>(`/finance/expenses/${id}`);
  },

  /**
   * Create a new expense
   * @param {object} expenseData - Expense data to create
   */
  createExpense: async (expenseData: {
    category: string;
    description?: string;
    amount: number;
    paymentMethod?: PaymentMethod;
    status?: ExpenseStatus;
    date?: Date | string;
  }): Promise<Expense> => {
    return api.post<Expense>('/finance/expenses', expenseData);
  },

  /**
   * Update an existing expense
   * @param {string} id - Expense ID to update
   * @param {object} expenseData - Updated expense data
   */
  updateExpense: async (id: string, expenseData: {
    category?: string;
    description?: string;
    amount?: number;
    paymentMethod?: PaymentMethod;
    status?: ExpenseStatus;
    date?: Date | string;
  }): Promise<Expense> => {
    return api.put<Expense>(`/finance/expenses/${id}`, expenseData);
  },

  /**
   * Delete an expense
   * @param {string} id - Expense ID to delete
   */
  deleteExpense: async (id: string): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(`/finance/expenses/${id}`);
  },

  /**
   * Get unique expense categories
   */
  getExpenseCategories: async (): Promise<string[]> => {
    return api.get<string[]>('/finance/expense-categories');
  },

  /**
   * Format amount as currency
   * @param {number} amount - Amount to format
   * @param {string} locale - Locale for formatting (default: 'en-PK')
   * @param {string} currency - Currency code (default: 'PKR')
   */
  formatCurrency: (amount: number, locale: string = 'en-PK', currency: string = 'PKR'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace(/PKR/g, 'Rs');
  },
  
  /**
   * Format date and time
   * @param {Date|string} date - Date to format
   * @param {string} locale - Locale for formatting (default: 'en-US')
   */
  formatDateTime: (date: Date | string, locale: string = 'en-US'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Format date only
   * @param {Date|string} date - Date to format
   * @param {string} locale - Locale for formatting (default: 'en-US')
   */
  formatDate: (date: Date | string, locale: string = 'en-US'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },
  
  /**
   * Get operation type display name
   * @param {string} operation - Operation type from CashDrawer model
   */
  getOperationDisplayName: (operation: OperationType): string => {
    const operationMap: Record<OperationType, string> = {
      add: 'Cash Added',
      remove: 'Cash Withdrawn',
      sale: 'Sale Transaction',
      expense: 'Expense Payment',
      count: 'Cash Count',
      initialization: 'Drawer Initialized',
      close: 'Drawer Closed'
    };
    
    return operationMap[operation] || operation;
  },

  /**
   * Get payment method display name
   * @param {PaymentMethod} method - Payment method
   */
  getPaymentMethodDisplayName: (method: PaymentMethod): string => {
    const methodMap: Record<PaymentMethod, string> = {
      'Cash': 'Cash',
      'Credit Card': 'Credit Card',
      'Bank Transfer': 'Bank Transfer',
      'Check': 'Check',
      'Other': 'Other'
    };
    
    return methodMap[method] || method;
  },

  /**
   * Get expense status display name and color class
   * @param {ExpenseStatus} status - Expense status
   */
  getExpenseStatusInfo: (status: ExpenseStatus): { name: string, colorClass: string } => {
    const statusMap: Record<ExpenseStatus, { name: string, colorClass: string }> = {
      'Paid': { name: 'Paid', colorClass: 'bg-green-100 text-green-800' },
      'Pending': { name: 'Pending', colorClass: 'bg-yellow-100 text-yellow-800' },
      'Cancelled': { name: 'Cancelled', colorClass: 'bg-red-100 text-red-800' }
    };
    
    return statusMap[status] || { name: status, colorClass: 'bg-gray-100 text-gray-800' };
  },

  /**
   * Format receipt number
   * @param {string} id - ID string to format as receipt number
   * @param {string} receiptNum - Optional existing receipt number
   */
  formatReceiptNumber: (id: string, receiptNum?: string): string => {
    if (receiptNum) return receiptNum;
    return `#${id.slice(-6).padStart(6, '0')}`;
  }
}; 