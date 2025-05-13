import { api } from '../lib/api';

/**
 * Service to handle summary-related API calls
 */
export const summaryService = {
  /**
   * Get inventory performance data
   * @returns {Promise<Object>} The inventory performance data
   */
  getInventoryPerformance: async () => {
    try {
      const response = await api.get('/summary/inventory-performance');
      
      // Add debugging logs
      console.log('Inventory performance API response:', response);
      
      // Verify that we have actual data
      if (!response || !response.summary) {
        console.warn('API response is missing expected data structure:', response);
      } else if (
        response.summary.totalRevenue === 0 && 
        response.summary.totalCost === 0 && 
        response.summary.totalProfit === 0
      ) {
        console.warn('All summary metrics are zero, this might indicate an issue:', response.summary);
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching inventory performance:', error);
      throw error;
    }
  },
  
  /**
   * Get monthly stock analysis data
   * @returns {Promise<Object>} The monthly stock analysis data
   */
  getMonthlyStockAnalysis: async () => {
    try {
      const response = await api.get('/summary/monthly-stock');
      
      console.log('Monthly stock analysis API response:', response);
      
      // Verify that we have actual data
      if (!response || !response.monthlyStockData || !Array.isArray(response.monthlyStockData)) {
        console.warn('API response is missing expected data structure:', response);
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching monthly stock analysis:', error);
      throw error;
    }
  }
};

export default summaryService; 