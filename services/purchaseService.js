import { api } from '@/lib/api';

/**
 * Service for handling purchase-related API requests
 */
const purchaseService = {
  /**
   * Get all purchases (using sales data)
   * @returns {Promise<Array>} List of purchase orders
   */
  getAllPurchases: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.search) queryParams.append('search', filters.search);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return await api.get(`/sales${queryString}`);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      throw error;
    }
  },

  /**
   * Get purchase details by ID
   * @param {string} id - Purchase ID
   * @returns {Promise<Object>} Purchase details
   */
  getPurchaseById: async (id) => {
    try {
      return await api.get(`/sales/${id}`);
    } catch (error) {
      console.error(`Error fetching purchase with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all suppliers
   * @returns {Promise<Array>} List of suppliers
   */
  getSuppliers: async () => {
    try {
      return await api.get('/suppliers');
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  },

  /**
   * Get inventory items
   * @returns {Promise<Array>} List of inventory items
   */
  getInventoryItems: async () => {
    try {
      return await api.get('/inventory');
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  }
};

export default purchaseService; 