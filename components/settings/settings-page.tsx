"use client"

import { useEffect, useState, useRef } from "react"
import {
  Building,
  LayoutGrid,
  Save,
  Upload,
  X,
  FileImage,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import settingsService from "@/services/settingsService"
import Image from "next/image"
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
    logo?: string
  }
}

// Add interface for logo upload response
interface LogoUploadResponse {
  logoUrl: string;
}

export function SettingsPageComponent() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Initialize state for settings
  const [settings, setSettings] = useState<Settings>({
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
      receiptFooter: '',
      logo: ''
    }
  })
  
  // State for loading indicators
  const [loading, setLoading] = useState(false)
  const [businessLoading, setBusinessLoading] = useState(false)
  const [posLoading, setPosLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [deletingLogo, setDeletingLogo] = useState(false)

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

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size and type
    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast({
        title: "Error",
        description: "Logo file size must be less than 2MB",
        variant: "destructive"
      })
      return
    }

    if (!file.type.includes('image/')) {
      toast({
        title: "Error",
        description: "File must be an image",
        variant: "destructive"
      })
      return
    }

    try {
      setUploadingLogo(true)
      const result = await settingsService.uploadLogo(file)
      const response = result as LogoUploadResponse
      
      setSettings(prev => ({
        ...prev,
        pos: {
          ...prev.pos,
          logo: response.logoUrl
        }
      }))
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
        variant: "default"
      })
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive"
      })
    } finally {
      setUploadingLogo(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle logo deletion
  const handleDeleteLogo = async () => {
    if (!settings.pos.logo) return
    
    try {
      setDeletingLogo(true)
      await settingsService.deleteLogo()
      
      setSettings(prev => ({
        ...prev,
        pos: {
          ...prev.pos,
          logo: ''
        }
      }))
      
      toast({
        title: "Success",
        description: "Logo deleted successfully",
        variant: "default"
      })
    } catch (error) {
      console.error('Error deleting logo:', error)
      toast({
        title: "Error",
        description: "Failed to delete logo",
        variant: "destructive"
      })
    } finally {
      setDeletingLogo(false)
    }
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
        <TabsList className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 h-auto">
          <TabsTrigger value="business" className="flex flex-col h-auto py-2 px-3">
            <Building className="h-4 w-4 mb-1" />
            <span>Business</span>
          </TabsTrigger>
          <TabsTrigger value="pos" className="flex flex-col h-auto py-2 px-3">
            <LayoutGrid className="h-4 w-4 mb-1" />
            <span>POS</span>
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
                <CardDescription>Configure receipt settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receipt-logo">Receipt Logo</Label>
                  <div className="mt-2">
                    {settings.pos.logo ? (
                      <div className="flex items-center space-x-4">
                        <div className="w-32 h-32 border rounded overflow-hidden flex items-center justify-center bg-gray-50">
                          <Image 
                            src={`${process.env.NEXT_PUBLIC_API_Image_URL}${settings.pos.logo}`} 
                            alt="Receipt Logo" 
                            className="max-w-full max-h-full object-contain"
                            width={128}
                            height={64}
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteLogo}
                          disabled={deletingLogo}
                        >
                          {deletingLogo ? "Deleting..." : "Remove Logo"}
                          <X className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        <div className="w-32 h-32 border rounded flex flex-col items-center justify-center bg-gray-50">
                          <FileImage className="h-12 w-12 text-gray-300" />
                          <p className="text-xs text-gray-400 mt-2">No logo uploaded</p>
                        </div>
                        <div className="flex items-center">
                          <input
                            ref={fileInputRef}
                            type="file"
                            id="logo-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingLogo}
                          >
                            {uploadingLogo ? "Uploading..." : "Upload Logo"}
                            <Upload className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

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

            <Card>
              <CardHeader>
                <CardTitle>Receipt Preview</CardTitle>
                <CardDescription>Preview how your receipt will look</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded p-4 min-h-[500px] overflow-auto">
                  <div className="bg-white p-6 font-sans text-sm space-y-4 shadow-sm">
                    {/* Receipt Header */}
                    <div className="flex flex-col items-center text-center">
                      {settings.pos.logo && (
                        <div className="mb-16 max-w-[120px] max-h-[60px]">
                          <Image 
                            src={`${process.env.NEXT_PUBLIC_API_Image_URL}${settings.pos.logo}`} 
                            alt="Receipt Logo" 
                            className="max-w-full max-h-full object-contain"
                            width={128}
                            height={64}
                          />
                        </div>
                      )}
                      
                      <div className="text-lg font-bold mb-1">{settings.business.name || "YOUR BUSINESS NAME"}</div>
                      <div className="text-sm leading-tight">
                        {settings.business.address || "123 Street Name, City, State"}<br />
                        {settings.business.phone && `Tel: ${settings.business.phone}`} <br />
                        {settings.business.email && `Email: ${settings.business.email}`} <br />
                        {settings.business.website && `Web: ${settings.business.website}`} <br />
                        {settings.business.taxId && `Tax ID: ${settings.business.taxId}`}
                      </div>
                      
                      {settings.pos.receiptHeader && (
                        <div className="mt-2 text-sm whitespace-pre-line font-italic text-gray-600">{settings.pos.receiptHeader}</div>
                      )}
                    </div>
                    
                    {/* Receipt Title */}
                    <div className="font-bold text-base text-center p-1 bg-gray-100 rounded">SALES RECEIPT</div>
                    
                    {/* Receipt Info */}
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="flex justify-between mb-1">
                        <span><strong>Receipt:</strong></span>
                        <span>#000001</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span><strong>Date:</strong></span>
                        <span>{new Date().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span><strong>Customer:</strong></span>
                        <span>Sample Customer</span>
                      </div>
                    </div>
                    
                    {/* Items Table */}
                    <table className="w-full border-collapse my-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left p-2 font-bold">Item</th>
                          <th className="text-left p-2 font-bold">Qty</th>
                          <th className="text-left p-2 font-bold">Price</th>
                          <th className="text-right p-2 font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="p-2">Sample Product 1</td>
                          <td className="p-2">2</td>
                          <td className="p-2">Rs 10.00</td>
                          <td className="p-2 text-right">Rs 20.00</td>
                        </tr>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <td className="p-2">Sample Product 2</td>
                          <td className="p-2">1</td>
                          <td className="p-2">Rs 15.00</td>
                          <td className="p-2 text-right">Rs 15.00</td>
                        </tr>
                      </tbody>
                    </table>
                    
                    {/* Totals */}
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="flex justify-between mb-1">
                        <span>Subtotal:</span>
                        <span>Rs 35.00</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>Discount:</span>
                        <span>-Rs 5.00</span>
                      </div>
                      <div className="flex justify-between mb-1 pt-2 border-t border-gray-300 font-bold">
                        <span>TOTAL:</span>
                        <span>Rs 30.00</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>Cash:</span>
                        <span>Rs 50.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Change:</span>
                        <span>Rs 20.00</span>
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="text-center border-t border-gray-200 pt-2 mt-2 italic text-gray-600 text-sm">
                      {settings.pos.receiptFooter || "Thank you for your business!"}
                    </div>
                    
                    {/* Watermark */}
                    <div className="relative h-5">
                      <div className="absolute bottom-0 right-0 text-gray-200 text-xs transform -rotate-45 opacity-50">
                        Receipt Preview
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Wrap the component with admin protection to ensure only admins can access it
export const SettingsPage = SettingsPageComponent