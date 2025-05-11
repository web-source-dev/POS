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
    if (filters.supplier) queryParams.append('supplier', filters.supplier);
    if (filters.brand) queryParams.append('brand', filters.brand);
    if (filters.subcategory) queryParams.append('subcategory', filters.subcategory);
    
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
   * Get list of all suppliers
   */
  getSuppliers: () => api.get('/inventory/suppliers/list'),
  
  /**
   * Get list of all brands
   */
  getBrands: () => api.get('/inventory/brands/list'),
  
  /**
   * Get list of all subcategories
   */
  getSubcategories: () => api.get('/inventory/subcategories/list'),
  
  /**
   * Get inventory statistics
   */
  getStats: () => api.get('/inventory/stats/summary'),
  
  /**
   * Upload product image
   */
  uploadImage: (formData) => {
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/inventory/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    }).then(response => {
      if (!response.ok) throw new Error('Failed to upload image');
      return response.json();
    });
  }
}; 