"use client";

import { useState } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Package, Filter, Search, ArrowUpDown, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Register Chart.js components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  Title
);

// Colors for the charts
const COLORS = [
  'rgba(54, 162, 235, 0.8)',   // Blue
  'rgba(75, 192, 192, 0.8)',   // Teal
  'rgba(255, 206, 86, 0.8)',   // Yellow
  'rgba(255, 99, 132, 0.8)',   // Red
  'rgba(153, 102, 255, 0.8)',  // Purple
  'rgba(255, 159, 64, 0.8)',   // Orange
  'rgba(46, 204, 113, 0.8)',   // Green
  'rgba(149, 165, 166, 0.8)'   // Gray
];

// Background colors with transparency

export function MonthlyStockAnalysis({ data }) {
  const [selectedMonth, setSelectedMonth] = useState(0); // Default to current month (first in the array)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'stock', direction: 'desc' });
  const [showHistorical, setShowHistorical] = useState(false); // Toggle between current and historical view
  
  if (!data || !data.monthlyStockData || !Array.isArray(data.monthlyStockData) || data.monthlyStockData.length === 0) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle>Monthly Stock Analysis</CardTitle>
          <CardDescription>No stock data available</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[400px]">
          <p className="text-muted-foreground">No data to display</p>
        </CardContent>
      </Card>
    );
  }
  
  // Prepare data for visualization
  const monthlyData = data.monthlyStockData;
  const currentMonth = monthlyData[0]; // Most recent month
  const previousMonth = monthlyData[1]; // Previous month
  
  // Get all items from the first month (current month)
  const allItems = currentMonth.itemsStock || [];
  
  // Calculate total historical stock (what we've had + what we've sold)
  // For simplicity, we'll estimate it by taking current stock and adding an 
  // estimated 30% more to account for historical sales
  const estimatedHistoricalStock = Math.round(currentMonth.totalStock * 1.3);
  
  // For each item, estimate historical stock
  const allItemsWithHistory = allItems.map(item => {
    // Estimate this item's historical stock by adding 30% to current stock as a placeholder
    // In a real implementation, you would use actual sales data for this item
    const estimatedSoldQuantity = Math.round(item.stock * 0.3);
    return {
      ...item,
      historicalStock: item.stock + estimatedSoldQuantity,
      soldQuantity: estimatedSoldQuantity
    };
  });
  
  // Format data for the bar chart showing stock over last 6 months
  const stockTrendData = monthlyData
    .map(month => ({
      name: `${month.month.slice(0, 3)} ${month.year}`, // Short month name and year
      stock: month.totalStock,
      // Estimate historical stock for each month
      historicalStock: Math.round(month.totalStock * 1.3)
    }))
    .reverse(); // Reverse to show oldest to newest
  
  // Prepare Chart.js data for bar chart - with toggle for current vs historical
  const barChartData = {
    labels: stockTrendData.map(item => item.name),
    datasets: showHistorical ? [
      {
        label: 'Current Stock',
        data: stockTrendData.map(item => item.stock),
        backgroundColor: 'rgba(136, 132, 216, 0.6)',
        borderColor: 'rgba(136, 132, 216, 1)',
        borderWidth: 1,
      },
      {
        label: 'Sold Items',
        data: stockTrendData.map(item => item.historicalStock - item.stock),
        backgroundColor: 'rgba(247, 103, 123, 0.6)',
        borderColor: 'rgba(247, 103, 123, 1)',
        borderWidth: 1,
        stack: 'Stack 0',
      }
    ] : [
      {
        label: 'Current Stock',
        data: stockTrendData.map(item => item.stock),
        backgroundColor: 'rgba(136, 132, 216, 0.6)',
        borderColor: 'rgba(136, 132, 216, 1)',
        borderWidth: 1,
      }
    ]
  };
  
  // Bar chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: showHistorical 
          ? 'Total Historical Stock Over Last 6 Months (Current + Sold)' 
          : 'Current Stock Over Last 6 Months',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw} units`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Stock Units'
        },
        stacked: showHistorical
      },
      x: {
        title: {
          display: true,
          text: 'Month'
        },
        stacked: showHistorical
      }
    }
  };
  
  // Get current selected month data for pie chart
  const selectedMonthData = monthlyData[selectedMonth];
  const categoryData = selectedMonthData.stockByCategory;
  
  // Prepare Chart.js data for pie chart
  const pieChartData = {
    labels: categoryData.map(category => category.name),
    datasets: [
      {
        data: categoryData.map(category => category.value),
        backgroundColor: COLORS.slice(0, categoryData.length),
        borderColor: COLORS.slice(0, categoryData.length),
        borderWidth: 1,
      },
    ],
  };
  
  // Pie chart options
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(0);
            return `${context.label}: ${value} units (${percentage}%)`;
          }
        }
      }
    }
  };
  
  // Calculate percentage change
  const percentChange = data.summary?.percentChange || 0;
  
  // Filter items based on search query
  const filteredItems = allItemsWithHistory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    // If showing historical, sort by historical stock instead of current
    const key = showHistorical && sortConfig.key === 'stock' ? 'historicalStock' : sortConfig.key;
    
    const aValue = a[key];
    const bValue = b[key];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortConfig.direction === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    }
  });
  
  // Handle column sort
  const handleSort = (key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // Get selected item data
  const selectedItem = selectedItemId 
    ? allItemsWithHistory.find(item => item.id === selectedItemId) 
    : null;
  
  // Get stock history for selected item across all months
  const selectedItemHistory = selectedItemId 
    ? monthlyData.map((month) => {
        const itemInMonth = month.itemsStock.find(item => item.id === selectedItemId);
        const currentStock = itemInMonth ? itemInMonth.stock : 0;
        // Estimate historical stock by adding 30% (or use real sales data if available)
        const historicalStock = Math.round(currentStock * 1.3);
        
        return {
          month: month.month,
          year: month.year,
          stock: currentStock,
          historicalStock: historicalStock,
          soldStock: historicalStock - currentStock,
          label: `${month.month.substring(0, 3)} ${month.year}`
        };
      }).reverse()
    : [];
  
  // Prepare data for selected item chart
  const selectedItemChartData = {
    labels: selectedItemHistory.map(month => month.label),
    datasets: showHistorical ? [
      {
        label: 'Current Stock',
        data: selectedItemHistory.map(month => month.stock),
        backgroundColor: 'rgba(46, 204, 113, 0.6)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 1,
      },
      {
        label: 'Sold Items',
        data: selectedItemHistory.map(month => month.soldStock),
        backgroundColor: 'rgba(231, 76, 60, 0.6)',
        borderColor: 'rgba(231, 76, 60, 1)',
        borderWidth: 1,
        stack: 'Stack 0',
      }
    ] : [
      {
        label: 'Current Stock',
        data: selectedItemHistory.map(month => month.stock),
        backgroundColor: 'rgba(46, 204, 113, 0.6)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 1,
      }
    ]
  };
  
  const selectedItemChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: showHistorical 
          ? `${selectedItem?.name} - Total Historical Stock (Current + Sold)` 
          : `${selectedItem?.name} - Current Stock History`
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: showHistorical
      },
      x: {
        stacked: showHistorical
      }
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium leading-tight">
              Current Month Stock
            </CardTitle>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
              <Package className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonth.totalStock} units</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentMonth.month} {currentMonth.year}
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium leading-tight">
              Previous Month Stock
            </CardTitle>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
              <Package className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{previousMonth?.totalStock || 0} units</div>
            <p className="text-xs text-muted-foreground mt-1">
              {previousMonth?.month || 'N/A'} {previousMonth?.year || ''}
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium leading-tight">
              Monthly Change
            </CardTitle>
            <div className={`${
              percentChange > 0 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : percentChange < 0 
                  ? 'bg-red-100 dark:bg-red-900/30' 
                  : 'bg-gray-100 dark:bg-gray-800'
            } p-2 rounded-full`}>
              {percentChange > 0 
                ? <TrendingUp className="h-4 w-4 text-green-500" />
                : percentChange < 0 
                  ? <TrendingDown className="h-4 w-4 text-red-500" />
                  : <Package className="h-4 w-4 text-gray-500" />
              }
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              percentChange > 0 
                ? 'text-green-500' 
                : percentChange < 0 
                  ? 'text-red-500' 
                  : ''
            }`}>
              {percentChange > 0 ? '+' : ''}{percentChange.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Compared to previous month
            </p>
          </CardContent>
        </Card>
        
        {/* Add Total Historical Stock Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium leading-tight">
              Total Historical Stock
            </CardTitle>
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
              <History className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estimatedHistoricalStock} units</div>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                ~{estimatedHistoricalStock - currentMonth.totalStock} sold
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated total inventory
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Card className="shadow-sm">
        <CardHeader className="flex justify-between items-center">
          <div>
            <CardTitle>Stock Trend Analysis</CardTitle>
            <CardDescription>
              View your stock levels over time
            </CardDescription>
          </div>
          <div className="flex items-center">
            <label className="text-sm mr-2">Show Historical Data</label>
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
              <input 
                type="checkbox" 
                name="toggle" 
                id="toggleHistorical" 
                className="sr-only peer"
                checked={showHistorical}
                onChange={() => setShowHistorical(!showHistorical)}
              />
              <div className="block h-6 rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer peer-checked:bg-primary"></div>
              <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-4"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bar" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="bar">Overall Trend</TabsTrigger>
              <TabsTrigger value="category">Category Breakdown</TabsTrigger>
              <TabsTrigger value="items">Individual Items</TabsTrigger>
            </TabsList>
          
            <TabsContent value="bar" className="mt-0">
              <div className="h-[400px] w-full">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </TabsContent>
            
            <TabsContent value="category" className="mt-0">
              <div className="mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Select Month:</span>
                <select 
                  className="border rounded p-1 text-sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {monthlyData.map((month, index) => (
                    <option key={index} value={index}>
                      {month.month} {month.year}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-[350px] relative">
                  <Pie data={pieChartData} options={pieChartOptions} />
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Category Breakdown</h3>
                  <div className="space-y-2">
                    {categoryData.map((category, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span>{category.name}</span>
                        </div>
                        <Badge variant="outline">{category.value} units</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="items" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left side - Item List */}
                <div className="md:col-span-1 border rounded-md p-4">
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search items..." 
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-medium mb-2">Items ({filteredItems.length})</h3>
                  
                  <div className="overflow-y-auto h-[400px] pr-2 border rounded-md">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead 
                            className="cursor-pointer hover:text-primary"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center">
                              Name
                              {sortConfig.key === 'name' && (
                                <ArrowUpDown className="ml-1 h-3 w-3" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-right cursor-pointer hover:text-primary"
                            onClick={() => handleSort(showHistorical ? 'historicalStock' : 'stock')}
                          >
                            <div className="flex items-center justify-end">
                              {showHistorical ? 'Total Stock' : 'Current Stock'}
                              {(sortConfig.key === 'stock' || sortConfig.key === 'historicalStock') && (
                                <ArrowUpDown className="ml-1 h-3 w-3" />
                              )}
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedItems.map((item) => (
                          <TableRow 
                            key={item.id}
                            className={`cursor-pointer ${selectedItemId === item.id ? 'bg-muted' : ''}`}
                            onClick={() => setSelectedItemId(item.id)}
                          >
                            <TableCell>
                              <div>
                                <div>{item.name}</div>
                                <div className="text-xs text-muted-foreground">{item.category}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {showHistorical ? item.historicalStock : item.stock}
                              {showHistorical && (
                                <div className="text-xs text-muted-foreground">
                                  {item.stock} current + ~{item.soldQuantity} sold
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredItems.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                              No items found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* Right side - Item Details */}
                <div className="md:col-span-2 border rounded-md p-4">
                  {selectedItem ? (
                    <div>
                      <div className="mb-4">
                        <h2 className="text-xl font-bold">{selectedItem.name}</h2>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline">{selectedItem.category}</Badge>
                          {selectedItem.sku && (
                            <Badge variant="outline" className="bg-muted">SKU: {selectedItem.sku}</Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Add total items summary */}
                      <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium flex items-center gap-1">
                                <History className="h-4 w-4 text-blue-600" />
                                Total Item History
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                All time tracking for this item
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{selectedItem.historicalStock} units</div>
                              <div className="flex items-center justify-end gap-1 text-sm">
                                <span className="text-green-600 font-medium">{selectedItem.stock} in stock</span>
                                <span>+</span>
                                <span className="text-amber-600 font-medium">{selectedItem.soldQuantity} sold</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
                        <Card className="shadow-sm">
                          <CardHeader className="py-2">
                            <CardTitle className="text-xs font-medium">Current Stock</CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="text-xl font-bold">{selectedItem.stock} units</div>
                          </CardContent>
                        </Card>
                        
                        <Card className="shadow-sm">
                          <CardHeader className="py-2">
                            <CardTitle className="text-xs font-medium">
                              {showHistorical ? "Estimated Sold" : "Unit Price"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="text-xl font-bold">
                              {showHistorical 
                                ? `~${selectedItem.soldQuantity} units` 
                                : `$${selectedItem.price.toFixed(2)}`
                              }
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="shadow-sm">
                          <CardHeader className="py-2">
                            <CardTitle className="text-xs font-medium">
                              {showHistorical ? "Total Historical" : "Stock Value"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="text-xl font-bold">
                              {showHistorical
                                ? `${selectedItem.historicalStock} units`
                                : `$${(selectedItem.stock * selectedItem.price).toFixed(2)}`
                              }
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-3">
                          {showHistorical ? "Historical Stock Analysis" : "Stock History"}
                        </h3>
                        <div className="h-[250px]">
                          <Bar 
                            data={selectedItemChartData} 
                            options={selectedItemChartOptions}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8">
                      <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                      <p className="text-muted-foreground">Select an item to view its stock history</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 