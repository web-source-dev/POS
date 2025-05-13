"use client";

import { FC, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BarChartComponent from '../charts/BarChart';
import DataTable from '../tables/DataTable';
import reportService from '@/services/reportService';
import { Package, AlertTriangle, DollarSign, Layers, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

// Define types for the API response
interface ApiResponse {
  success?: boolean;
  data?: unknown;
  summary?: Record<string, unknown>;
}

interface InventoryItem {
  id: string;
  _id?: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
  value?: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  [key: string]: unknown;
}

interface CategoryData {
  category: string;
  value: number;
  count: number;
  [key: string]: string | number;
}
interface InventorySummary {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
}


const InventoryReportView: FC = () => {
  const router = useRouter();
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [summary, setSummary] = useState<InventorySummary>({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use actual API endpoints instead of mock data
        const inventoryResponse = await reportService.getInventoryReport() as ApiResponse;
        const categoryResponse = await reportService.getInventoryByCategory() as ApiResponse;
        
        console.log('Inventory Response:', inventoryResponse);
        console.log('Category Response:', categoryResponse);
        
        // Process inventory data
        if (inventoryResponse && inventoryResponse.success) {
          if (inventoryResponse.data) {
            const inventoryItems = inventoryResponse.data as InventoryItem[];
            setInventoryData(inventoryItems);
            setFilteredInventory(inventoryItems);
            
            // Extract unique categories for the filter
            const uniqueCategories = Array.from(
              new Set(inventoryItems.map(item => item.category))
            ) as string[];
            setCategories(uniqueCategories);
            
            // Generate mock stock movement data
            generateStockMovementData(inventoryItems);
          }
          
          // Set summary data
          if (inventoryResponse.summary) {
            const summaryData = inventoryResponse.summary as Record<string, unknown>;
            setSummary({
              totalItems: Number(summaryData.totalItems) || 0,
              totalValue: parseFloat(String(summaryData.totalValue)) || 0,
              lowStockItems: Number(summaryData.lowStockItems) || 0,
              outOfStockItems: Number(summaryData.outOfStockItems) || 0,
            });
          }
        }
        
        // Process category data
        if (categoryResponse && categoryResponse.success && categoryResponse.data) {
          // Type guard to ensure we have an array
          const categoryItems = Array.isArray(categoryResponse.data) 
            ? categoryResponse.data as CategoryData[]
            : [];
          
          // Sort by value for better visualization
          const sortedCategories = [...categoryItems].sort(
            (a, b) => b.value - a.value
          );
          
          setCategoryData(sortedCategories);
        }
      } catch (error) {
        console.error('Error fetching inventory report data:', error);
      } finally {
      }
    };

    fetchData();
  }, []);
  
  // Generate mock stock movement data
  const generateStockMovementData = (inventoryItems: InventoryItem[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Take top 5 products by value for the trend
    const topProducts = [...inventoryItems]
      .sort((a, b) => (b.stock * b.price) - (a.stock * a.price))
      .slice(0, 5);
    
    // Generate stock level over time
    const stockHistory = topProducts.map(product => {
      const monthlyData = months.slice(0, currentMonth + 1).map((month, idx) => {
        // For realistic trends, start with current stock and work backwards with some variations
        const currentStock = product.stock;
        const minStock = Math.max(0, currentStock - Math.round(currentStock * 0.5));
        const movementFactor = 1 - (currentMonth - idx) / (currentMonth + 1);
        const stockLevel = Math.round(minStock + (currentStock - minStock) * movementFactor);
        
        return {
          product: product.name,
          month: `${month} ${currentYear}`,
          stock: stockLevel,
          value: stockLevel * product.price
        };
      });
      
      return monthlyData;
    });
    
    // Log the stock history after it's fully initialized
    console.log(stockHistory);
    
    // Flatten the data
  };

  // Filter inventory based on search query and category
  const filterInventory = useCallback(() => {
    let filtered = [...inventoryData];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    setFilteredInventory(filtered);
  }, [inventoryData, searchQuery, selectedCategory]);

  // Handle search query change
  useEffect(() => {
    filterInventory();
  }, [filterInventory]);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Safely cast unknown to number
  const safeNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  };

  // Safely cast unknown to string
  const safeString = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    return String(value);
  };

  // Columns for the inventory table
  const inventoryColumns = [
    {
      header: 'ID',
      accessorKey: 'id',
    },
    {
      header: 'Product',
      accessorKey: 'name',
    },
    {
      header: 'SKU',
      accessorKey: 'sku',
    },
    {
      header: 'Category',
      accessorKey: 'category',
    },
    {
      header: 'Stock',
      accessorKey: 'stock',
      align: 'right' as const
    },
    {
      header: 'Price',
      accessorKey: 'price',
      cell: (value: unknown) => formatCurrency(safeNumber(value)),
      align: 'right' as const
    },
    {
      header: 'Value',
      accessorKey: 'value',
      cell: (value: unknown) => formatCurrency(safeNumber(value)),
      align: 'right' as const
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (value: unknown) => {
        const status = safeString(value);
        const color = status === 'In Stock' 
          ? 'bg-green-100 text-green-800' 
          : status === 'Low Stock' 
            ? 'bg-yellow-100 text-yellow-800' 
            : 'bg-red-100 text-red-800';
        
        return (
          <Badge variant="outline" className={`${color} font-medium`}>
            {status}
          </Badge>
        );
      }
    }
  ];
  

  // Prepare data for top products chart
  const topProducts = filteredInventory.length > 0 
    ? [...filteredInventory]
        .sort((a, b) => (b.stock * b.price) - (a.stock * a.price))
        .slice(0, 10)
        .map(item => ({
          product: item.name,
          value: item.stock * item.price
        }))
    : [];


  // Add a function to handle inventory row clicks
  const handleInventoryRowClick = (item: InventoryItem) => {
    if (item && item._id) {
      router.push(`/inventory/view/${item._id}`);
    } else if (item && item.id) {
      router.push(`/inventory/view/${item.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {summary.outOfStockItems} out of stock
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              +5.2% from previous month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalItems > 0 ? ((summary.lowStockItems / summary.totalItems) * 100).toFixed(1) : 0}% of inventory
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryData.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all products
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, SKUs, categories..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-[200px]">
          <Select 
            value={selectedCategory} 
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat, index) => (
                <SelectItem key={index} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}
        >
          Reset Filters
        </Button>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <BarChartComponent 
          data={categoryData} 
          title="Inventory Value by Category"
          description="Distribution of inventory value by product category"
          xAxisKey="category"
          bars={[
            { dataKey: 'value', color: '#4f46e5', name: 'Inventory Value' }
          ]}
          valueFormatter={formatCurrency}
          layout="horizontal"
          height={400}
        />
        <BarChartComponent
          data={topProducts}
          title="Top 10 Products by Value"
          description="Highest value products in inventory"
          xAxisKey="product"
          bars={[
            { dataKey: 'value', color: '#82ca9d', name: 'Inventory Value' }
          ]}
          valueFormatter={formatCurrency}
          layout="horizontal"
          height={400}
        />
      </div>
      {/* Detailed Table */}
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="all" className="pt-4">
          <DataTable 
            data={filteredInventory.map(item => ({
              ...item,
              value: item.stock * item.price
            }))} 
            columns={inventoryColumns}
            title="Inventory"
            description={`${filteredInventory.length} items found${searchQuery ? ' matching your search' : ''}${selectedCategory !== 'all' ? ` in category "${selectedCategory}"` : ''}`}
            onRowClick={handleInventoryRowClick}
          />
        </TabsContent>
        <TabsContent value="low-stock" className="pt-4">
          <DataTable 
            data={filteredInventory
              .filter(item => item.status === 'Low Stock')
              .map(item => ({
                ...item,
                value: item.stock * item.price
              }))} 
            columns={inventoryColumns}
            title="Low Stock Items"
            description="Products that need to be restocked soon"
            onRowClick={handleInventoryRowClick}
          />
        </TabsContent>
        <TabsContent value="out-of-stock" className="pt-4">
          <DataTable 
            data={filteredInventory
              .filter(item => item.status === 'Out of Stock')
              .map(item => ({
                ...item,
                value: item.stock * item.price
              }))} 
            columns={inventoryColumns}
            title="Out of Stock Items"
            description="Products that need immediate attention"
            onRowClick={handleInventoryRowClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryReportView; 