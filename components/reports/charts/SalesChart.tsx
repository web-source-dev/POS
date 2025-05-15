"use client";

import { FC, useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SalesDataPoint = {
  date: string;
  sales: number;
  transactions: number;
};

interface SalesChartProps {
  data: SalesDataPoint[];
  title?: string;
  description?: string;
  className?: string;
}

const SalesChart: FC<SalesChartProps> = ({ 
  data, 
  title = 'Sales Overview', 
  description = 'Daily sales performance',
  className = '' 
}) => {
  const [chartView, setChartView] = useState<'sales' | 'transactions'>('sales');
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace(/PKR/g, 'Rs');
  };

  // Calculate max values for Y axis
  const maxSales = Math.max(...data.map(item => item.sales));
  const maxTransactions = Math.max(...data.map(item => item.transactions));
  
  // Format date for tooltip and X axis
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Select 
          value={chartView} 
          onValueChange={(value) => setChartView(value as 'sales' | 'transactions')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">Sales Amount</SelectItem>
            <SelectItem value="transactions">Transaction Count</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-0">
        {!data || data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center flex-col">
            <p className="text-lg text-muted-foreground">No sales data available</p>
            <p className="text-sm text-muted-foreground">No transactions found for this time period</p>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, chartView === 'sales' ? maxSales * 1.1 : maxTransactions * 1.1]}
                  tickFormatter={chartView === 'sales' ? formatCurrency : (value) => value}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'sales') {
                      return [formatCurrency(value as number), 'Sales'];
                    }
                    return [value, 'Transactions'];
                  }}
                  labelFormatter={formatDate}
                />
                <Legend />
                {chartView === 'sales' ? (
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorSales)" 
                  />
                ) : (
                  <Area 
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#82ca9d" 
                    fillOpacity={1} 
                    fill="url(#colorTransactions)" 
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesChart; 