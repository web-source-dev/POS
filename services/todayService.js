import { api } from '../lib/api';

/**
 * Service for interacting with the Today API endpoints
 */
const todayService = {
  /**
   * Get all data for today including sales, expenses, and metrics
   */
  getTodayData: async () => {
    try {
      const response = await api.get('/today');
      return response.data;
    } catch (error) {
      console.error('Error fetching today data:', error);
      throw error;
    }
  },

  /**
   * Download today's data as CSV
   * This triggers a file download with receipt information
   */
  exportTodayData: async () => {
    try {
      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/today/export`;
      
      // Use fetch with proper headers
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export error details:', errorText);
        throw new Error(`Export failed with status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Format date for filename: YYYY-MM-DD
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      
      // Create and use a download link with improved filename
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `today-report-${dateString}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
};

export default todayService; 