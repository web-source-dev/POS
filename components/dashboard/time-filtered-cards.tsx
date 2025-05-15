"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  BarChart4,
  ShoppingBag
} from "lucide-react";

interface TimeFilteredCardsProps {
  periodSales: {
    total: number;
    count: number;
  };
  periodExpenses: {
    total: number;
    count: number;
  };
  periodProfit: number;
  avgTransactionValue: number;
  daysLabel: string;
}

export function TimeFilteredCards({
  periodSales,
  periodExpenses,
  periodProfit,
  avgTransactionValue,
  daysLabel
}: TimeFilteredCardsProps) {
  const router = useRouter();
  const isProfitPositive = periodProfit >= 0;

  const handleCardClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Period Sales Card */}
      <Card 
        className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
        onClick={() => handleCardClick("/purchases")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{daysLabel} Sales</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(periodSales.total)}</div>
          <p className="text-xs text-muted-foreground">
            {periodSales.count} transaction{periodSales.count !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Period Expenses Card */}
      <Card 
        className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
        onClick={() => handleCardClick("/accounting")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{daysLabel} Expenses</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(periodExpenses.total)}</div>
          <p className="text-xs text-muted-foreground">
            {periodExpenses.count} transaction{periodExpenses.count !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Period Profit Card */}
      <Card 
        className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
        onClick={() => handleCardClick("/reports/financial")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{daysLabel} Profit</CardTitle>
          {isProfitPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isProfitPositive ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(periodProfit)}
          </div>
          <p className="text-xs text-muted-foreground">
            {isProfitPositive ? 'Profit' : 'Loss'} margin: {Math.abs(
              periodSales.total ? Math.round((periodProfit / periodSales.total) * 100) : 0
            )}%
          </p>
        </CardContent>
      </Card>

      {/* Average Transaction Value Card */}
      <Card 
        className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
        onClick={() => handleCardClick("/reports/sales")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
          <BarChart4 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(avgTransactionValue)}</div>
          <p className="text-xs text-muted-foreground">
            Based on {periodSales.count} sales
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 