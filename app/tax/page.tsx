"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaxDashboard from "@/components/tax/TaxDashboard";
import TaxRecords from "@/components/tax/TaxRecords";
import TaxCalculator from "@/components/tax/TaxCalculator";
import TaxSettings from "@/components/tax/TaxSettings";
import { withAuthProtection } from "@/lib/protected-route";
import { MainLayout } from "@/components/layout/main-layout";
import { useSearchParams } from "next/navigation";

const TaxManagement = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check for tab parameter in URL
    const tabParam = searchParams.get("tab");
    if (tabParam && ["dashboard", "records", "calculator", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <MainLayout>
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold">Tax Management</h1>
        <p className="text-muted-foreground">
          Manage taxes, track payments, and calculate tax obligations
        </p>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="records">Tax Records</TabsTrigger>
          <TabsTrigger value="calculator">Tax Calculator</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="dashboard">
            <TaxDashboard />
          </TabsContent>
          
          <TabsContent value="records">
            <TaxRecords />
          </TabsContent>
          
          <TabsContent value="calculator">
            <TaxCalculator />
          </TabsContent>
          
          <TabsContent value="settings">
            <TaxSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
    </MainLayout>
  );
};

export default withAuthProtection(TaxManagement); 