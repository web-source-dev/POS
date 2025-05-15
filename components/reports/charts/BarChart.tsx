"use client";

import { FC } from 'react';
import { 
  BarChart as ReChartBar, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  LabelList
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type DataItem = {
  [key: string]: string | number;
};

interface BarChartProps {
  data: DataItem[];
  title?: string;
  description?: string;
  xAxisKey: string;
  bars: {
    dataKey: string;
    color: string;
    name?: string;
  }[];
  valueFormatter?: (value: number) => string;
  showLabels?: boolean;
  layout?: 'vertical' | 'horizontal';
  className?: string;
  height?: number;
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

const BarChartComponent: FC<BarChartProps> = ({
  data,
  title = 'Bar Chart',
  description,
  xAxisKey,
  bars,
  valueFormatter = (value) => `${value}`,
  showLabels = false,
  layout = 'horizontal',
  className = '',
  height = 300
}) => {
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow rounded border">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={`tooltip-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name || entry.dataKey}: {valueFormatter(entry.value)}
            </p>
          ))}
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
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center flex-col">
            <p className="text-lg text-muted-foreground">No data available</p>
            <p className="text-sm text-muted-foreground">No data found for this time period</p>
          </div>
        ) : (
          <div style={{ height: `${height}px`, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ReChartBar
                data={data}
                layout={layout}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
                barSize={layout === 'vertical' ? 20 : 40}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" />
                {layout === 'horizontal' ? (
                  <>
                    <XAxis 
                      dataKey={xAxisKey} 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={data.length > 8 ? -45 : 0}
                      textAnchor={data.length > 8 ? 'end' : 'middle'}
                      height={data.length > 8 ? 80 : 30}
                    />
                    <YAxis 
                      tickFormatter={valueFormatter}
                      tick={{ fontSize: 12 }}
                    />
                  </>
                ) : (
                  <>
                    <XAxis 
                      type="number" 
                      tickFormatter={valueFormatter}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      dataKey={xAxisKey} 
                      type="category" 
                      tick={{ fontSize: 12 }}
                      width={120}
                    />
                  </>
                )}
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {bars.map((bar, index) => (
                  <Bar 
                    key={`bar-${index}`} 
                    dataKey={bar.dataKey} 
                    fill={bar.color}
                    name={bar.name || bar.dataKey}
                    radius={[4, 4, 0, 0]}
                  >
                    {showLabels && (
                      <LabelList 
                        dataKey={bar.dataKey} 
                        position="top" 
                        formatter={valueFormatter}
                        style={{ fontSize: '10px' }}
                      />
                    )}
                  </Bar>
                ))}
              </ReChartBar>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BarChartComponent; 