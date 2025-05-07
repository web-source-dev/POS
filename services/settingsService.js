import { api } from '@/lib/api';

/**
 * Settings service for managing application settings
 */
const settingsService = {
  /**
   * Get all system settings
   * @returns {Promise<Object>} Settings object with business, pos, and hardware settings
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
   * Update hardware settings
   * @param {Object} hardwareSettings - The hardware settings to update
   * @returns {Promise<Object>} Updated settings
   */
  updateHardwareSettings: async (hardwareSettings) => {
    try {
      return await api.put('/settings/hardware', hardwareSettings);
    } catch (error) {
      console.error('Error updating hardware settings:', error);
      throw error;
    }
  }
};

export default settingsService; 