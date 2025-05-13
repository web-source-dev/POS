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
      // Validate items to ensure they have all required properties
      const validatedItems = items.map(item => {
        // Make sure we have all the required fields with proper types
        return {
          id: item.id || '',
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
          name: item.name || 'Unknown Item',
          sku: item.sku || ''
        };
      });
      
      // Check for any items without an ID and log warning
      const invalidItems = validatedItems.filter(item => !item.id);
      if (invalidItems.length > 0) {
        console.warn('Some items are missing IDs:', invalidItems);
      }
      
      const salePayload = {
        items: validatedItems,
        total: saleData.total || 0,
        discount: saleData.discount || 0,
        cashAmount: saleData.cashAmount || 0,
        change: saleData.change || 0,
        customerName: saleData.customerName || '',
        date: new Date()
      };
      
      // Log the payload being sent
      console.log('Sending sale payload:', salePayload);
      
      const response = await api.post('/sales/complete', salePayload);
      
      // Log the response for debugging
      console.log('Sale complete response:', response);
      
      return response;
    } catch (error) {
      console.error('Error completing sale:', error);
      throw error;
    }
  },

  /**
   * Get sale details by ID
   * @param {string} saleId - The ID of the sale to fetch
   * @returns {Promise<Object>} The sale details
   */
  getSaleById: async (saleId) => {
    try {
      return await api.get(`/sales/${saleId}`);
    } catch (error) {
      console.error('Error fetching sale details:', error);
      throw error;
    }
  },

  /**
   * Mark a sale as printed
   * @param {string} saleId - The ID of the sale to mark as printed
   * @returns {Promise<Object>} The updated sale
   */
  markAsPrinted: async (saleId) => {
    try {
      return await api.patch(`/sales/${saleId}/printed`, {});
    } catch (error) {
      console.error('Error marking sale as printed:', error);
      throw error;
    }
  },

  /**
   * Get business settings for receipt printing
   * @returns {Promise<Object>} The business settings
   */
  getReceiptSettings: async () => {
    try {
      return await settingsService.getSettings();
    } catch (error) {
      console.error('Error fetching receipt settings:', error);
      throw error;
    }
  },

  /**
   * Prepare logo URL for receipt printing
   * @param {string} logoPath - The path to the logo stored in settings
   * @returns {string} The full URL to the logo
   */
  prepareLogoUrl: (logoPath) => {
    if (!logoPath) return '';
    
    // If logo is already a full URL
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      return logoPath;
    }
    
    // Get the API base URL from environment or use a default
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    
    // Ensure path has a leading slash
    const normalizedPath = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
    
    return `${apiBaseUrl}${normalizedPath}`;
  }
};

export default posService; 