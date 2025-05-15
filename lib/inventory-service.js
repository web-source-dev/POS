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
    if (filters.subcategory2) queryParams.append('subcategory2', filters.subcategory2);
    
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
   * @param {string} category - Optional category to filter suppliers
   * @param {string} subcategory - Optional subcategory to filter suppliers
   * @param {string} brand - Optional brand to filter suppliers
   */
  getSuppliers: (category, subcategory, brand) => {
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    if (subcategory) queryParams.append('subcategory', subcategory);
    if (brand) queryParams.append('brand', brand);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return api.get(`/inventory/suppliers/list${queryString}`);
  },
  
  /**
   * Get list of all brands
   * @param {string} category - Optional category to filter brands
   * @param {string} subcategory - Optional subcategory to filter brands 
   */
  getBrands: (category, subcategory) => {
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    if (subcategory) queryParams.append('subcategory', subcategory);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return api.get(`/inventory/brands/list${queryString}`);
  },
  
  /**
   * Get list of all subcategories
   * @param {string} category - Optional category to filter subcategories
   */
  getSubcategories: (category) => {
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return api.get(`/inventory/subcategories/list${queryString}`);
  },
  
  /**
   * Get list of all subcategory2 values
   * @param {string} category - Optional category to filter subcategory2 values
   * @param {string} subcategory - Optional subcategory to filter subcategory2 values
   */
  getSubcategories2: (category, subcategory) => {
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    if (subcategory) queryParams.append('subcategory', subcategory);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return api.get(`/inventory/subcategories2/list${queryString}`);
  },
  
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
  },
  
  /**
   * Get sales history for a specific inventory item
   * @param {string} itemId - ID of the inventory item
   * @param {Object} filters - Optional filters for the sales history
   * @param {string} filters.startDate - Optional start date filter (ISO string)
   * @param {string} filters.endDate - Optional end date filter (ISO string)
   * @param {string} filters.customer - Optional customer name filter
   */
  getItemSalesHistory: (itemId, filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.customer) queryParams.append('customer', filters.customer);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return api.get(`/inventory/${itemId}/sales${queryString}`);
  },
  
  /**
   * Download inventory template for bulk upload
   */
  downloadTemplate: () => {
    // Create URL to the template endpoint
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/inventory/bulk-upload/template`;
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Create a link element and simulate click to download the file
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    
    // Set headers for the request
    if (token) {
      // We need to fetch the file and then create a blob URL for it
      fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        link.href = blobUrl;
        link.download = 'inventory_template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      });
    }
  },
  
  /**
   * Upload inventory items in bulk via CSV
   * @param {FormData} formData - Form data with CSV file
   */
  bulkUpload: (formData) => {
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/inventory/bulk-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    }).then(response => {
      if (!response.ok) throw new Error('Failed to upload inventory items');
      return response.json();
    });
  },
  
  /**
   * Get list of all vehicle names
   * @param {string} category - Optional category to filter vehicles
   * @param {string} subcategory - Optional subcategory to filter vehicles
   * @param {string} brand - Optional brand to filter vehicles
   */
  getVehicles: (category, subcategory, brand) => {
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    if (subcategory) queryParams.append('subcategory', subcategory);
    if (brand) queryParams.append('brand', brand);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return api.get(`/inventory/vehicles/list${queryString}`);
  },
}; 