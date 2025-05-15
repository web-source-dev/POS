"use client";

import { useState, useEffect, useRef } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { formatCurrency } from '@/lib/utils';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export function InventoryPerformanceChart({ data }) {
  const [chartType, setChartType] = useState('sales');
  const [gradients, setGradients] = useState(null);
  const chartRef = useRef(null);
  
  useEffect(() => {
    // Create gradients only on client-side
    if (typeof window !== 'undefined' && chartRef.current) {
      const ctx = chartRef.current.ctx;
      
      if (ctx) {
        // Helper function to get computed color from CSS variable
        const getComputedColor = (varName) => {
          // Create a temporary element to compute the CSS variable value
          const tempEl = document.createElement('div');
          document.body.appendChild(tempEl);
          tempEl.style.color = varName;
          const computedColor = window.getComputedStyle(tempEl).color;
          document.body.removeChild(tempEl);
          return computedColor;
        };
        
        // Get computed colors from CSS variables
        const primaryColor = getComputedColor('hsl(var(--primary))');
        const destructiveColor = getComputedColor('hsl(var(--destructive))');
        
        // Define fixed colors for gradients
        const greenColor = 'rgb(76, 175, 80)';
        const blueColor = 'rgb(33, 150, 243)';
        
        // Sales gradient (orange/primary)
        const salesGradient = ctx.createLinearGradient(0, 0, 0, 400);
        salesGradient.addColorStop(0, primaryColor);
        salesGradient.addColorStop(1, 'rgba(255, 152, 0, 0.1)');
        
        // Revenue gradient (green)
        const revenueGradient = ctx.createLinearGradient(0, 0, 0, 400);
        revenueGradient.addColorStop(0, greenColor);
        revenueGradient.addColorStop(1, 'rgba(76, 175, 80, 0.1)');
        
        // Profit gradient (blue)
        const profitGradient = ctx.createLinearGradient(0, 0, 0, 400);
        profitGradient.addColorStop(0, blueColor);
        profitGradient.addColorStop(1, 'rgba(33, 150, 243, 0.1)');
        
        setGradients({
          sales: salesGradient,
          revenue: revenueGradient,
          profit: profitGradient,
          primaryColor,
          destructiveColor,
          greenColor,
          blueColor
        });
      }
    }
  }, []);
  
  if (!data || !data.mostSelling) return null;
  
  // Check if there are any sales data
  const hasSalesData = [
    ...data.mostSelling,
    ...data.mediumSelling,
    ...data.lowSelling
  ].some(item => item.salesQuantity > 0);

  // If no sales data, show appropriate message
  if (!hasSalesData) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-xl font-bold">Inventory Performance Charts</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="w-full h-[400px] sm:h-[450px] flex flex-col items-center justify-center text-center">
            <div className="text-muted-foreground mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">No Sales Data Available</h3>
            <p className="text-muted-foreground max-w-md">
              Your inventory items haven't recorded any sales yet. Once you start making sales, 
              performance metrics will appear here automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Combine all categories for the charts
  const allItems = [
    ...data.mostSelling,
    ...data.mediumSelling,
    ...data.lowSelling,
    ...data.notSelling
  ].sort((a, b) => b.salesQuantity - a.salesQuantity);
  
  // Take top 10 items for charts
  const topItems = allItems.slice(0, 10);
  
  // Define theme colors based on computed values or fallbacks
  const themeColors = {
    sales: {
      // Orange/Primary color with gradient or fallback
      gradient: gradients?.sales || 'rgba(255, 152, 0, 0.7)',
      border: gradients?.primaryColor || 'rgb(255, 152, 0)',
      hover: 'rgba(255, 152, 0, 0.8)'
    },
    revenue: {
      // Green color with gradient or fallback
      gradient: gradients?.revenue || 'rgba(76, 175, 80, 0.7)',
      border: gradients?.greenColor || 'rgb(76, 175, 80)',
      hover: 'rgba(76, 175, 80, 0.8)'
    },
    profit: {
      // Blue color with gradient or fallback
      gradient: gradients?.profit || 'rgba(33, 150, 243, 0.7)',
      border: gradients?.blueColor || 'rgb(33, 150, 243)',
      hover: 'rgba(33, 150, 243, 0.8)'
    },
    distribution: {
      mostSelling: {
        bg: gradients?.greenColor || 'rgb(76, 175, 80)', // Green
        border: 'rgb(76, 175, 80, 1)',
        hover: 'rgb(67, 160, 71)'
      },
      mediumSelling: {
        bg: gradients?.primaryColor || 'rgb(255, 152, 0)', // Orange (primary)
        border: 'rgb(255, 152, 0, 1)',
        hover: 'rgb(245, 124, 0)'
      },
      lowSelling: {
        bg: gradients?.blueColor || 'rgb(33, 150, 243)', // Blue
        border: 'rgb(33, 150, 243, 1)',
        hover: 'rgb(30, 136, 229)'
      },
      notSelling: {
        bg: gradients?.destructiveColor || 'rgb(211, 47, 47)', // Red (destructive)
        border: 'rgb(211, 47, 47, 1)',
        hover: 'rgb(198, 40, 40)'
      },
      extraColors: [
        'rgb(142, 36, 170)', // Purple
        'rgb(0, 188, 212)',  // Cyan
        'rgb(255, 167, 38)'  // Gold
      ]
    }
  };
  
  // Sales Quantity Chart
  const salesQuantityData = {
    labels: topItems.map(item => item.name),
    datasets: [
      {
        label: 'Sales Quantity',
        data: topItems.map(item => item.salesQuantity),
        backgroundColor: themeColors.sales.gradient,
        borderColor: themeColors.sales.border,
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: themeColors.sales.hover,
        barThickness: 'flex',
        barPercentage: 0.8,
      }
    ]
  };
  
  // Revenue Chart
  const revenueData = {
    labels: topItems.map(item => item.name),
    datasets: [
      {
        label: 'Revenue',
        data: topItems.map(item => item.revenue),
        backgroundColor: themeColors.revenue.gradient,
        borderColor: themeColors.revenue.border,
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: themeColors.revenue.hover,
        barThickness: 'flex',
        barPercentage: 0.8,
      }
    ]
  };
  
  // Profit Chart
  const profitData = {
    labels: topItems.map(item => item.name),
    datasets: [
      {
        label: 'Profit',
        data: topItems.map(item => item.profit),
        backgroundColor: themeColors.profit.gradient,
        borderColor: themeColors.profit.border,
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: themeColors.profit.hover,
        barThickness: 'flex',
        barPercentage: 0.8,
      }
    ]
  };
  
  // Performance Distribution Pie Chart
  const distributionData = {
    labels: ['Most Selling', 'Medium Selling', 'Low Selling', 'Not Selling'],
    datasets: [
      {
        data: [
          data.mostSelling.length,
          data.mediumSelling.length,
          data.lowSelling.length,
          data.notSelling.length
        ],
        backgroundColor: [
          themeColors.distribution.mostSelling.bg,
          themeColors.distribution.mediumSelling.bg,
          themeColors.distribution.lowSelling.bg,
          themeColors.distribution.notSelling.bg
        ],
        borderColor: [
          themeColors.distribution.mostSelling.border,
          themeColors.distribution.mediumSelling.border,
          themeColors.distribution.lowSelling.border,
          themeColors.distribution.notSelling.border
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          themeColors.distribution.mostSelling.hover,
          themeColors.distribution.mediumSelling.hover,
          themeColors.distribution.lowSelling.hover,
          themeColors.distribution.notSelling.hover
        ],
        hoverOffset: 7,
      }
    ]
  };
  
  // Additional data visualization - Category-wise Chart
  const categoryData = () => {
    // Group items by category
    const categoriesMap = {};
    allItems.forEach(item => {
      if (!categoriesMap[item.category]) {
        categoriesMap[item.category] = {
          sales: 0,
          revenue: 0,
          profit: 0
        };
      }
      categoriesMap[item.category].sales += item.salesQuantity;
      categoriesMap[item.category].revenue += item.revenue;
      categoriesMap[item.category].profit += item.profit;
    });
    
    // Convert to array and sort by sales
    const categories = Object.keys(categoriesMap)
      .map(category => ({
        name: category,
        sales: categoriesMap[category].sales,
        revenue: categoriesMap[category].revenue,
        profit: categoriesMap[category].profit
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5); // Top 5 categories
    
    return {
      labels: categories.map(cat => cat.name),
      datasets: [
        {
          label: 'Sales Quantity',
          data: categories.map(cat => cat.sales),
          backgroundColor: themeColors.sales.border,
          borderColor: themeColors.sales.border,
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
        },
        {
          label: 'Revenue (÷100)',
          data: categories.map(cat => cat.revenue / 100), // Scale down for visibility
          backgroundColor: themeColors.revenue.border,
          borderColor: themeColors.revenue.border,
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
        },
        {
          label: 'Profit (÷100)',
          data: categories.map(cat => cat.profit / 100), // Scale down for visibility
          backgroundColor: themeColors.profit.border,
          borderColor: themeColors.profit.border,
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
        }
      ]
    };
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: chartType === 'sales' 
          ? 'Top Items by Sales Quantity' 
          : chartType === 'revenue' 
            ? 'Top Items by Revenue' 
            : chartType === 'profit'
              ? 'Top Items by Profit'
              : 'Performance by Category',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if ((chartType === 'revenue' || chartType === 'profit') && context.datasetIndex < 2) {
              label += formatCurrency(context.raw);
            } else if (chartType === 'category' && (context.datasetIndex === 1 || context.datasetIndex === 2)) {
              label += formatCurrency(context.raw * 100); // Scale back up
            } else {
              label += context.raw;
            }
            return label;
          }
        },
        displayColors: true,
        padding: 10,
        titleFont: {
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          padding: 5,
          callback: function(value) {
            if ((chartType === 'revenue' || chartType === 'profit') && value > 0) {
              return formatCurrency(value);
            }
            return value;
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };
  
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Inventory Performance Distribution',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20,
      },
      tooltip: {
        displayColors: true,
        padding: 10,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = ((value / allItems.length) * 100).toFixed(1);
            return `${label}: ${value} items (${percentage}%)`;
          }
        }
      }
    },
  };
  
  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-xl font-bold">Inventory Performance Charts</CardTitle>
        <Tabs defaultValue="sales" className="w-full" onValueChange={setChartType}>
          <TabsList className="grid grid-cols-5 w-full sm:w-[500px]">
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="profit">Profit</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="category">By Category</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="w-full h-[400px] sm:h-[450px]">
          {chartType === 'sales' && <Bar ref={chartRef} data={salesQuantityData} options={chartOptions} />}
          {chartType === 'revenue' && <Bar ref={chartRef} data={revenueData} options={chartOptions} />}
          {chartType === 'profit' && <Bar ref={chartRef} data={profitData} options={chartOptions} />}
          {chartType === 'distribution' && <Pie ref={chartRef} data={distributionData} options={pieOptions} />}
          {chartType === 'category' && <Bar ref={chartRef} data={categoryData()} options={chartOptions} />}
        </div>
      </CardContent>
    </Card>
  );
} 