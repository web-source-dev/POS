import { api } from '../lib/api';
import { 
  TaxSettings, 
  TaxRecord, 
  TaxCalculationResult, 
  ZakatCalculationResult,
  TaxSummary
} from '@/types/tax';

/**
 * Get tax settings
 * @returns {Promise<TaxSettings>} Tax settings
 */
export const getTaxSettings = async () => {
  try {
    const response = await api.get('/tax/settings');
    return response;
  } catch (error) {
    console.error('Error fetching tax settings:', error);
    throw error;
  }
};

/**
 * Update tax settings
 * @param {Partial<TaxSettings>} settings - Updated tax settings
 * @returns {Promise<TaxSettings>} Updated tax settings
 */
export const updateTaxSettings = async (settings) => {
  try {
    const response = await api.put('/tax/settings', settings);
    return response;
  } catch (error) {
    console.error('Error updating tax settings:', error);
    throw error;
  }
};



/**
 * Get tax records
 * @param {TaxRecordParams} params - Query parameters
 * @returns {Promise<TaxRecord[]>} List of tax records
 */
export const getTaxRecords = async (params = {}) => {
  try {
    const response = await api.get('/tax/records', { params });
    return response.map(tax => ({
      ...tax,
      id: tax._id,
      // Format dates for display
      periodStartFormatted: new Date(tax.taxPeriod.startDate).toLocaleDateString(),
      periodEndFormatted: new Date(tax.taxPeriod.endDate).toLocaleDateString(),
      paymentDateFormatted: tax.paymentDate ? new Date(tax.paymentDate).toLocaleDateString() : '-',
      createdAtFormatted: new Date(tax.createdAt).toLocaleDateString()
    }));
  } catch (error) {
    console.error('Error fetching tax records:', error);
    throw error;
  }
};

/**
 * Add a tax record
 * @param {Partial<TaxRecord>} tax - Tax record data
 * @returns {Promise<TaxRecord>} Created tax record
 */
export const addTaxRecord = async (tax) => {
  try {
    const response = await api.post('/tax/records', tax);
    return response;
  } catch (error) {
    console.error('Error adding tax record:', error);
    throw error;
  }
};

/**
 * Update a tax record
 * @param {string} id - Tax record ID
 * @param {Partial<TaxRecord>} tax - Updated tax record data
 * @returns {Promise<TaxRecord>} Updated tax record
 */
export const updateTaxRecord = async (id, tax) => {
  try {
    const response = await api.put(`/tax/records/${id}`, tax);
    return response;
  } catch (error) {
    console.error('Error updating tax record:', error);
    throw error;
  }
};

/**
 * Delete a tax record
 * @param {string} id - Tax record ID
 * @returns {Promise<{message: string}>} Response message
 */
export const deleteTaxRecord = async (id) => {
  try {
    const response = await api.delete(`/tax/records/${id}`);
    return response;
  } catch (error) {
    console.error('Error deleting tax record:', error);
    throw error;
  }
};

/**
 * Calculate income tax
 * @param {number} annualIncome - Annual income amount
 * @returns {Promise<TaxCalculationResult>} Tax calculation result
 */
export const calculateIncomeTax = async (annualIncome) => {
  try {
    // Make sure annualIncome is a valid number
    if (annualIncome === undefined || annualIncome === null || isNaN(annualIncome)) {
      throw new Error('Valid annual income is required');
    }
    
    // Use the params object approach with our fixed API layer
    const response = await api.get('/tax/calculate/income', { 
      params: { annualIncome: annualIncome } 
    });
    return response;
  } catch (error) {
    console.error('Error calculating income tax:', error);
    throw error;
  }
};

/**
 * Calculate Zakat
 * @param {number} netAssets - Net assets value
 * @returns {Promise<ZakatCalculationResult>} Zakat calculation result
 */
export const calculateZakat = async (netAssets) => {
  try {
    // Make sure netAssets is a valid number
    if (netAssets === undefined || netAssets === null || isNaN(netAssets)) {
      throw new Error('Valid net assets value is required');
    }
    
    // Use the params object approach with our fixed API layer
    const response = await api.get('/tax/calculate/zakat', { 
      params: { netAssets: netAssets } 
    });
    return response;
  } catch (error) {
    console.error('Error calculating Zakat:', error);
    throw error;
  }
};


/**
 * Get tax summary
 * @param {TaxSummaryParams} params - Query parameters
 * @returns {Promise<TaxSummary>} Tax summary data
 */
export const getTaxSummary = async (params = {}) => {
  try {
    const response = await api.get('/tax/summary', { params });
    return response;
  } catch (error) {
    console.error('Error fetching tax summary:', error);
    throw error;
  }
};

// Add a function to handle tax payments through cash drawer


/**
 * Record a tax payment through the cash drawer
 * @param {TaxPaymentToCashDrawer} paymentData - Payment data
 * @returns {Promise<TaxRecord>} Updated tax record
 */
export const recordTaxPaymentToCashDrawer = async (
  paymentData
) => {
  try {
    const response = await api.post('/tax/payment', paymentData);
    return response;
  } catch (error) {
    console.error('Error recording tax payment:', error);
    throw error;
  }
};

const taxService = {
  getTaxSettings,
  updateTaxSettings,
  getTaxRecords,
  addTaxRecord,
  updateTaxRecord,
  deleteTaxRecord,
  calculateIncomeTax,
  calculateZakat,
  getTaxSummary,
  recordTaxPaymentToCashDrawer
};

export default taxService; 