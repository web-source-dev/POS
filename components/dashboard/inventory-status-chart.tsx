"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LabelList,
  Cell
} from 'recharts';
import { Package } from "lucide-react";
import { formatNumber } from "@/lib/utils";

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
  // Transform data for the chart and sort by status priority
  const chartData = statusData
    .map(item => ({
      name: STATUS_NAMES[item._id] || item._id,
      value: item.count,
      color: STATUS_COLORS[item._id as keyof typeof STATUS_COLORS] || '#64748b'
    }))
    .sort((a, b) => {
      // Custom sort order: In Stock -> Low Stock -> Out of Stock -> Others
      const order = {
        'In Stock': 1,
        'Low Stock': 2,
        'Out of Stock': 3
      };
      const orderA = order[a.name as keyof typeof order] || 4;
      const orderB = order[b.name as keyof typeof order] || 4;
      return orderA - orderB;
    });

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active: boolean, payload: { name: string, value: number }[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">
            Items: <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    
    return null;
  };

  // Calculate total items for percentage calculation
  const totalItems = chartData.reduce((sum, item) => sum + item.value, 0);

  if (!chartData || chartData.length === 0) {
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

  // Create a legend to display color mappings
  const renderColorLegend = () => (
    <div className="flex justify-center gap-6 mt-4 mb-2">
      {Object.entries(STATUS_COLORS).map(([status, color]) => (
        <div key={status} className="flex items-center gap-1">
          <div className="w-3 h-3" style={{ backgroundColor: color }} />
          <span className="text-xs">{status}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Inventory Status</CardTitle>
        <Package className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="h-[400px]">
        {renderColorLegend()}
        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="category" 
              dataKey="name"
              tick={{ fontSize: 14 }}
              height={50}
            />
            <YAxis 
              type="number"
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip content={<CustomTooltip active={false} payload={[]} />} />
            <Bar 
              dataKey="value" 
              background={{ fill: '#f5f5f5' }}
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList 
                dataKey="value" 
                position="top" 
                formatter={(value: number) => `${value} (${((value / totalItems) * 100).toFixed(1)}%)`}
                style={{ fill: 'black', fontSize: '12px', fontWeight: '600' }} 
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 