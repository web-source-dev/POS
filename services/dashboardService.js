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
