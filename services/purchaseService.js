import { api } from '@/lib/api';

/**
 * Service for handling purchase-related API requests
 */
const purchaseService = {
  /**
   * Get all purchases (using sales data)
   * @param {Object} filters - Optional filters for the query
   * @returns {Promise<Array>} List of purchase orders
   */
  getAllPurchases: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
      if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
      if (filters.customer) queryParams.append('customer', filters.customer);
      
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
   * Get recent purchases
   * @param {number} limit - Number of purchases to return
   * @returns {Promise<Array>} List of recent purchases
   */
  getRecentPurchases: async (limit = 10) => {
    try {
      return await api.get(`/sales/history?limit=${limit}`);
    } catch (error) {
      console.error('Error fetching recent purchases:', error);
      throw error;
    }
  },

  /**
   * Export purchases to CSV format
   * @param {Array} purchases - List of purchases to export
   * @returns {string} CSV content
   */
  exportPurchasesToCsv: (purchases) => {
    try {
      // Define enhanced CSV headers
      const headers = [
        'Receipt Number',
        'Order ID', 
        'Customer', 
        'Date', 
        'Time',
        'Items Count', 
        'Total Quantity',
        'Subtotal',
        'Discount',
        'Total', 
        'Cash Amount',
        'Change',
        'Payment Status'
      ];
      
      // Map purchase data to CSV rows with more detail
      const rows = purchases.map(purchase => {
        const purchaseDate = new Date(purchase.date);
        return [
          purchase.receiptNumber || `#${purchase._id.slice(-6).padStart(6, '0')}`,
          purchase._id,
          purchase.customerName || 'Anonymous',
          purchaseDate.toLocaleDateString(),
          purchaseDate.toLocaleTimeString(),
          purchase.items.length.toString(),
          purchase.items.reduce((sum, item) => sum + item.quantity, 0).toString(),
          purchase.subtotal.toFixed(2),
          purchase.discount.toFixed(2),
          purchase.total.toFixed(2),
          purchase.cashAmount ? purchase.cashAmount.toFixed(2) : purchase.total.toFixed(2),
          purchase.change ? purchase.change.toFixed(2) : '0.00',
          'Completed'
        ];
      });
      
      // Combine headers and rows
      return [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
    } catch (error) {
      console.error('Error exporting purchases to CSV:', error);
      throw error;
    }
  },

  /**
   * Get purchase statistics 
   * @returns {Promise<Object>} Purchase statistics
   */
  getPurchaseStats: async () => {
    try {
      // This would ideally be a backend endpoint, but we can calculate this
      // on the frontend for now until a proper endpoint is created
      const purchases = await purchaseService.getAllPurchases();
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const recentPurchases = purchases.filter(p => 
        new Date(p.date) >= oneWeekAgo
      );
      
      const monthlyPurchases = purchases.filter(p => 
        new Date(p.date) >= oneMonthAgo
      );
      
      const totalRevenue = purchases.reduce((sum, p) => sum + p.total, 0);
      const recentRevenue = recentPurchases.reduce((sum, p) => sum + p.total, 0);
      const monthlyRevenue = monthlyPurchases.reduce((sum, p) => sum + p.total, 0);
      
      return {
        totalOrders: purchases.length,
        totalRevenue,
        recentOrders: recentPurchases.length,
        recentRevenue,
        monthlyOrders: monthlyPurchases.length,
        monthlyRevenue,
        averageOrderValue: purchases.length ? totalRevenue / purchases.length : 0,
        mostRecentOrder: purchases.length ? purchases[0] : null
      };
    } catch (error) {
      console.error('Error calculating purchase statistics:', error);
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