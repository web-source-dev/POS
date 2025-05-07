import { api } from '../lib/api';

/**
 * Get financial transactions (transforms sales, expenses, and purchases into transaction format)
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date for filtering
 * @param {string} params.endDate - End date for filtering
 * @param {string} params.type - Transaction type filter ('sale', 'expense', or 'purchase')
 * @returns {Promise<Array>} List of transactions
 */
export const getTransactions = async (params = {}) => {
  try {
    // Get sales transactions
    const salesData = await api.get('/sales', { params });
    
    // Transform sales into transaction format
    const salesTransactions = salesData.map(sale => ({
      id: sale._id,
      date: new Date(sale.date).toLocaleDateString(),
      type: 'Sale',
      reference: `INV-${sale._id.slice(-5)}`,
      amount: sale.total,
      paymentMethod: 'Cash', // Assuming cash is default, enhance if multiple payment methods
      status: 'Completed',
      originalData: sale
    }));

    // Get expense data from finance endpoint
    const expensesData = await api.get('/finance/expenses', { params });
    
    // Transform expenses into transaction format
    const expenseTransactions = expensesData.map(expense => ({
      id: expense._id,
      date: new Date(expense.date).toLocaleDateString(),
      type: 'Expense',
      reference: expense.expenseId || `EXP-${expense._id.slice(-5)}`, // Use expenseId if available
      amount: -expense.amount, // Negative amount for expenses
      paymentMethod: expense.paymentMethod || 'Cash',
      status: expense.status || 'Paid',
      originalData: expense
    }));

    // Combine all transactions
    const allTransactions = [
      ...salesTransactions,
      ...expenseTransactions
    ];
    
    // Sort by date (newest first)
    return allTransactions.sort((a, b) => 
      new Date(b.originalData.date) - new Date(a.originalData.date)
    );
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

/**
 * Get expenses
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} List of expenses
 */
export const getExpenses = async (params = {}) => {
  try {
    const response = await api.get('/finance/expenses', { params });
    // Transform expenses to include a display ID
    return response.map(expense => ({
      ...expense,
      id: expense._id,
      // Use expenseId field if available, otherwise generate from _id
      displayId: expense.expenseId || `EXP-${expense._id.slice(-5)}`
    }));
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

/**
 * Add a new expense
 * @param {Object} expense - Expense data
 * @returns {Promise<Object>} Created expense
 */
export const addExpense = async (expense) => {
  try {
    // Add a small random delay to help avoid exact timestamp collisions
    const randomDelay = Math.floor(Math.random() * 100);
    await new Promise(resolve => setTimeout(resolve, randomDelay));
    
    const response = await api.post('/finance/expenses', expense);
    return response;
  } catch (error) {
    console.error('Error adding expense:', error);
    
    // If we get a duplicate key error, retry the operation once
    if (error.response?.data?.error === 'Duplicate key error') {
      console.log('Retrying add expense after duplicate key error...');
      
      // Add a longer delay before retry
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Retry the operation
        return await api.post('/finance/expenses', expense);
      } catch (retryError) {
        console.error('Error on retry of adding expense:', retryError);
        // Pass along the error message from the server
        if (retryError.response?.data?.message) {
          throw new Error(retryError.response.data.message);
        }
        throw retryError;
      }
    }
    
    // Pass along the error message from the server, if available
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

/**
 * Get financial summary
 * @param {Object} params - Query parameters
 * @param {string} params.period - Period for summary ('today', 'week', 'month')
 * @returns {Promise<Object>} Financial summary data
 */
export const getFinancialSummary = async (params = {}) => {
  try {
    const response = await api.get('/finance/summary', { params });
    return response.summary;
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    throw error;
  }
};

/**
 * Get cash drawer operations
 * @returns {Promise<Object>} Cash drawer data
 */
export const getCashDrawerData = async () => {
  try {
    const response = await api.get('/finance/cash-drawer');
    return response;
  } catch (error) {
    console.error('Error fetching cash drawer data:', error);
    throw error;
  }
};

/**
 * Perform cash drawer operation
 * @param {Object} operation - Operation data
 * @param {string} operation.type - Operation type ('add', 'remove', 'close')
 * @param {number} [operation.amount] - Amount (required for add/remove, not needed for close)
 * @param {string} [operation.reason] - Reason for operation
 * @returns {Promise<Object>} Operation result
 */
export const performCashOperation = async (operation) => {
  try {
    // Add a small random delay to help avoid exact timestamp collisions
    const randomDelay = Math.floor(Math.random() * 100);
    await new Promise(resolve => setTimeout(resolve, randomDelay));
    
    // For 'close' operation, ensure we have a valid payload
    if (operation.type === 'close') {
      // Remove amount if present to avoid validation issues on backend
      const { amount, ...closeOperation } = operation;
      return await api.post('/finance/cash-drawer/operation', closeOperation);
    }
    
    // For add/remove operations
    return await api.post('/finance/cash-drawer/operation', operation);
  } catch (error) {
    console.error('Error performing cash operation:', error);
    
    // If we get a duplicate key error (11000), retry the operation once with a delay
    if (error.response?.data?.error === 'Duplicate key error') {
      console.log('Retrying cash operation after duplicate key error...');
      
      // Add a longer delay before retry
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Retry the operation
        if (operation.type === 'close') {
          const { amount, ...closeOperation } = operation;
          return await api.post('/finance/cash-drawer/operation', closeOperation);
        }
        return await api.post('/finance/cash-drawer/operation', operation);
      } catch (retryError) {
        console.error('Error on retry of cash operation:', retryError);
        // Pass along the error message from the server if available
        if (retryError.response?.data?.message) {
          throw new Error(retryError.response.data.message);
        }
        throw retryError;
      }
    }
    
    // Pass along the error message from the server if available
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    
    throw error;
  }
};

const financeService = {
  getTransactions,
  getExpenses,
  addExpense,
  getFinancialSummary,
  getCashDrawerData,
  performCashOperation
};

export default financeService; 