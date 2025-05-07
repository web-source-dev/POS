import { api } from '@/lib/api';

/**
 * Service for handling supplier-related API requests
 */
const supplierService = {
  /**
   * Get all suppliers
   */
  getAllSuppliers: async () => {
    try {
      return await api.get('/suppliers');
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  },

  /**
   * Get supplier by ID
   */
  getSupplierById: async (id) => {
    try {
      return await api.get(`/suppliers/${id}`);
    } catch (error) {
      console.error(`Error fetching supplier with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new supplier
   */
  createSupplier: async (supplierData) => {
    try {
      return await api.post('/suppliers', supplierData);
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  },

  /**
   * Update an existing supplier
   */
  updateSupplier: async (id, supplierData) => {
    try {
      return await api.put(`/suppliers/${id}`, supplierData);
    } catch (error) {
      console.error(`Error updating supplier with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update supplier status
   */
  updateSupplierStatus: async (id, status) => {
    try {
      return await api.patch(`/suppliers/${id}/status`, { status });
    } catch (error) {
      console.error(`Error updating status for supplier with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a supplier (admin only)
   */
  deleteSupplier: async (id) => {
    try {
      return await api.delete(`/suppliers/${id}`);
    } catch (error) {
      console.error(`Error deleting supplier with ID ${id}:`, error);
      throw error;
    }
  }
};

export default supplierService; 