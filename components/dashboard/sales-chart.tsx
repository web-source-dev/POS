"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LineChart } from "lucide-react";

interface DailySales {
  _id: string; // Date string in format YYYY-MM-DD
  total: number;
  count: number;
}

interface DailyExpenses {
  _id: string; // Date string in format YYYY-MM-DD
  total: number;
  count: number;
}

interface SalesChartProps {
  salesData: DailySales[];
  expensesData?: DailyExpenses[];
  title?: string;
  showExpenses?: boolean;
}

export function SalesChart({ 
  salesData, 
  expensesData = [], 
  title = "Monthly Sales", 
  showExpenses = true 
}: SalesChartProps) {
  // Prepare combined data for the chart
  const prepareChartData = () => {
    // Create a map for all dates in the month
    const allDatesMap = new Map<string, { date: string, sales: number, expenses: number }>();
    
    // Get all dates from both datasets
    [...salesData, ...expensesData].forEach(item => {
      if (!allDatesMap.has(item._id)) {
        allDatesMap.set(item._id, {
          date: item._id,
          sales: 0,
          expenses: 0
        });
      }
    });
    
    // Add sales data
    salesData.forEach(sale => {
      const dateData = allDatesMap.get(sale._id);
      if (dateData) {
        dateData.sales = sale.total;
      }
    });
    
    // Add expenses data
    expensesData.forEach(expense => {
      const dateData = allDatesMap.get(expense._id);
      if (dateData) {
        dateData.expenses = expense.total;
      }
    });
    
    // Convert map to array and sort by date
    const chartData = Array.from(allDatesMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return chartData;
  };

  const chartData = prepareChartData();
  
  // Function to format date labels on X-axis
  const formatXAxis = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.getDate().toString(); // Just show the day of month
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateStr;
    }
  };
  
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: { active: boolean, payload: { name: string, value: number, color: string }[], label: string }) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      return (
        <div className="bg-background p-2 border rounded shadow-sm">
          <p className="font-medium">{formattedDate}</p>
          {payload.map((entry: { name: string, value: number, color: string }, index: number) => (
            <p key={`tooltip-${index}`} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    
    return null;
  };

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">{title}</CardTitle>
          <LineChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">{title}</CardTitle>
        <LineChart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis} 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)} 
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip active={false} payload={[]} label={''} />} />
            <Legend />
            <Bar dataKey="sales" name="Sales" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            {showExpenses && (
              <Bar dataKey="expenses" name="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 