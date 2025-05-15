import { api } from '../lib/api';

/**
 * Dashboard Service
 * Provides functions to interact with the dashboard-related API endpoints
 */
const dashboardService = {
  /**
   * Get dashboard summary data
   * @returns {Promise<Object>} Dashboard summary data
   */
  getDashboardSummary: async () => {
    try {
      const data = await api.get('/dashboard/summary');
      
      // Check if we should generate sample data if there's no data
      if (data && !data.hasData) {
        console.info('No dashboard data found, would you like to generate sample data?');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      // Return default data structure to avoid UI crashes
      return {
        todaySales: { total: 0, count: 0 },
        todayExpenses: { total: 0, count: 0 },
        monthlySales: [],
        monthlyExpenses: [],
        inventoryStatus: [],
        lowStockItems: [],
        cashDrawerOperations: [],
        latestSales: [],
        inventoryValue: { totalValue: 0, totalItems: 0 },
        error: error.message
      };
    }
  },

  /**
   * Get net purchase amount for inventory
   * @returns {Promise<{total: number, count: number}>} Net purchase amount and count
   */
  getNetPurchaseAmount: async () => {
    try {
      const data = await api.get('/dashboard/net-purchase-amount');
      
      return data || { total: 0, count: 0 };
    } catch (error) {
      console.error('Error fetching net purchase amount:', error);
      // Return default data structure to avoid UI crashes
      return { total: 0, count: 0 };
    }
  },

  /**
   * Generate sample data for testing
   * @returns {Promise<{success: boolean, message: string, counts?: Object}>} Sample data generation result
   */
  generateSampleData: async () => {
    try {
      return await api.post('/dashboard/generate-sample-data');
    } catch (error) {
      console.error('Error generating sample data:', error);
      throw error;
    }
  },

  /**
   * Get period summary data (sales and expenses for selected time period)
   * @param {number} days - Number of days to fetch data for
   * @returns {Promise<{sales: {total: number, count: number}, expenses: {total: number, count: number}, profit: number, avgTransactionValue: number}>} Period summary data
   */
  getPeriodSummary: async (days = 30) => {
    try {
      // Calculate totals from monthly sales and expenses data
      const salesData = await api.get('/dashboard/sales-summary', {
        params: { days }
      });
      
      const expensesData = await api.get('/dashboard/expenses-summary', {
        params: { days }
      });
      
      // If the API endpoints don't exist yet, we can calculate totals from the data we already have
      // This is a fallback implementation
      if (!salesData || !expensesData) {
        console.warn('Using fallback implementation for period summary');
        const data = await dashboardService.getDashboardSummary();
        
        // Filter sales and expenses data for the selected period
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - days);
        
        // Filter and sum sales data
        const filteredSales = data.monthlySales.filter(sale => {
          const saleDate = new Date(sale._id);
          return saleDate >= startDate && saleDate <= now;
        });
        
        const salesTotal = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
        const salesCount = filteredSales.reduce((sum, sale) => sum + sale.count, 0);
        
        // Filter and sum expenses data
        const filteredExpenses = data.monthlyExpenses.filter(expense => {
          const expenseDate = new Date(expense._id);
          return expenseDate >= startDate && expenseDate <= now;
        });
        
        const expensesTotal = filteredExpenses.reduce((sum, expense) => sum + expense.total, 0);
        const expensesCount = filteredExpenses.reduce((sum, expense) => sum + expense.count, 0);
        
        // Calculate derived metrics
        const profit = salesTotal - expensesTotal;
        const avgTransactionValue = salesCount > 0 ? salesTotal / salesCount : 0;
        
        return {
          sales: { total: salesTotal, count: salesCount },
          expenses: { total: expensesTotal, count: expensesCount },
          profit,
          avgTransactionValue
        };
      }
      
      // Use API data if available
      const salesTotal = salesData.total || 0;
      const salesCount = salesData.count || 0;
      const expensesTotal = expensesData.total || 0;
      const expensesCount = expensesData.count || 0;
      
      return {
        sales: { total: salesTotal, count: salesCount },
        expenses: { total: expensesTotal, count: expensesCount },
        profit: salesTotal - expensesTotal,
        avgTransactionValue: salesCount > 0 ? salesTotal / salesCount : 0
      };
    } catch (error) {
      console.error('Error fetching period summary:', error);
      // Return default data structure to avoid UI crashes
      return {
        sales: { total: 0, count: 0 },
        expenses: { total: 0, count: 0 },
        profit: 0,
        avgTransactionValue: 0
      };
    }
  },

  /**
   * Get sales data by category
   * @param {number} days - Number of days to fetch data for
   * @returns {Promise<Array<{category: string, total: number}>>} Sales data by category
   */
  getSalesByCategory: async (days = 30) => {
    try {
      return await api.get('/dashboard/sales-by-category', {
        params: { days }
      });
    } catch (error) {
      console.error('Error fetching sales by category:', error);
      return []; // Return empty array to avoid UI crashes
    }
  },

  /**
   * Get cash drawer balance history
   * @param {number} days - Number of days to fetch data for
   * @returns {Promise<Array<{date: string, balance: number}>>} Cash drawer balance history
   */
  getCashBalanceHistory: async (days = 14) => {
    try {
      return await api.get('/dashboard/cash-balance-history', {
        params: { days }
      });
    } catch (error) {
      console.error('Error fetching cash balance history:', error);
      return []; // Return empty array to avoid UI crashes
    }
  },

  /**
   * Get expenses breakdown by category
   * @param {number} days - Number of days to fetch data for
   * @returns {Promise<Array<{category: string, total: number}>>} Expenses by category
   */
  getExpensesByCategory: async (days = 30) => {
    try {
      return await api.get('/dashboard/expenses-by-category', {
        params: { days }
      });
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
      return []; // Return empty array to avoid UI crashes
    }
  }
};

export default dashboardService;
