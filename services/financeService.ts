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
}

// Define type for balance response
export interface BalanceResponse {
  balance: number;
}

// Define operation types
export type OperationType = 'add' | 'remove' | 'count' | 'sale' | 'expense' | 'initialization' | 'close';

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
   * Format amount as currency
   * @param {number} amount - Amount to format
   * @param {string} locale - Locale for formatting (default: 'en-US')
   * @param {string} currency - Currency code (default: 'USD')
   */
  formatCurrency: (amount: number, locale: string = 'en-US', currency: string = 'USD'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
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
  }
}; 