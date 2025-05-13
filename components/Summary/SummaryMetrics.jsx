"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { formatCurrency, calculatePercentChange } from '@/lib/utils';

export function SummaryMetrics({ data, previousData }) {
  if (!data || !data.summary) return null;
  
  const { 
    totalRevenue, 
    totalCost, 
    totalProfit, 
    averageProfitMargin 
  } = data.summary;
  // Calculate the total sales quantity
  const totalSalesQuantity = 
    [...data.mostSelling, ...data.mediumSelling, ...data.lowSelling, ...data.notSelling]
      .reduce((sum, item) => sum + item.salesQuantity, 0);
  
  // Define metric color themes based on CSS variables
  const metricThemes = {
    revenue: {
      icon: DollarSign,
      iconClass: 'text-green-500',
      bgClass: 'bg-green-100 dark:bg-green-900/30'
    },
    cost: {
      icon: ShoppingCart,
      iconClass: 'text-[hsl(var(--primary))]',
      bgClass: 'bg-[hsl(var(--primary)/0.1)] dark:bg-[hsl(var(--primary)/0.2)]'
    },
    profit: {
      icon: TrendingUp,
      iconClass: 'text-sky-500',
      bgClass: 'bg-sky-100 dark:bg-sky-900/30'
    },
    sales: {
      icon: Package,
      iconClass: 'text-purple-500',
      bgClass: 'bg-purple-100 dark:bg-purple-900/30'
    },
    margin: {
      icon: TrendingUp,
      iconClass: 'text-emerald-500',
      bgClass: 'bg-emerald-100 dark:bg-emerald-900/30'
    }
  };
  
  // Prepare the metrics
  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: metricThemes.revenue.icon,
      iconColor: metricThemes.revenue.iconClass,
      bgColor: metricThemes.revenue.bgClass,
      previousValue: previousData?.summary?.totalRevenue,
      percentChange: previousData?.summary?.totalRevenue 
        ? calculatePercentChange(totalRevenue, previousData.summary.totalRevenue)
        : null
    },
    {
      title: 'Total Cost',
      value: formatCurrency(totalCost),
      icon: metricThemes.cost.icon,
      iconColor: metricThemes.cost.iconClass,
      bgColor: metricThemes.cost.bgClass,
      previousValue: previousData?.summary?.totalCost,
      percentChange: previousData?.summary?.totalCost 
        ? calculatePercentChange(totalCost, previousData.summary.totalCost)
        : null
    },
    {
      title: 'Total Profit',
      value: formatCurrency(totalProfit),
      icon: metricThemes.profit.icon,
      iconColor: metricThemes.profit.iconClass,
      bgColor: metricThemes.profit.bgClass,
      previousValue: previousData?.summary?.totalProfit,
      percentChange: previousData?.summary?.totalProfit 
        ? calculatePercentChange(totalProfit, previousData.summary.totalProfit)
        : null
    },
    {
      title: 'Items Sold',
      value: totalSalesQuantity,
      icon: metricThemes.sales.icon,
      iconColor: metricThemes.sales.iconClass,
      bgColor: metricThemes.sales.bgClass,
      suffix: 'units',
      previousValue: previousData?.totalSalesQuantity,
      percentChange: previousData?.totalSalesQuantity
        ? calculatePercentChange(totalSalesQuantity, previousData.totalSalesQuantity)
        : null
    },
    {
      title: 'Average Profit Margin',
      value: `${averageProfitMargin.toFixed(2)}%`,
      icon: metricThemes.margin.icon,
      iconColor: metricThemes.margin.iconClass,
      bgColor: metricThemes.margin.bgClass,
      previousValue: previousData?.summary?.averageProfitMargin,
      percentChange: previousData?.summary?.averageProfitMargin
        ? calculatePercentChange(averageProfitMargin, previousData.summary.averageProfitMargin)
        : null
    },
  ];
  
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {metrics.map((metric, index) => (
        <Card key={index} className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium leading-tight">
              {metric.title}
            </CardTitle>
            <div className={`${metric.bgColor} p-2 rounded-full`}>
              <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold leading-8">{metric.value} {metric.suffix}</div>
            {metric.percentChange !== null && (
              <p className="text-xs text-muted-foreground flex items-center mt-2">
                {metric.percentChange > 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                ) : metric.percentChange < 0 ? (
                  <TrendingDown className="mr-1 h-3 w-3 text-destructive" />
                ) : null}
                <span 
                  className={
                    metric.percentChange > 0 
                      ? 'text-green-500' 
                      : metric.percentChange < 0 
                        ? 'text-destructive' 
                        : ''
                  }
                >
                  {metric.percentChange > 0 ? '+' : ''}
                  {metric.percentChange.toFixed(2)}%
                </span>
                <span className="ml-1">from previous period</span>
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 