import { api } from "@/lib/api";
import settingsService from "./settingsService";

/**
 * POS Service for handling Point of Sale operations
 */
const posService = {
  /**
   * Get real-time inventory data
   * @returns {Promise<Array>} List of inventory items
   */
  getInventory: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return await api.get(`/inventory${queryString}`);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  /**
   * Complete a sale and update inventory
   * @param {Array} items - Array of items in the cart
   * @param {Object} saleData - Additional sale data (customer, discount, etc)
   * @returns {Promise<Object>} The completed sale information
   */
  completeSale: async (items, saleData = {}) => {
    try {
      const salePayload = {
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          sku: item.sku || ''
        })),
        total: saleData.total || 0,
        discount: saleData.discount || 0,
        cashAmount: saleData.cashAmount || 0,
        change: saleData.change || 0,
        customerName: saleData.customerName || '',
        date: new Date()
      };
      
      return await api.post('/sales/complete', salePayload);
    } catch (error) {
      console.error('Error completing sale:', error);
      throw error;
    }
  },
};

export default posService; 