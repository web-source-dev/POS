import { api } from './api';

/**
 * Inventory Service for managing inventory items
 */
export const inventoryService = {
  /**
   * Get all inventory items with optional filters
   */
  getItems: (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.status) queryParams.append('status', filters.status);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return api.get(`/inventory${queryString}`);
  },
  
  /**
   * Get a single inventory item by ID
   */
  getItem: (id) => api.get(`/inventory/${id}`),
  
  /**
   * Create a new inventory item
   */
  createItem: (itemData) => api.post('/inventory', itemData),
  
  /**
   * Update an existing inventory item
   */
  updateItem: (id, itemData) => api.put(`/inventory/${id}`, itemData),
  
  /**
   * Delete an inventory item
   */
  deleteItem: (id) => api.delete(`/inventory/${id}`),
  
  /**
   * Get list of all categories
   */
  getCategories: () => api.get('/inventory/categories/list'),
  
  /**
   * Get inventory statistics
   */
  getStats: () => api.get('/inventory/stats/summary')
}; 