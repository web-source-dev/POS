"use client";

import { FC } from 'react';
import { 
  PieChart as ReChartPie, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type DataItem = {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
};

interface PieChartProps {
  data: DataItem[];
  title?: string;
  description?: string;
  valueFormatter?: (value: number) => string;
  nameKey?: string;
  valueKey?: string;
  colors?: string[];
  className?: string;
  showLegend?: boolean;
}

// Custom tooltip types
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DataItem & Record<string, unknown>;
  }>;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFF',
  '#FF6B8B', '#4CAF50', '#FF5722', '#9C27B0', '#3F51B5'
];

const PieChartComponent: FC<PieChartProps> = ({
  data,
  title = 'Distribution',
  description,
  valueFormatter = (value) => `${value}`,
  nameKey = 'name',
  valueKey = 'value',
  colors = COLORS,
  className = '',
  showLegend = true
}) => {
  // Default formatter for percentages
  const formatPercent = (percent: number) => `${percent.toFixed(1)}%`;
  
  // Ensure we have enough colors
  const extendedColors = data.length > colors.length 
    ? [...colors, ...Array(data.length - colors.length).fill('#999999')]
    : colors;
  
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const itemName = String(item[nameKey]);
      const itemValue = Number(item[valueKey]);
      const itemPercentage = item.percentage ? Number(item.percentage) : 0;
      
      return (
        <div className="bg-white p-3 shadow rounded border">
          <p className="font-medium">{itemName}</p>
          <p className="text-sm text-gray-500">
            {valueFormatter(itemValue)} ({formatPercent(itemPercentage)})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">
        {!data || data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center flex-col">
            <p className="text-lg text-muted-foreground">No data available</p>
            <p className="text-sm text-muted-foreground">No data found for this chart</p>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ReChartPie>
                <Pie
                  data={data}
                  dataKey={valueKey}
                  nameKey={nameKey}
                  cx="50%"
                  cy="50%"
                  outerRadius={showLegend ? 80 : 120}
                  innerRadius={showLegend ? 50 : 70}
                  paddingAngle={3}
                  label={({ name, percent }) => showLegend ? null : `${name} (${formatPercent(percent * 100)})`}
                  labelLine={!showLegend}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || extendedColors[index % extendedColors.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                {showLegend && <Legend />}
              </ReChartPie>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PieChartComponent; 