import { api } from '@/lib/api';

/**
 * Service for fetching dashboard-related data from the API
 */
const dashboardService = {
  /**
   * Get financial summary for the dashboard
   */
  getFinancialSummary: async (period = 'today') => {
    try {
      const response = await api.get(`/finance/summary?period=${period}`);
      return response.summary;
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      throw error;
    }
  },

  /**
   * Get low stock and out of stock inventory items
   */
  getInventoryAlerts: async () => {
    try {
      const response = await api.get('/inventory?status=Low%20Stock,Out%20of%20Stock');
      return response;
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
      throw error;
    }
  },

  /**
   * Get inventory statistics
   */
  getInventoryStats: async () => {
    try {
      const response = await api.get('/inventory/stats/summary');
      return response;
    } catch (error) {
      console.error('Error fetching inventory statistics:', error);
      throw error;
    }
  },

  /**
   * Get recent sales transactions
   */
  getRecentTransactions: async (limit = 5) => {
    try {
      const response = await api.get(`/sales/history?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  },

  /**
   * Get sales data for chart
   */
  getSalesChartData: async (timeframe = 'daily') => {
    try {
      const response = await api.get(`/reports/sales?timeframe=${timeframe}`);
      return response.chartData;
    } catch (error) {
      console.error('Error fetching sales chart data:', error);
      throw error;
    }
  },

  /**
   * Get top selling items
   */
  getTopSellingItems: async (timeframe = 'monthly', limit = 5) => {
    try {
      // Assuming the backend has an endpoint for this
      const response = await api.get(`/reports/top-selling?timeframe=${timeframe}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error fetching top selling items:', error);
      throw error;
    }
  },

  /**
   * Get all inventory items
   */
  getAllInventory: async (category = '', search = '') => {
    try {
      let url = '/inventory';
      const params = [];
      
      if (category) {
        params.push(`category=${encodeURIComponent(category)}`);
      }
      
      if (search) {
        params.push(`search=${encodeURIComponent(search)}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  },

  /**
   * Get inventory categories
   */
  getInventoryCategories: async () => {
    try {
      const response = await api.get('/inventory/categories/list');
      return response;
    } catch (error) {
      console.error('Error fetching inventory categories:', error);
      throw error;
    }
  },

  /**
   * Get detailed sales report with summary
   */
  getSalesReport: async (timeframe = 'monthly', startDate = null, endDate = null) => {
    try {
      let url = `/reports/sales?timeframe=${timeframe}`;
      
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Error fetching sales report:', error);
      throw error;
    }
  },

  /**
   * Get sales by category data
   */
  getSalesByCategory: async (timeframe = 'monthly') => {
    try {
      const response = await api.get(`/reports/categories?timeframe=${timeframe}`);
      return response.chartData;
    } catch (error) {
      console.error('Error fetching sales by category:', error);
      throw error;
    }
  }
};

export default dashboardService; 