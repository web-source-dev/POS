"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Receipt } from "lucide-react";

interface SaleItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Sale {
  _id: string;
  receiptNumber: number;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  cashAmount: number;
  change: number;
  customerName: string;
  date: string;
}

interface RecentSalesProps {
  sales: Sale[];
}

export function RecentSales({ sales }: RecentSalesProps) {

    const handleNavigate = (id: string) => {
        window.location.href = `/purchases/${id}`;
    }
 
    if (!sales || sales.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">Recent Sales</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No recent sales found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Recent Sales</CardTitle>
        <Receipt className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale._id} onClick={() => handleNavigate(sale._id)}>
                <TableCell className="font-medium">{sale.receiptNumber}</TableCell>
                <TableCell>{formatDate(new Date(sale.date))}</TableCell>
                <TableCell>
                  {sale.customerName ? sale.customerName : 'Walk-in Customer'}
                </TableCell>
                <TableCell>{sale.items.length} item(s)</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(sale.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 