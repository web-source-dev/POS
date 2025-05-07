import { api } from "@/lib/api";

/**
 * Reports Service for fetching and managing report data
 */
const reportService = {
  /**
   * Get sales report data
   * @param {string} timeframe - Time period (daily, weekly, monthly, yearly)
   * @param {Object} dateRange - Optional specific date range (startDate, endDate)
   * @returns {Promise<Object>} Sales report data including chart data and summary metrics
   */
  getSalesReport: async (timeframe = 'daily', dateRange = {}) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('timeframe', timeframe);
      
      if (dateRange.startDate) {
        queryParams.append('startDate', dateRange.startDate);
      }
      
      if (dateRange.endDate) {
        queryParams.append('endDate', dateRange.endDate);
      }
      
      const queryString = `?${queryParams.toString()}`;
      return await api.get(`/reports/sales${queryString}`);
    } catch (error) {
      console.error('Error fetching sales report:', error);
      throw error;
    }
  },

  /**
   * Get inventory value trend data
   * @returns {Promise<Object>} Inventory value trend data
   */
  getInventoryValueTrend: async () => {
    try {
      const response = await api.get('/reports/inventory-value');
      
      // Ensure the response has the expected structure
      if (!response || !response.chartData) {
        throw new Error('Invalid response format from inventory value API');
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching inventory value trend:', error);
      throw error;
    }
  },

  /**
   * Get sales by category data
   * @param {string} timeframe - Time period (daily, weekly, monthly, yearly)
   * @returns {Promise<Object>} Category distribution data
   */
  getCategorySales: async (timeframe = 'monthly') => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('timeframe', timeframe);
      
      const queryString = `?${queryParams.toString()}`;
      const response = await api.get(`/reports/categories${queryString}`);
      
      // Ensure the response has the expected structure
      if (!response || !response.chartData) {
        throw new Error('Invalid response format from category sales API');
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching category sales:', error);
      throw error;
    }
  },

  /**
   * Export report data to CSV or PDF
   * @param {string} reportType - Type of report to export
   * @param {string} format - Export format (csv, pdf)
   * @param {Object} filters - Any filters to apply
   * @returns {Promise<Blob>} The file data
   */
  exportReport: async (reportType, format = 'csv', filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      // Add any additional filters
      Object.entries(filters).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      
      const queryString = `?${queryParams.toString()}`;
      
      // Using fetch directly to get a blob response
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/reports/export/${reportType}${queryString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }
};

export default reportService; 