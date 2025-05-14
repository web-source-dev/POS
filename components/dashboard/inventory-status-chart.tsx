"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface InventoryStatusItem {
  _id: string; // Status value
  count: number;
}

interface InventoryStatusChartProps {
  statusData: InventoryStatusItem[];
}

// Custom colors for different statuses
const STATUS_COLORS = {
  'In Stock': '#38bdf8',  // Blue
  'Low Stock': '#fb923c', // Orange
  'Out of Stock': '#f87171' // Red
};

// Custom names for statuses
const STATUS_NAMES: Record<string, string> = {
  'In Stock': 'In Stock',
  'Low Stock': 'Low Stock',
  'Out of Stock': 'Out of Stock'
};

export function InventoryStatusChart({ statusData }: InventoryStatusChartProps) {
  // Transform data for the chart
  const chartData = {
    labels: statusData.map(item => STATUS_NAMES[item._id] || item._id),
    datasets: [{
      data: statusData.map(item => item.count),
      backgroundColor: statusData.map(item => STATUS_COLORS[item._id as keyof typeof STATUS_COLORS] || '#64748b'),
    }],
  };

  if (!chartData || chartData.labels.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">Inventory Status</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No inventory data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Inventory Status</CardTitle>
        <Package className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="h-[400px] flex items-center justify-center">
        <Pie data={chartData} />
      </CardContent>
    </Card>
  );
}