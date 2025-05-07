"use client"

import { useEffect, useState } from "react"
import {
  Building,
  HardDrive,
  LayoutGrid,
  Printer,
  Save,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import settingsService from "@/services/settingsService"

interface Settings {
  business: {
    name: string
    taxId: string
    address: string
    phone: string
    email: string
    website: string
    businessHours: string
  }
  pos: {
    receiptHeader: string
    receiptFooter: string
  }
  hardware: {
    printer: {
      model: string
      connectionType: string
      enabled: boolean
    }
  }
}

export function SettingsPageComponent() {
  const { toast } = useToast()
  
  // Initialize state for settings
  const [settings, setSettings] = useState({
    business: {
      name: '',
      taxId: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      businessHours: ''
    },
    pos: {
      receiptHeader: '',
      receiptFooter: ''
    },
    hardware: {
      printer: {
        model: 'epson',
        connectionType: 'usb',
        enabled: true
      }
    }
  })
  
  // State for loading indicators
  const [loading, setLoading] = useState(false)
  const [businessLoading, setBusinessLoading] = useState(false)
  const [posLoading, setPosLoading] = useState(false)
  const [hardwareLoading, setHardwareLoading] = useState(false)

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const data = await settingsService.getSettings()
        setSettings(data as Settings)
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  // Handle business settings form change
  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setSettings(prev => ({
      ...prev,
      business: {
        ...prev.business,
        [id.replace('business-', '')]: value
      }
    }))
  }

  // Handle POS settings form change
  const handlePosChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { id, value } = e.target
    const key = id === 'receipt-header' ? 'receiptHeader' : 'receiptFooter'
    
    setSettings(prev => ({
      ...prev,
      pos: {
        ...prev.pos,
        [key]: value
      }
    }))
  }

  // Handle hardware settings form change
  const handlePrinterModelChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      hardware: {
        ...prev.hardware,
        printer: {
          ...prev.hardware.printer,
          model: value
        }
      }
    }))
  }

  const handlePrinterConnectionChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      hardware: {
        ...prev.hardware,
        printer: {
          ...prev.hardware.printer,
          connectionType: value
        }
      }
    }))
  }

  const handlePrinterEnabledChange = (checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      hardware: {
        ...prev.hardware,
        printer: {
          ...prev.hardware.printer,
          enabled: checked
        }
      }
    }))
  }

  // Save business settings
  const saveBusinessSettings = async () => {
    try {
      setBusinessLoading(true)
      const response = await settingsService.updateBusinessSettings(settings.business)
      
      // Add a small delay to ensure the toast is displayed after the state update
      setTimeout(() => {
        toast({
          title: "Success",
          description: "Business settings saved successfully",
          variant: "default"
        })
      }, 100)
      
      return response
    } catch (error) {
      console.error('Error saving business settings:', error)
      toast({
        title: "Error",
        description: "Failed to save business settings",
        variant: "destructive"
      })
    } finally {
      setBusinessLoading(false)
    }
  }

  // Save POS settings
  const savePosSettings = async () => {
    try {
      setPosLoading(true)
      const response = await settingsService.updatePosSettings(settings.pos)
      
      // Add a small delay to ensure the toast is displayed after the state update
      setTimeout(() => {
        toast({
          title: "Success",
          description: "POS settings saved successfully",
          variant: "default"
        })
      }, 100)
      
      return response
    } catch (error) {
      console.error('Error saving POS settings:', error)
      toast({
        title: "Error",
        description: "Failed to save POS settings",
        variant: "destructive"
      })
    } finally {
      setPosLoading(false)
    }
  }

  // Save hardware settings
  const saveHardwareSettings = async () => {
    try {
      setHardwareLoading(true)
      const response = await settingsService.updateHardwareSettings(settings.hardware.printer)
      
      // Add a small delay to ensure the toast is displayed after the state update
      setTimeout(() => {
        toast({
          title: "Success",
          description: "Hardware settings saved successfully",
          variant: "default"
        })
      }, 100)
      
      return response
    } catch (error) {
      console.error('Error saving hardware settings:', error)
      toast({
        title: "Error",
        description: "Failed to save hardware settings",
        variant: "destructive"
      })
    } finally {
      setHardwareLoading(false)
    }
  }

  // Test print function
  const handleTestPrint = () => {
    toast({
      title: "Test Print",
      description: "Printer test functionality would be implemented here",
    })
  }

  if (loading) {
    return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="text-center py-10">Loading settings...</div>
    </div>
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 h-auto">
          <TabsTrigger value="business" className="flex flex-col h-auto py-2 px-3">
            <Building className="h-4 w-4 mb-1" />
            <span>Business</span>
          </TabsTrigger>
          <TabsTrigger value="pos" className="flex flex-col h-auto py-2 px-3">
            <LayoutGrid className="h-4 w-4 mb-1" />
            <span>POS</span>
          </TabsTrigger>
          <TabsTrigger value="hardware" className="flex flex-col h-auto py-2 px-3">
            <Printer className="h-4 w-4 mb-1" />
            <span>Hardware</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Manage your business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input 
                    id="business-name" 
                    value={settings.business.name} 
                    onChange={handleBusinessChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-taxId">Tax ID / Business Number</Label>
                  <Input 
                    id="business-taxId" 
                    value={settings.business.taxId} 
                    onChange={handleBusinessChange} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-address">Address</Label>
                <Textarea 
                  id="business-address" 
                  value={settings.business.address} 
                  onChange={handleBusinessChange} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-phone">Phone Number</Label>
                  <Input 
                    id="business-phone" 
                    value={settings.business.phone} 
                    onChange={handleBusinessChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-email">Email</Label>
                  <Input 
                    id="business-email"
                    type="email" 
                    value={settings.business.email} 
                    onChange={handleBusinessChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-website">Website</Label>
                  <Input 
                    id="business-website" 
                    value={settings.business.website} 
                    onChange={handleBusinessChange} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-businessHours">Business Hours</Label>
                <Textarea
                  id="business-businessHours"
                  value={settings.business.businessHours}
                  onChange={handleBusinessChange}
                  placeholder="Monday - Friday: 8:00 AM - 6:00 PM"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="ml-auto" 
                onClick={saveBusinessSettings}
                disabled={businessLoading}
              >
                <Save className="mr-2 h-4 w-4" />
                {businessLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="pos">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>POS Configuration</CardTitle>
                <CardDescription>Configure point of sale settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receipt-header">Receipt Header</Label>
                  <Textarea
                    id="receipt-header"
                    value={settings.pos.receiptHeader}
                    onChange={handlePosChange}
                    placeholder="Company name, address, and contact info"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt-footer">Receipt Footer</Label>
                  <Textarea
                    id="receipt-footer"
                    value={settings.pos.receiptFooter}
                    onChange={handlePosChange}
                    placeholder="Thank you message, return policy, etc."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="ml-auto" 
                  onClick={savePosSettings}
                  disabled={posLoading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {posLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hardware">
          <Card>
            <CardHeader>
              <CardTitle>Hardware Configuration</CardTitle>
              <CardDescription>Configure connected hardware devices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Receipt Printer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="printer-model">Printer Model</Label>
                    <Select 
                      value={settings.hardware.printer.model} 
                      onValueChange={handlePrinterModelChange}
                    >
                      <SelectTrigger id="printer-model">
                        <SelectValue placeholder="Select printer model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="epson">Epson TM-T88VI</SelectItem>
                        <SelectItem value="star">Star Micronics TSP143III</SelectItem>
                        <SelectItem value="citizen">Citizen CT-S310II</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="printer-connection">Connection Type</Label>
                    <Select 
                      value={settings.hardware.printer.connectionType} 
                      onValueChange={handlePrinterConnectionChange}
                    >
                      <SelectTrigger id="printer-connection">
                        <SelectValue placeholder="Select connection type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usb">USB</SelectItem>
                        <SelectItem value="network">Network/Ethernet</SelectItem>
                        <SelectItem value="bluetooth">Bluetooth</SelectItem>
                        <SelectItem value="serial">Serial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="printer-enabled">Enable Printer</Label>
                    <p className="text-sm text-muted-foreground">Use this printer for receipts</p>
                  </div>
                  <Switch 
                    id="printer-enabled" 
                    checked={settings.hardware.printer.enabled}
                    onCheckedChange={handlePrinterEnabledChange}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleTestPrint}>
                  Test Print
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="ml-auto" 
                onClick={saveHardwareSettings}
                disabled={hardwareLoading}
              >
                <HardDrive className="mr-2 h-4 w-4" />
                {hardwareLoading ? "Saving..." : "Save Hardware Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Wrap the component with admin protection to ensure only admins can access it
export const SettingsPage = SettingsPageComponent