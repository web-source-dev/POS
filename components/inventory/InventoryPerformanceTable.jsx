"use client";

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { formatCurrency } from '@/lib/utils';

export function InventoryPerformanceTable({ data }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('most');
  
  if (!data || !data.mostSelling) return null;
  
  // Define category map for labels
  const categoryMap = {
    most: {
      data: data.mostSelling,
      label: 'Most Selling Items',
      badge: 'bg-green-500',
    },
    medium: {
      data: data.mediumSelling,
      label: 'Medium Selling Items',
      badge: 'bg-orange-500',
    },
    low: {
      data: data.lowSelling,
      label: 'Low Selling Items', 
      badge: 'bg-blue-500',
    },
    not: {
      data: data.notSelling,
      label: 'Not Selling Items',
      badge: 'bg-red-500',
    },
  };
  
  // Filter function for search
  const filterItems = (items) => {
    if (!searchTerm) return items;
    
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  // Get current category data
  const currentCategory = categoryMap[currentTab];
  const filteredItems = filterItems(currentCategory.data);
  

  
  // Function to render profit indicator
  const renderProfit = (profit) => {
    if (profit > 0) {
      return <span className="text-green-500">+{formatCurrency(profit)}</span>;
    } else if (profit < 0) {
      return <span className="text-red-500">{formatCurrency(profit)}</span>;
    }
    return <span className="text-gray-500">{formatCurrency(profit)}</span>;
  };
  
  const handleItemClick = (itemId) => {
    window.location.href = `/inventory/view/${itemId}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{currentCategory.label}</CardTitle>
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <Tabs defaultValue="most" className="w-full" onValueChange={setCurrentTab}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="most">Most Selling</TabsTrigger>
              <TabsTrigger value="medium">Medium Selling</TabsTrigger>
              <TabsTrigger value="low">Low Selling</TabsTrigger>
              <TabsTrigger value="not">Not Selling</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="w-full md:w-1/3">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Sales Qty</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-4">
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item._id} onClick={() => handleItemClick(item._id)} className="cursor-pointer">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{item.currentStock}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.purchasePrice || 0)}</TableCell>
                    <TableCell className="text-right">{item.salesQuantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                    <TableCell className="text-right">{renderProfit(item.profit)}</TableCell>
                    <TableCell className="text-right">{item.profitMargin.toFixed(2)}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 