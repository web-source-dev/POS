"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getTaxSummary } from "@/services/taxService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { ArrowRight, CreditCard } from "lucide-react";
import { TaxSummary } from "@/types/tax";

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFF'];

const TaxDashboard = () => {
  const [summaryData, setSummaryData] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("year");
  const router = useRouter();
  
  const fetchSummaryData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTaxSummary({ period: period as "year" | "month" | "quarter" | undefined });
      setSummaryData(data);
    } catch (error) {
      console.error("Error fetching tax summary:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);
  
  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);
  
  // Transform tax type data for pie chart
  const prepareTaxTypeData = () => {
    if (!summaryData || !summaryData.summary || !summaryData.summary.countByType) {
      return [];
    }
    
    return Object.entries(summaryData.summary.countByType).map(([name, value]) => ({
      name,
      value
    }));
  };
  
  // Transform tax status data for pie chart
  const prepareTaxStatusData = () => {
    if (!summaryData || !summaryData.summary || !summaryData.summary.countByStatus) {
      return [];
    }
    
    return Object.entries(summaryData.summary.countByStatus).map(([name, value]) => ({
      name,
      value
    }));
  };

  // Calculate payment progress
  const calculatePaymentProgress = () => {
    if (!summaryData || !summaryData.summary) return 0;
    
    const { totalTaxAmount, totalPaidAmount } = summaryData.summary;
    if (totalTaxAmount === 0) return 100; // No tax due
    
    return Math.min(100, (totalPaidAmount / totalTaxAmount) * 100);
  };
  
  // Navigate to tax records
  const navigateToTaxRecords = () => {
    router.push('/tax?tab=records');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tax Dashboard</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Period:</span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Current Month</SelectItem>
              <SelectItem value="quarter">Current Quarter</SelectItem>
              <SelectItem value="year">Current Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <p>Loading tax summary...</p>
        </div>
      ) : !summaryData ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <p>No tax data available.</p>
        </div>
      ) : (
        <>
          {/* Payment Progress Card */}
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle>Tax Payment Progress</CardTitle>
              <CardDescription>Overall payment status for the selected period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>
                  Paid: Rs. {summaryData.summary.totalPaidAmount.toLocaleString()} of Rs. {summaryData.summary.totalTaxAmount.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  {calculatePaymentProgress().toFixed(1)}% Complete
                </span>
              </div>
              
              <Progress value={calculatePaymentProgress()} className="h-2" />
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-destructive font-medium">
                    Due: Rs. {summaryData.summary.pendingAmount.toLocaleString()}
                  </p>
                </div>
                
                <Button size="sm" onClick={navigateToTaxRecords}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Make Payments
                </Button>
              </div>
            </CardContent>
          </Card>
      
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tax Amount</CardTitle>
                <CardDescription>For selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rs. {summaryData.summary.totalTaxAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Paid: Rs. {summaryData.summary.totalPaidAmount.toLocaleString()} ({(summaryData.summary.totalPaidAmount / (summaryData.summary.totalTaxAmount || 1) * 100).toFixed(1)}%)
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Tax Amount</CardTitle>
                <CardDescription>Outstanding balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rs. {summaryData.summary.pendingAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {summaryData.summary.totalRecords} tax records
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Estimated Income Tax</CardTitle>
                <CardDescription>Based on current income</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rs. {summaryData.summary.estimatedIncomeTax.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From income of Rs. {summaryData.summary.estimatedIncome.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Tax Records by Type</CardTitle>
                <CardDescription>Distribution of tax records by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prepareTaxTypeData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareTaxTypeData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Tax Records by Status</CardTitle>
                <CardDescription>Distribution of tax records by payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prepareTaxStatusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareTaxStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Tax Records</CardTitle>
                <CardDescription>Your most recent tax entries</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={navigateToTaxRecords}>
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {summaryData.recentRecords && summaryData.recentRecords.length > 0 ? (
                <div className="space-y-4">
                  {summaryData.recentRecords.map((record) => (
                    <div key={record._id} className="flex flex-col space-y-2 p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{record.taxId}</div>
                        <Badge variant={
                          record.paymentStatus === 'Paid' ? 'default' : 
                          record.paymentStatus === 'Pending' ? 'secondary' : 
                          record.paymentStatus === 'Partially Paid' ? 'outline' : 'destructive'
                        }>
                          {record.paymentStatus}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {record.type} • Period: {new Date(record.taxPeriod.startDate).toLocaleDateString()} - {new Date(record.taxPeriod.endDate).toLocaleDateString()}
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Amount: Rs. {record.taxAmount.toLocaleString()}</span>
                        <span>Paid: Rs. {record.paidAmount.toLocaleString()}</span>
                      </div>
                      {record.paymentStatus !== 'Paid' && (
                        <div className="mt-2">
                          <Progress 
                            value={(record.paidAmount / record.taxAmount) * 100} 
                            className="h-1" 
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">No recent tax records.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TaxDashboard; 