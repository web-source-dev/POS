"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTaxSettings, updateTaxSettings } from "@/services/taxService";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { TaxSlab, TaxSettings as TaxSettingsType } from "@/types/tax";

const TaxSettings = () => {
  const [settings, setSettings] = useState<TaxSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  // Form state for custom tax slabs
  const [customSlabs, setCustomSlabs] = useState<TaxSlab[]>([]);
  
  useEffect(() => {
    fetchTaxSettings();
  }, []);
  
  const fetchTaxSettings = async () => {
    try {
      setLoading(true);
      const data = await getTaxSettings();
      setSettings(data);
      
      // Initialize custom slabs if available
      if (data && data.customTaxSlabs && data.customTaxSlabs.length > 0) {
        setCustomSlabs(data.customTaxSlabs);
      }
    } catch (error) {
      console.error("Error fetching tax settings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tax settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Ensure we have valid custom slabs if they're enabled
      if (!settings?.useDefaultTaxSlabs && customSlabs.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one custom tax slab or enable default tax slabs.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      // Include custom slabs in the settings
      const updatedSettings = {
        ...settings,
        customTaxSlabs: customSlabs
      };
      
      await updateTaxSettings(updatedSettings);
      
      toast({
        title: "Success",
        description: "Tax settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating tax settings:", error);
      toast({
        title: "Error",
        description: "Failed to update tax settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdateSetting = (key: string, value: string | number | boolean | object) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [key]: value
    });
  };
  
  const handleAddCustomSlab = () => {
    setCustomSlabs([
      ...customSlabs,
      {
        minIncome: 0,
        maxIncome: undefined,
        fixedAmount: 0,
        rate: 0,
        description: ""
      }
    ]);
  };
  
  const handleRemoveCustomSlab = (index: number) => {
    const newSlabs = [...customSlabs];
    newSlabs.splice(index, 1);
    setCustomSlabs(newSlabs);
  };
  
  const handleUpdateCustomSlab = (index: number, field: keyof TaxSlab, value: string | number | boolean | undefined) => {
    const newSlabs = [...customSlabs];
    newSlabs[index] = {
      ...newSlabs[index],
      [field]: value
    };
    setCustomSlabs(newSlabs);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading tax settings...</span>
      </div>
    );
  }
  
  if (!settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Failed to load tax settings. Please refresh the page.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold">Tax Settings</h2>
        <p className="text-muted-foreground">
          Configure your tax settings and preferences
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="income">Income Tax</TabsTrigger>
          <TabsTrigger value="sales">Sales Tax</TabsTrigger>
          <TabsTrigger value="zakat">Zakat</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Tax Settings</CardTitle>
                <CardDescription>Configure your business information and tax identifiers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessType">Business Type</Label>
                      <Select 
                        value={settings.businessType} 
                        onValueChange={(value) => handleUpdateSetting("businessType", value)}
                      >
                        <SelectTrigger id="businessType">
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                          <SelectItem value="Partnership">Partnership</SelectItem>
                          <SelectItem value="Private Limited">Private Limited</SelectItem>
                          <SelectItem value="Public Limited">Public Limited</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nationalTaxNumber">National Tax Number (NTN)</Label>
                      <Input 
                        id="nationalTaxNumber" 
                        placeholder="Enter your NTN" 
                        value={settings.nationalTaxNumber || ""} 
                        onChange={(e) => handleUpdateSetting("nationalTaxNumber", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="taxIdentificationNumber">Tax Identification Number (TIN)</Label>
                      <Input 
                        id="taxIdentificationNumber" 
                        placeholder="Enter your TIN" 
                        value={settings.taxIdentificationNumber || ""} 
                        onChange={(e) => handleUpdateSetting("taxIdentificationNumber", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Tax Filing Periods</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="incomeTaxPeriod">Income Tax Filing</Label>
                      <Select 
                        value={settings.taxFilingPeriods?.incomeTax || "Annually"} 
                        onValueChange={(value) => handleUpdateSetting("taxFilingPeriods", {
                          ...settings.taxFilingPeriods,
                          incomeTax: value
                        })}
                      >
                        <SelectTrigger id="incomeTaxPeriod">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Quarterly">Quarterly</SelectItem>
                          <SelectItem value="Annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="salesTaxPeriod">Sales Tax Filing</Label>
                      <Select 
                        value={settings.taxFilingPeriods?.salesTax || "Monthly"} 
                        onValueChange={(value) => handleUpdateSetting("taxFilingPeriods", {
                          ...settings.taxFilingPeriods,
                          salesTax: value
                        })}
                      >
                        <SelectTrigger id="salesTaxPeriod">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Quarterly">Quarterly</SelectItem>
                          <SelectItem value="Annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="zakatPeriod">Zakat Assessment</Label>
                      <Select 
                        value={settings.taxFilingPeriods?.zakat || "Annually"} 
                        onValueChange={(value) => handleUpdateSetting("taxFilingPeriods", {
                          ...settings.taxFilingPeriods,
                          zakat: value
                        })}
                      >
                        <SelectTrigger id="zakatPeriod">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Annually">Annually</SelectItem>
                          <SelectItem value="Custom">Custom (Islamic Calendar)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Reminders</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="enableReminders" 
                      checked={settings.enableTaxReminders} 
                      onCheckedChange={(value) => handleUpdateSetting("enableTaxReminders", value)}
                    />
                    <Label htmlFor="enableReminders">Enable tax filing reminders</Label>
                  </div>
                  
                  {settings.enableTaxReminders && (
                    <div className="space-y-2">
                      <Label htmlFor="reminderDays">Remind me this many days before due date</Label>
                      <Input 
                        id="reminderDays" 
                        type="number" 
                        placeholder="Enter days" 
                        min={1}
                        max={30}
                        value={settings.reminderDays || 7} 
                        onChange={(e) => handleUpdateSetting("reminderDays", parseInt(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Income Tax Settings */}
          <TabsContent value="income">
            <Card>
              <CardHeader>
                <CardTitle>Income Tax Settings</CardTitle>
                <CardDescription>Configure income tax calculation preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="incomeTaxEnabled" 
                      checked={settings.incomeTaxEnabled} 
                      onCheckedChange={(value) => handleUpdateSetting("incomeTaxEnabled", value)}
                    />
                    <Label htmlFor="incomeTaxEnabled">Enable income tax calculations</Label>
                  </div>
                  
                  {settings.incomeTaxEnabled && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="useDefaultSlabs" 
                          checked={settings.useDefaultTaxSlabs} 
                          onCheckedChange={(value) => handleUpdateSetting("useDefaultTaxSlabs", value)}
                        />
                        <Label htmlFor="useDefaultSlabs">Use standard Pakistani income tax slabs</Label>
                      </div>
                      
                      {!settings.useDefaultTaxSlabs && (
                        <div className="space-y-4 mt-6">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium">Custom Tax Slabs</h3>
                            <Button onClick={handleAddCustomSlab} size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Slab
                            </Button>
                          </div>
                          
                          {customSlabs.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">
                              No custom tax slabs defined. Add your first slab or enable standard Pakistani tax slabs.
                            </p>
                          ) : (
                            <div className="space-y-4">
                              {customSlabs.map((slab, index) => (
                                <Card key={index} className="p-4">
                                  <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-medium">Tax Slab {index + 1}</h4>
                                    <Button 
                                      variant="outline" 
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleRemoveCustomSlab(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Minimum Income (Rs.)</Label>
                                      <Input 
                                        type="number" 
                                        placeholder="Enter min income" 
                                        value={slab.minIncome} 
                                        onChange={(e) => handleUpdateCustomSlab(
                                          index, 
                                          "minIncome", 
                                          parseFloat(e.target.value)
                                        )}
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label>Maximum Income (Rs.)</Label>
                                      <Input 
                                        type="number" 
                                        placeholder="Enter max income (optional)" 
                                        value={slab.maxIncome || ""} 
                                        onChange={(e) => handleUpdateCustomSlab(
                                          index, 
                                          "maxIncome", 
                                          e.target.value ? parseFloat(e.target.value) : undefined
                                        )}
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label>Fixed Amount (Rs.)</Label>
                                      <Input 
                                        type="number" 
                                        placeholder="Enter fixed amount" 
                                        value={slab.fixedAmount} 
                                        onChange={(e) => handleUpdateCustomSlab(
                                          index, 
                                          "fixedAmount", 
                                          parseFloat(e.target.value)
                                        )}
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label>Rate (%)</Label>
                                      <Input 
                                        type="number" 
                                        placeholder="Enter rate percentage" 
                                        min={0}
                                        max={100}
                                        value={slab.rate} 
                                        onChange={(e) => handleUpdateCustomSlab(
                                          index, 
                                          "rate", 
                                          parseFloat(e.target.value)
                                        )}
                                      />
                                    </div>
                                    
                                    <div className="space-y-2 md:col-span-2">
                                      <Label>Description</Label>
                                      <Input 
                                        placeholder="Enter description for this slab" 
                                        value={slab.description} 
                                        onChange={(e) => handleUpdateCustomSlab(
                                          index, 
                                          "description", 
                                          e.target.value
                                        )}
                                      />
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Sales Tax Settings */}
          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle>Sales Tax Settings</CardTitle>
                <CardDescription>Configure sales tax calculation preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="salesTaxEnabled" 
                      checked={settings.salesTaxEnabled} 
                      onCheckedChange={(value) => handleUpdateSetting("salesTaxEnabled", value)}
                    />
                    <Label htmlFor="salesTaxEnabled">Enable sales tax calculations</Label>
                  </div>
                  
                  {settings.salesTaxEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="salesTaxRate">Sales Tax Rate (%)</Label>
                        <Input 
                          id="salesTaxRate" 
                          type="number" 
                          placeholder="Enter sales tax rate" 
                          min={0}
                          max={100}
                          value={settings.salesTaxRate || 17} 
                          onChange={(e) => handleUpdateSetting("salesTaxRate", parseFloat(e.target.value))}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="salesTaxIncludedInPrice" 
                          checked={settings.salesTaxIncludedInPrice} 
                          onCheckedChange={(value) => handleUpdateSetting("salesTaxIncludedInPrice", value)}
                        />
                        <Label htmlFor="salesTaxIncludedInPrice">Tax included in product prices</Label>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Zakat Settings */}
          <TabsContent value="zakat">
            <Card>
              <CardHeader>
                <CardTitle>Zakat Settings</CardTitle>
                <CardDescription>Configure Zakat calculation preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="zakatEnabled" 
                      checked={settings.zakatEnabled} 
                      onCheckedChange={(value) => handleUpdateSetting("zakatEnabled", value)}
                    />
                    <Label htmlFor="zakatEnabled">Enable Zakat calculations</Label>
                  </div>
                  
                  {settings.zakatEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="zakatCalculationType">Calculation Type</Label>
                        <Select 
                          value={settings.zakatCalculationType} 
                          onValueChange={(value) => handleUpdateSetting("zakatCalculationType", value)}
                        >
                          <SelectTrigger id="zakatCalculationType">
                            <SelectValue placeholder="Select calculation type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Automatic">Automatic (Standard 2.5%)</SelectItem>
                            <SelectItem value="Manual">Manual (Custom Rate)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {settings.zakatCalculationType === "Manual" && (
                        <div className="space-y-2">
                          <Label htmlFor="zakatRate">Zakat Rate (%)</Label>
                          <Input 
                            id="zakatRate" 
                            type="number" 
                            placeholder="Enter Zakat rate" 
                            min={0}
                            max={100}
                            value={settings.zakatRate || 2.5} 
                            onChange={(e) => handleUpdateSetting("zakatRate", parseFloat(e.target.value))}
                          />
                        </div>
                      )}
                      
                      <div className="pt-4">
                        <h3 className="text-sm font-medium mb-2">Islamic Zakat Principles</h3>
                        <p className="text-sm text-muted-foreground">
                          Zakat is due on wealth that has been in possession for one lunar year and meets the nisab threshold. 
                          It is typically calculated at 2.5% of eligible assets. For specific questions regarding Zakat calculation, 
                          please consult with an Islamic scholar.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
      
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={fetchTaxSettings} disabled={saving}>
          Reset Changes
        </Button>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default TaxSettings; 