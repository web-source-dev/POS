"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
} from "lucide-react";

interface StatsCardsProps {
  todaySales: {
    total: number;
    count: number;
  };
  todayExpenses: {
    total: number;
    count: number;
  };
  netPurchase: {
    total: number;
    count: number;
  };
  lowStockCount: number;
}

export function StatsCards({
  todaySales,
  todayExpenses,
  netPurchase,
  lowStockCount
}: StatsCardsProps) {
  const router = useRouter();
  // Calculate daily profit
  const dailyProfit = todaySales.total - todayExpenses.total;
  const isProfitPositive = dailyProfit >= 0;

  const handleCardClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Today's Sales Card */}
      <Card 
        className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
        onClick={() => handleCardClick("/purchases")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Today&apos;s Sales</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(todaySales.total)}</div>
          <p className="text-xs text-muted-foreground">
            {todaySales.count} transaction{todaySales.count !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Today's Expenses Card */}
      <Card 
        className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
        onClick={() => handleCardClick("/accounting")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Today&apos;s Expenses</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(todayExpenses.total)}</div>
          <p className="text-xs text-muted-foreground">
            {todayExpenses.count} transaction{todayExpenses.count !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Today's Profit Card */}
      <Card 
        className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
        onClick={() => handleCardClick("/today")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Profit</CardTitle>
          {isProfitPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isProfitPositive ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(dailyProfit)}
          </div>
          <p className="text-xs text-muted-foreground">
            From {todaySales.count} sales & {todayExpenses.count} expenses
          </p>
        </CardContent>
      </Card>

      {/* Net Purchases Card */}
      <Card 
        className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
        onClick={() => handleCardClick("/inventory")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Inventory</CardTitle>
         
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(netPurchase.total)}</div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{netPurchase.count} purchase{netPurchase.count !== 1 ? 's' : ''}</span>
            {lowStockCount > 0 && (
              <span className="text-red-500 font-medium">
                {lowStockCount} low stock
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 