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
   * This triggers a file download
   */
  exportTodayData: () => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Create and click a temporary download link
    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/today/export`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `today-report-${new Date().toISOString().split('T')[0]}.csv`);
    
    // Set Authorization header
    link.setAttribute('data-auth', `Bearer ${token}`);
    
    // Programmatically fetch with authorization
    fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('Error downloading file:', error);
      throw error;
    });
  }
};

export default todayService; 