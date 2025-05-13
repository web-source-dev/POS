"use client";

import { FC } from 'react';
import { 
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type FinancialDataPoint = {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
};

interface FinancialChartProps {
  data: FinancialDataPoint[];
  title?: string;
  description?: string;
  showRevenue?: boolean;
  showExpenses?: boolean;
  showProfit?: boolean;
  className?: string;
}

// Custom tooltip types
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name: string;
    color: string;
  }>;
  label?: string;
}

const FinancialChart: FC<FinancialChartProps> = ({
  data,
  title = 'Financial Performance',
  description = 'Revenue, expenses and profit over time',
  showRevenue = true,
  showExpenses = true,
  showProfit = true,
  className = ''
}) => {
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

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow rounded border">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={`tooltip-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Find max value for the Y axis
  const maxValue = Math.max(
    ...data.map(item => {
      const values = [];
      if (showRevenue) values.push(item.revenue);
      if (showExpenses) values.push(item.expenses);
      if (showProfit) values.push(item.profit);
      return Math.max(...values);
    })
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={data.length > 8 ? -45 : 0}
                textAnchor={data.length > 8 ? 'end' : 'middle'}
                height={data.length > 8 ? 60 : 30}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                domain={[0, maxValue * 1.1]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {showRevenue && (
                <Bar 
                  dataKey="revenue" 
                  name="Revenue" 
                  fill="#4CAF50" 
                  barSize={30}
                  radius={[4, 4, 0, 0]}
                />
              )}
              {showExpenses && (
                <Bar 
                  dataKey="expenses" 
                  name="Expenses" 
                  fill="#FF5722" 
                  barSize={30}
                  radius={[4, 4, 0, 0]}
                />
              )}
              {showProfit && (
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  name="Net Profit" 
                  stroke="#2196F3" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialChart; 