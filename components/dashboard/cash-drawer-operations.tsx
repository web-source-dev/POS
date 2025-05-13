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
import { 
  BadgeDollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Coins, 
  ShoppingCart, 
  FileText, 
  Power
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CashDrawerOperation {
  _id: string;
  date: string;
  previousBalance: number;
  amount: number;
  balance: number;
  operation: 'add' | 'remove' | 'count' | 'sale' | 'expense' | 'initialization' | 'close';
  notes: string;
}

interface CashDrawerOperationsProps {
  operations: CashDrawerOperation[];
}

export function CashDrawerOperations({ operations }: CashDrawerOperationsProps) {
  if (!operations || operations.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">Cash Drawer Operations</CardTitle>
          <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No recent cash drawer operations</p>
        </CardContent>
      </Card>
    );
  }

  // Function to render the appropriate icon for each operation type
  const getOperationIcon = (operation: CashDrawerOperation['operation']) => {
    switch (operation) {
      case 'add':
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case 'remove':
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      case 'count':
        return <Coins className="h-4 w-4 text-blue-500" />;
      case 'sale':
        return <ShoppingCart className="h-4 w-4 text-indigo-500" />;
      case 'expense':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'initialization':
        return <Power className="h-4 w-4 text-green-500" />;
      case 'close':
        return <Power className="h-4 w-4 text-red-500" />;
      default:
        return <BadgeDollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  // Function to get the appropriate badge variant for each operation type
  const getOperationBadgeVariant = (operation: CashDrawerOperation['operation']): "default" | "secondary" | "destructive" | "outline" => {
    switch (operation) {
      case 'add':
      case 'initialization':
        return "default";
      case 'remove':
      case 'close':
      case 'expense':
        return "destructive";
      case 'sale':
        return "secondary";
      case 'count':
      default:
        return "outline";
    }
  };

  // Function to format the operation name for display
  const formatOperationName = (operation: CashDrawerOperation['operation']) => {
    return operation.charAt(0).toUpperCase() + operation.slice(1);
  };

  const handleClick = (id: string) => {
    window.location.href = `accounting/transaction/${id}`;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Cash Drawer Operations</CardTitle>
        <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Operation</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.map((op) => (
              <TableRow key={op._id} onClick={()=> handleClick(op._id)}>
                <TableCell>{formatDate(new Date(op.date))}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getOperationIcon(op.operation)}
                    <Badge variant={getOperationBadgeVariant(op.operation)}>
                      {formatOperationName(op.operation)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(op.amount)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(op.balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 