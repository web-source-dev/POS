import { api } from "@/lib/api";

// Base date ranges for reports
export const DATE_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_YEAR: 'this_year',
  CUSTOM: 'custom'
};

// Helper to format dates for API requests
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Get date range based on selected period
export const getDateRange = (period, customRange = {}) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case DATE_RANGES.TODAY:
      return { 
        startDate: formatDate(today), 
        endDate: formatDate(now) 
      };
    
    case DATE_RANGES.YESTERDAY:
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { 
        startDate: formatDate(yesterday), 
        endDate: formatDate(yesterday) 
      };
    
    case DATE_RANGES.THIS_WEEK:
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      return { 
        startDate: formatDate(thisWeekStart), 
        endDate: formatDate(now) 
      };
    
    case DATE_RANGES.LAST_WEEK:
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      return { 
        startDate: formatDate(lastWeekStart), 
        endDate: formatDate(lastWeekEnd) 
      };
    
    case DATE_RANGES.THIS_MONTH:
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { 
        startDate: formatDate(thisMonthStart), 
        endDate: formatDate(now) 
      };
    
    case DATE_RANGES.LAST_MONTH:
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return { 
        startDate: formatDate(lastMonthStart), 
        endDate: formatDate(lastMonthEnd) 
      };
    
    case DATE_RANGES.THIS_YEAR:
      const thisYearStart = new Date(today.getFullYear(), 0, 1);
      return { 
        startDate: formatDate(thisYearStart), 
        endDate: formatDate(now) 
      };
    
    case DATE_RANGES.CUSTOM:
      return { 
        startDate: formatDate(new Date(customRange.startDate)), 
        endDate: formatDate(new Date(customRange.endDate)) 
      };
    
    default:
      return { 
        startDate: formatDate(today), 
        endDate: formatDate(now) 
      };
  }
};

// Report Service Object
const reportService = {
  // Sales Reports
  getSalesReport: async (dateRange) => {
    return api.get('/reports/sales', { params: dateRange });
  },
  
  getSalesByCategory: async (dateRange) => {
    return api.get('/reports/sales/category', { params: dateRange });
  },
  
  getSalesByProduct: async (dateRange) => {
    return api.get('/reports/sales/products', { params: dateRange });
  },
  
  getSalesTrends: async (dateRange, interval = 'day') => {
    return api.get('/reports/sales/trends', { 
      params: { ...dateRange, interval } 
    });
  },
  
  // Inventory Reports
  getInventoryReport: async () => {
    return api.get('/reports/inventory');
  },
  
  getInventoryValuation: async () => {
    return api.get('/reports/inventory/valuation');
  },
  
  getLowStockItems: async () => {
    return api.get('/reports/inventory/low-stock');
  },
  
  getInventoryByCategory: async () => {
    return api.get('/reports/inventory/category');
  },
  
  // Financial Reports
  getFinancialSummary: async (dateRange) => {
    return api.get('/reports/financial/summary', { params: dateRange });
  },
  
  getProfitAndLoss: async (dateRange) => {
    return api.get('/reports/financial/profit-loss', { params: dateRange });
  },
  
  getCashFlow: async (dateRange) => {
    return api.get('/reports/financial/cash-flow', { params: dateRange });
  },
  
  // Expense Reports
  getExpensesByCategory: async (dateRange) => {
    return api.get('/reports/expenses/category', { params: dateRange });
  },
  
  getExpensesTrends: async (dateRange, interval = 'day') => {
    return api.get('/reports/expenses/trends', { 
      params: { ...dateRange, interval } 
    });
  },
  
  // Supplier Reports
  getSupplierReport: async () => {
    return api.get('/reports/suppliers');
  },

  // Add getCashDrawer method
  getCashDrawer: async (dateRange) => {
    try {
      const response = await api.get('/reports/cash-drawer', { params: dateRange });
      return response;
    } catch (error) {
      console.error('Error fetching cash drawer data:', error);
      // Return a structured error response similar to a successful response
      return {
        success: false,
        error: error.message || 'Failed to fetch cash drawer data',
        data: []
      };
    }
  },

  // Add getExpenseTransactions method
  getExpenseTransactions: async (dateRange) => {
    try {
      const response = await api.get('/reports/expenses/transactions', { params: dateRange });
      return response;
    } catch (error) {
      console.error('Error fetching expense transactions:', error);
      // Return a structured error response similar to a successful response
      return {
        success: false,
        error: error.message || 'Failed to fetch expense transactions',
        data: []
      };
    }
  }
};

export default reportService;
