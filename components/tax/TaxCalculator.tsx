"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { calculateIncomeTax, calculateZakat } from "@/services/taxService";
import { addTaxRecord } from "@/services/taxService";
import { Plus, Calculator } from "lucide-react";
import { format } from "date-fns";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/components/ui/use-toast";

// Define interfaces for the tax calculation results
interface IncomeTaxResult {
  annualIncome: number;
  taxAmount: number;
  effectiveRate: number;
}

interface ZakatResult {
  netAssets: number;
  zakatRate: number;
  zakatAmount: number;
}

const TaxCalculator = () => {
  // Income Tax Calculator state
  const [annualIncome, setAnnualIncome] = useState("");
  const [incomeTaxResult, setIncomeTaxResult] = useState<IncomeTaxResult | null>(null);
  const [incomeCalculating, setIncomeCalculating] = useState(false);
  
  // Zakat Calculator state
  const [netAssets, setNetAssets] = useState("");
  const [zakatResult, setZakatResult] = useState<ZakatResult | null>(null);
  const [zakatCalculating, setZakatCalculating] = useState(false);
  
  // Period date state for adding tax records
  const [periodStart, setPeriodStart] = useState<Date>(new Date(new Date().getFullYear(), 0, 1));
  const [periodEnd, setPeriodEnd] = useState<Date>(new Date(new Date().getFullYear(), 11, 31));
  
  // Calculate income tax
  const handleCalculateIncomeTax = async () => {
    try {
      // Extra validation for input
      if (!annualIncome || annualIncome.trim() === '') {
        toast({
          title: "Error",
          description: "Please enter an income amount",
          variant: "destructive",
        });
        return;
      }
      
      // Parse the number with validation
      const incomeValue = parseFloat(annualIncome);
      if (isNaN(incomeValue) || incomeValue <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid positive income amount",
          variant: "destructive",
        });
        return;
      }
      
      setIncomeCalculating(true);
      // Use the validated number value
      const result = await calculateIncomeTax(incomeValue);
      setIncomeTaxResult(result);
    } catch (error) {
      console.error("Error calculating income tax:", error);
      toast({
        title: "Error",
        description: "Failed to calculate income tax. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIncomeCalculating(false);
    }
  };
  
  // Calculate Zakat
  const handleCalculateZakat = async () => {
    try {
      // Extra validation for input
      if (!netAssets || netAssets.trim() === '') {
        toast({
          title: "Error",
          description: "Please enter an assets amount",
          variant: "destructive",
        });
        return;
      }
      
      // Parse the number with validation
      const assetsValue = parseFloat(netAssets);
      if (isNaN(assetsValue) || assetsValue <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid positive assets amount",
          variant: "destructive",
        });
        return;
      }
      
      setZakatCalculating(true);
      // Use the validated number value
      const result = await calculateZakat(assetsValue);
      setZakatResult(result);
    } catch (error) {
      console.error("Error calculating Zakat:", error);
      toast({
        title: "Error",
        description: "Failed to calculate Zakat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setZakatCalculating(false);
    }
  };
  
  // Add income tax record
  const handleAddIncomeTaxRecord = async () => {
    if (!incomeTaxResult) return;
    
    try {
      await addTaxRecord({
        type: "Income Tax",
        taxableAmount: incomeTaxResult.annualIncome,
        taxRate: incomeTaxResult.effectiveRate,
        taxAmount: incomeTaxResult.taxAmount,
        description: `Annual income tax for ${periodStart.getFullYear()}`,
        paymentStatus: "Pending",
        paidAmount: 0,
        paymentDate: null,
        paymentMethod: "Cash",
        taxPeriod: {
          startDate: periodStart,
          endDate: periodEnd
        },
        reference: `IT-${periodStart.getFullYear()}`,
        isManualEntry: false,
        isFinalAssessment: false
      });
      
      toast({
        title: "Success",
        description: "Income tax record added successfully",
      });
    } catch (error) {
      console.error("Error adding income tax record:", error);
      toast({
        title: "Error",
        description: "Failed to add income tax record. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Add Zakat record
  const handleAddZakatRecord = async () => {
    if (!zakatResult) return;
    
    try {
      await addTaxRecord({
        type: "Zakat",
        taxableAmount: zakatResult.netAssets,
        taxRate: zakatResult.zakatRate,
        taxAmount: zakatResult.zakatAmount,
        description: `Annual Zakat for ${periodStart.getFullYear()}`,
        paymentStatus: "Pending",
        paidAmount: 0,
        paymentDate: null,
        paymentMethod: "Cash",
        taxPeriod: {
          startDate: periodStart,
          endDate: periodEnd
        },
        reference: `ZKT-${periodStart.getFullYear()}`,
        isManualEntry: false,
        isFinalAssessment: false
      });
      
      toast({
        title: "Success",
        description: "Zakat record added successfully",
      });
    } catch (error) {
      console.error("Error adding Zakat record:", error);
      toast({
        title: "Error",
        description: "Failed to add Zakat record. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold">Tax Calculator</h2>
        <p className="text-muted-foreground">
          Calculate income tax and Zakat based on Pakistani tax regulations
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tax Period Selection */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tax Period</CardTitle>
            <CardDescription>Select the fiscal year for your tax calculations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Period Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="periodStart"
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      {format(periodStart, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={periodStart}
                      onSelect={(date) => date && setPeriodStart(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="periodEnd">Period End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="periodEnd"
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      {format(periodEnd, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={periodEnd}
                      onSelect={(date) => date && setPeriodEnd(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  const currentYear = new Date().getFullYear();
                  setPeriodStart(new Date(currentYear, 0, 1));
                  setPeriodEnd(new Date(currentYear, 11, 31));
                }}
              >
                Set Current Fiscal Year
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Income Tax Calculator */}
        <Card>
          <CardHeader>
            <CardTitle>Income Tax Calculator</CardTitle>
            <CardDescription>Calculate income tax based on Pakistani tax slabs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="annualIncome">Annual Income (Rs.)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="annualIncome"
                    type="number"
                    placeholder="Enter your annual income"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                  />
                  <Button
                    onClick={handleCalculateIncomeTax}
                    disabled={incomeCalculating}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate
                  </Button>
                </div>
              </div>
              
              {incomeTaxResult && (
                <div className="space-y-4 mt-6">
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Income Tax Calculation Result</h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Annual Income:</div>
                      <div className="text-sm font-medium">Rs. {incomeTaxResult.annualIncome.toLocaleString()}</div>
                      
                      <div className="text-sm text-muted-foreground">Tax Amount:</div>
                      <div className="text-sm font-medium">Rs. {incomeTaxResult.taxAmount.toLocaleString()}</div>
                      
                      <div className="text-sm text-muted-foreground">Effective Tax Rate:</div>
                      <div className="text-sm font-medium">{incomeTaxResult.effectiveRate.toFixed(2)}%</div>
                    </div>
                    
                    <Button 
                      className="w-full mt-4"
                      onClick={handleAddIncomeTaxRecord}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Tax Records
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Pakistani Income Tax Slabs (Simplified)</h3>
                <div className="text-xs space-y-1">
                  <p>• Up to Rs. 600,000: 0%</p>
                  <p>• Rs. 600,001 - 1,200,000: 5% of amount exceeding Rs. 600,000</p>
                  <p>• Rs. 1,200,001 - 2,400,000: Rs. 30,000 + 10% of amount exceeding Rs. 1,200,000</p>
                  <p>• Rs. 2,400,001 - 3,600,000: Rs. 150,000 + 15% of amount exceeding Rs. 2,400,000</p>
                  <p>• Rs. 3,600,001 - 6,000,000: Rs. 330,000 + 20% of amount exceeding Rs. 3,600,000</p>
                  <p>• Rs. 6,000,001 - 12,000,000: Rs. 810,000 + 25% of amount exceeding Rs. 6,000,000</p>
                  <p>• Above Rs. 12,000,000: Rs. 2,310,000 + 30% of amount exceeding Rs. 12,000,000</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Zakat Calculator */}
        <Card>
          <CardHeader>
            <CardTitle>Zakat Calculator</CardTitle>
            <CardDescription>Calculate Zakat based on Islamic principles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="netAssets">Net Assets (Rs.)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="netAssets"
                    type="number"
                    placeholder="Enter your net assets"
                    value={netAssets}
                    onChange={(e) => setNetAssets(e.target.value)}
                  />
                  <Button
                    onClick={handleCalculateZakat}
                    disabled={zakatCalculating}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate
                  </Button>
                </div>
              </div>
              
              {zakatResult && (
                <div className="space-y-4 mt-6">
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Zakat Calculation Result</h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-muted-foreground">Net Assets:</div>
                      <div className="text-sm font-medium">Rs. {zakatResult.netAssets.toLocaleString()}</div>
                      
                      <div className="text-sm text-muted-foreground">Zakat Rate:</div>
                      <div className="text-sm font-medium">{zakatResult.zakatRate.toFixed(2)}%</div>
                      
                      <div className="text-sm text-muted-foreground">Zakat Amount:</div>
                      <div className="text-sm font-medium">Rs. {zakatResult.zakatAmount.toLocaleString()}</div>
                    </div>
                    
                    <Button 
                      className="w-full mt-4"
                      onClick={handleAddZakatRecord}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Tax Records
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Zakat in Islam</h3>
                <div className="text-xs space-y-2">
                  <p>
                    Zakat is a form of almsgiving treated in Islam as a religious obligation, which, 
                    by Quranic ranking, is next after prayer (salat) in importance.
                  </p>
                  <p>
                    The standard rate for Zakat is 2.5% of a Muslim&apos;s total savings and wealth that has been in possession 
                    for one lunar year, if the total value is above the nisab threshold (approximately the value of 87.48 grams of gold).
                  </p>
                  <p>
                    This calculator applies the standard rate of 2.5% to your net assets. For more precise calculations 
                    based on types of assets, please consult with an Islamic finance expert.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaxCalculator; 