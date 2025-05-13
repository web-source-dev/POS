"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Receipt } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

interface ExpenseCategory {
  category: string;
  total: number;
}

interface ExpensesBreakdownProps {
  expensesData: ExpenseCategory[];
}

// Custom colors for the chart
const COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4', 
  '#14b8a6', '#84cc16', '#eab308', '#ef4444', '#64748b'
];

export function ExpensesBreakdown({ expensesData }: ExpensesBreakdownProps) {
  const [mounted, setMounted] = useState(false);
  
  // Format data for the chart and add percentage calculation
  const totalExpenses = expensesData.reduce((sum, item) => sum + item.total, 0);
  
  const chartData = expensesData
    .map(item => ({
      name: item.category,
      value: item.total,
      percent: totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value); // Sort by value descending

  // Chart.js data preparation
  const data: ChartData<'bar'> = {
    labels: chartData.map(item => item.name),
    datasets: [
      {
        data: chartData.map(item => item.value),
        backgroundColor: chartData.map((_, index) => COLORS[index % COLORS.length]),
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.7,
      }
    ],
  };

  // Chart.js options
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const index = context.dataIndex;
            const value = context.raw as number;
            const percent = chartData[index]?.percent.toFixed(1) || "0.0";
            return `${formatCurrency(value)} (${percent}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          callback: function(value) {
            return formatCurrency(value as number);
          }
        },
        grid: {
          display: true
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    }
  };

  // Handle SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">Expenses Breakdown</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No expense data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Expenses Breakdown</CardTitle>
        <Receipt className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="h-[400px]">
        <div className="mb-4 text-center">
          <div className="text-muted-foreground text-xs">Total Expenses</div>
          <div className="text-xl font-bold">{formatCurrency(totalExpenses)}</div>
        </div>
        
        {/* Color legend */}
        <div className="flex justify-center flex-wrap gap-4 mt-4 mb-2">
          {chartData.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              <div className="w-3 h-3" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-xs">{item.name}</span>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="h-[250px] mt-4">
          {mounted && <Bar options={options} data={data} />}
        </div>
      </CardContent>
    </Card>
  );
} 