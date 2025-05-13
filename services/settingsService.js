import { api } from '@/lib/api';

/**
 * Settings service for managing application settings
 */
const settingsService = {
  /**
   * Get all system settings
   * @returns {Promise<Object>} Settings object with business and pos settings
   */
  getSettings: async () => {
    try {
      return await api.get('/settings');
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  /**
   * Update business settings
   * @param {Object} businessSettings - The business settings to update
   * @returns {Promise<Object>} Updated settings
   */
  updateBusinessSettings: async (businessSettings) => {
    try {
      return await api.put('/settings/business', businessSettings);
    } catch (error) {
      console.error('Error updating business settings:', error);
      throw error;
    }
  },

  /**
   * Update POS settings
   * @param {Object} posSettings - The POS settings to update
   * @returns {Promise<Object>} Updated settings
   */
  updatePosSettings: async (posSettings) => {
    try {
      return await api.put('/settings/pos', posSettings);
    } catch (error) {
      console.error('Error updating POS settings:', error);
      throw error;
    }
  },

  /**
   * Upload receipt logo
   * @param {File} logoFile - The logo file to upload
   * @returns {Promise<Object>} Response with logo URL
   */
  uploadLogo: async (logoFile) => {
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      
      // Use fetch directly for file upload
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/settings/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload logo');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  },

  /**
   * Delete receipt logo
   * @returns {Promise<Object>} Response confirming deletion
   */
  deleteLogo: async () => {
    try {
      return await api.delete('/settings/logo');
    } catch (error) {
      console.error('Error deleting logo:', error);
      throw error;
    }
  }
};

export default settingsService; 