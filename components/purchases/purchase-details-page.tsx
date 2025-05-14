"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, Download, FileText, Package, Printer, ShoppingCart, 
  User, Calendar, DollarSign, CreditCard, AlertTriangle, CheckCircle 
} from "lucide-react"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

import purchaseService from "@/services/purchaseService"
import { withAuthProtection } from "@/lib/protected-route"
import settingsService from "@/services/settingsService"

// PurchaseOrder interface
interface PurchaseOrder {
  _id: string
  items: Array<{
    itemId: string
    name: string
    sku: string
    quantity: number
    price: number
  }>
  receiptNumber: string
  subtotal: number
  discount: number
  total: number
  cashAmount: number
  change: number
  customerName: string
  userId: string
  date: string
}

// BusinessSettings interface
interface BusinessSettings {
  business?: {
    name?: string
    address?: string
    phone?: string
    email?: string
    website?: string
    taxId?: string
  }
  pos?: {
    logo?: string
    receiptHeader?: string
    receiptFooter?: string
  }
}

function PurchaseDetailsPageContent({ id }: { id: string }) {
  const [purchase, setPurchase] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const receiptRef = useRef<HTMLDivElement>(null)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const router = useRouter()

  // Load purchase details
  useEffect(() => {
    async function loadPurchaseDetails() {
      try {
        setLoading(true)
        const data = await purchaseService.getPurchaseById(id)
        setPurchase(data as PurchaseOrder)
        
        // Also load business settings for the receipt
        try {
          const settings = await settingsService.getSettings()
          setBusinessSettings(settings)
        } catch (settingsError) {
          console.error("Error loading business settings:", settingsError)
        }
      } catch (error) {
        console.error("Error loading sale details:", error)
        setError("Failed to load sale details. Please try again.")
        toast({
          variant: "destructive",
          title: "Error",
            description: "Failed to load sale details. Please try again."
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadPurchaseDetails()
    }
  }, [id])

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPpp") // Full date and time format
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  // Format receipt number with leading zeros
  const formatReceiptNumber = (id: string, receiptNum?: string) => {
    if (receiptNum) return receiptNum;
    return `#${id.slice(-6).padStart(6, '0')}`;
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toFixed(2)}`
  }

  // Print receipt function
  const handlePrintReceipt = () => {
    if (!purchase) return
    
    try {
      const logoUrl = businessSettings?.pos?.logo 
        ? `${process.env.NEXT_PUBLIC_API_Image_URL}${businessSettings.pos.logo}`
        : ''
      
      const receiptNumber = purchase.receiptNumber || formatReceiptNumber(purchase._id)
      const formattedDate = formatDate(purchase.date)

      // Ensure items are properly processed
      const validItems = purchase.items.map((item) => {
        return {
          name: item.name || 'Unknown Item',
          quantity: item.quantity || 1,
          price: item.price || 0,
          sku: item.sku || ''
        }
      })
      
      // Function to create base64 image fallback if direct URL fails
      const getImgFallbackScript = `
        function handleImageError(img) {
          // If we already tried Base64, don't retry
          if (img.src.indexOf('data:image') === 0) return;
          
          // Try to use fetch to get the image as Base64
          fetch(img.src)
            .then(response => response.blob())
            .then(blob => {
              const reader = new FileReader();
              reader.onload = function() {
                img.src = reader.result;
              };
              reader.readAsDataURL(blob);
            })
            .catch(error => {
              console.error('Failed to load image:', error);
              img.style.display = 'none';
            });
        }
      `;

      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Failed to open print window')
      }
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Sale Receipt ${receiptNumber}</title>
          <style>
            /* Reset */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Arial', sans-serif;
              font-size: 12px;
            }
            
            /* Main layout - Two receipts side by side in landscape mode */
            body {
              width: 297mm; /* A4 height becomes width in landscape */
              height: 210mm; /* A4 width becomes height in landscape */
              padding: 10mm;
              background-color: #f9f9f9;
            }
            
            .page {
              display: flex;
              width: 100%;
              height: 100%;
              background-color: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            
            .receipt {
              flex: 1;
              padding: 12mm;
              display: flex;
              flex-direction: column;
              position: relative;
            }
            
            .receipt:first-child {
              border-right: 2px dashed #ccc;
            }
            
            /* Receipt header */
            .receipt-header {
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            
            .logo {
              max-width: 120px;
              max-height: 60px;
              margin-bottom: 10px;
              object-fit: contain;
            }
            
            .business-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
              color: #333;
            }
            
            .business-details {
              margin-bottom: 10px;
              line-height: 1.4;
              color: #555;
            }
            
            .custom-header {
              margin: 10px 0;
              white-space: pre-line;
              font-style: italic;
              color: #666;
            }
            
            /* Receipt details */
            .receipt-title {
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              margin: 10px 0;
              padding: 5px 0;
              background-color: #f7f7f7;
              border-radius: 4px;
            }
            
            .receipt-info {
              margin-bottom: 15px;
              background-color: #f9f9f9;
              padding: 8px;
              border-radius: 4px;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            
            .copy-type {
              position: absolute;
              top: 5mm;
              right: 5mm;
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              background-color: #f0f0f0;
              padding: 3px 8px;
              border-radius: 4px;
              color: #555;
              transform: rotate(3deg);
            }
            
            /* Items table */
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            
            .items-table th {
              text-align: left;
              padding: 8px 5px;
              font-weight: bold;
              background-color: #f0f0f0;
              border-bottom: 2px solid #ddd;
              color: #444;
            }
            
            .items-table th:last-child,
            .items-table td:last-child {
              text-align: right;
            }
            
            .items-table td {
              padding: 8px 5px;
              border-bottom: 1px solid #eee;
            }
            
            .items-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            .items-table tr:hover {
              background-color: #f5f5f5;
            }
            
            /* Totals */
            .totals {
              margin-top: 10px;
              margin-left: auto;
              width: 100%;
              background-color: #f9f9f9;
              padding: 10px;
              border-radius: 4px;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              padding: 3px 0;
            }
            
            .total-row.final {
              font-weight: bold;
              font-size: 14px;
              border-top: 2px solid #ddd;
              padding-top: 8px;
              margin-top: 5px;
              color: #222;
            }
            
            /* Receipt footer */
            .receipt-footer {
              margin-top: auto;
              text-align: center;
              white-space: pre-line;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #eee;
              font-style: italic;
              color: #666;
            }
            
            /* Automatic print when loaded */
            @media print {
              @page {
                margin: 0;
                size: A4 landscape;
              }
              
              body {
                padding: 0;
                background-color: white;
              }
              
              .page {
                box-shadow: none;
              }
              
              .receipt {
                border: none;
              }
              
              .receipt:first-child {
                border-right: 2px dashed #ccc;
              }
              
              .no-print {
                display: none;
              }
            }
            
            .watermark {
              position: absolute;
              bottom: 20px;
              right: 20px;
              font-size: 11px;
              color: #ddd;
              transform: rotate(-45deg);
              opacity: 0.5;
            }
          </style>
          <script>
            ${getImgFallbackScript}
            window.onload = function() { 
              // Delay printing to allow images to load
              setTimeout(function() {
                window.print();
                window.close();
              }, 1000);
            }
          </script>
        </head>
        <body>
          <div class="page">
            <!-- CUSTOMER COPY -->
            <div class="receipt">
              <div class="copy-type">Customer Copy</div>
              
              <div class="receipt-header">
                ${logoUrl ? `<img src="${logoUrl}" alt="${businessSettings?.business?.name || 'Business'} Logo" class="logo" onerror="handleImageError(this)">` : ''}
                <div class="business-name">${businessSettings?.business?.name || 'Your Business Name'}</div>
                <div class="business-details">
                  ${businessSettings?.business?.address || 'Business Address'}<br>
                  ${businessSettings?.business?.phone ? `Tel: ${businessSettings.business.phone}` : ''} 
                  ${businessSettings?.business?.email ? `<br>Email: ${businessSettings.business.email}` : ''}
                  ${businessSettings?.business?.website ? `<br>Web: ${businessSettings.business.website}` : ''}
                  ${businessSettings?.business?.taxId ? `<br>Tax ID: ${businessSettings.business.taxId}` : ''}
                </div>
                ${businessSettings?.pos?.receiptHeader ? `<div class="custom-header">${businessSettings.pos.receiptHeader}</div>` : ''}
              </div>
              
              <div class="receipt-title">SALE RECEIPT - ${receiptNumber}</div>
              
              <div class="receipt-info">
                <div class="info-row">
                  <span><strong>Receipt:</strong></span>
                  <span>${receiptNumber}</span>
                </div>
                <div class="info-row">
                  <span><strong>Date:</strong></span>
                  <span>${formattedDate}</span>
                </div>
                ${purchase.customerName ? `
                <div class="info-row">
                  <span><strong>Customer:</strong></span>
                  <span>${purchase.customerName}</span>
                </div>` : ''}
              </div>
              
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${validItems.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="totals">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>${formatCurrency(purchase.subtotal)}</span>
                </div>
                ${purchase.discount > 0 ? `
                <div class="total-row">
                  <span>Discount:</span>
                  <span>-${formatCurrency(purchase.discount)}</span>
                </div>` : ''}
                <div class="total-row final">
                  <span>TOTAL:</span>
                  <span>${formatCurrency(purchase.total)}</span>
                </div>
                <div class="total-row">
                  <span>Cash:</span>
                  <span>${formatCurrency(purchase.cashAmount)}</span>
                </div>
                <div class="total-row">
                  <span>Change:</span>
                  <span>${formatCurrency(purchase.change)}</span>
                </div>
              </div>
              
              <div class="receipt-footer">
                ${businessSettings?.pos?.receiptFooter ? businessSettings.pos.receiptFooter : 'Thank you for your business!'}
              </div>
              
              <div class="watermark">Customer Copy</div>
            </div>
            
            <!-- MERCHANT COPY -->
            <div class="receipt">
              <div class="copy-type">Merchant Copy</div>
              
              <div class="receipt-header">
                ${logoUrl ? `<img src="${logoUrl}" alt="${businessSettings?.business?.name || 'Business'} Logo" class="logo" onerror="handleImageError(this)">` : ''}
                <div class="business-name">${businessSettings?.business?.name || 'Your Business Name'}</div>
                <div class="business-details">
                  ${businessSettings?.business?.address || 'Business Address'}<br>
                  ${businessSettings?.business?.phone ? `Tel: ${businessSettings.business.phone}` : ''} 
                  ${businessSettings?.business?.email ? `<br>Email: ${businessSettings.business.email}` : ''}
                  ${businessSettings?.business?.website ? `<br>Web: ${businessSettings.business.website}` : ''}
                  ${businessSettings?.business?.taxId ? `<br>Tax ID: ${businessSettings.business.taxId}` : ''}
                </div>
                ${businessSettings?.pos?.receiptHeader ? `<div class="custom-header">${businessSettings.pos.receiptHeader}</div>` : ''}
              </div>
              
              <div class="receipt-title">SALE RECEIPT - ${receiptNumber}</div>
              
              <div class="receipt-info">
                <div class="info-row">
                  <span><strong>Receipt:</strong></span>
                  <span>${receiptNumber}</span>
                </div>
                <div class="info-row">
                  <span><strong>Date:</strong></span>
                  <span>${formattedDate}</span>
                </div>
                ${purchase.customerName ? `
                <div class="info-row">
                  <span><strong>Customer:</strong></span>
                  <span>${purchase.customerName}</span>
                </div>` : ''}
              </div>
              
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${validItems.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="totals">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>${formatCurrency(purchase.subtotal)}</span>
                </div>
                ${purchase.discount > 0 ? `
                <div class="total-row">
                  <span>Discount:</span>
                  <span>-${formatCurrency(purchase.discount)}</span>
                </div>` : ''}
                <div class="total-row final">
                  <span>TOTAL:</span>
                  <span>${formatCurrency(purchase.total)}</span>
                </div>
                <div class="total-row">
                  <span>Cash:</span>
                  <span>${formatCurrency(purchase.cashAmount)}</span>
                </div>
                <div class="total-row">
                  <span>Change:</span>
                  <span>${formatCurrency(purchase.change)}</span>
                </div>
              </div>
              
              <div class="receipt-footer">
                ${businessSettings?.pos?.receiptFooter ? businessSettings.pos.receiptFooter : 'Thank you for your business!'}
              </div>
              
              <div class="watermark">Merchant Copy</div>
            </div>
          </div>
        </body>
        </html>
      `)
      
      printWindow.document.close()
      
      toast({
        title: "Receipt prepared",
        description: "Receipt is ready to print."
      })
    } catch (error) {
      console.error("Error printing receipt:", error)
      toast({
        variant: "destructive", 
        title: "Print failed",
        description: "Failed to prepare receipt for printing. Please try again."
      })
    }
  }

  // Update handleExport function to avoid redeclaration of variables
  const handleExport = () => {
    if (!purchase) return

    try {
      // Create CSV content with detailed item information
      const csvHeaders = ["Receipt Number", "Item Name", "SKU", "Quantity", "Unit Price", "Total"]
      const csvRows = purchase.items.map(item => [
        purchase.receiptNumber || formatReceiptNumber(purchase._id),
        item.name,
        item.sku || 'N/A',
        item.quantity.toString(),
        item.price.toFixed(2),
        (item.price * item.quantity).toFixed(2)
      ])
      
      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map(row => row.join(","))
      ].join("\n")
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `sale_${purchase.receiptNumber || purchase._id}_${format(new Date(), "yyyy-MM-dd")}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Export successful",
        description: "Order details have been exported as CSV."
      })
    } catch (error) {
      console.error("Error exporting sale:", error)
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting the data. Please try again."
      })
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        
        <Skeleton className="h-[400px] mt-6" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Error Loading Sale Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No purchase found
  if (!purchase) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Sale Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The sale you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
            <Button 
              className="mt-4" 
              onClick={() => router.push('/purchases')}
            >
              Return to Sales
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate useful metrics
  const itemCount = purchase.items.length
  const totalQuantity = purchase.items.reduce((sum, item) => sum + item.quantity, 0)
  const highestValueItem = [...purchase.items].sort((a, b) => 
    (b.price * b.quantity) - (a.price * a.quantity)
  )[0]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.back()}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">Sale Details</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-xs px-2 py-1">Receipt {purchase.receiptNumber || formatReceiptNumber(purchase._id)}</Badge>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-500 dark:hover:bg-green-900/30">
              Completed
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button 
            size="sm" 
            className="gap-1"
            onClick={handlePrintReceipt}
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex justify-between w-full">
                  <span className="text-sm font-medium">Receipt:</span>
                  <span className="text-sm">{purchase.receiptNumber || formatReceiptNumber(purchase._id)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex justify-between w-full">
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm">{formatDate(purchase.date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex justify-between w-full">
                  <span className="text-sm font-medium">Customer:</span>
                  <span className="text-sm">{purchase.customerName || "Walk-in Customer"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <div className="flex justify-between w-full">
                  <span className="text-sm font-medium">Items:</span>
                  <span className="text-sm">{itemCount} (Qty: {totalQuantity})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div className="flex justify-between w-full">
                  <span className="text-sm font-medium">Subtotal:</span>
                  <span className="text-sm">Rs {purchase.subtotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div className="flex justify-between w-full">
                  <span className="text-sm font-medium">Discount:</span>
                  <span className="text-sm">Rs {purchase.discount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div className="flex justify-between w-full">
                  <span className="text-sm font-medium">Payment Status:</span>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-500 dark:hover:bg-green-900/30">
                    Paid
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div className="flex justify-between w-full">
                  <span className="text-sm font-medium">Highest Value Item:</span>
                  <span className="text-sm truncate max-w-[130px]" title={highestValueItem?.name}>
                    {highestValueItem?.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div className="flex justify-between w-full">
                  <span className="text-sm font-medium">Cash Amount:</span>
                  <span className="text-sm">Rs {purchase.cashAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div className="flex justify-between w-full">
                  <span className="text-sm font-medium">Change:</span>
                  <span className="text-sm">Rs {purchase.change.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Card */}
      <Card className="bg-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div className="flex flex-col">
                <span className="font-semibold">Order Total</span>
                <span className="text-xs text-muted-foreground">Receipt {purchase.receiptNumber || formatReceiptNumber(purchase._id)}</span>
              </div>
            </div>
            <div className="text-2xl font-bold">Rs {purchase.total.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Transaction Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Status</span>
              <span>Completed</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Receipt Section */}
      <div ref={receiptRef}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Order Items
            </CardTitle>
            <CardDescription>
              Complete list of items in this order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.sku || 'N/A'}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">Rs {item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">Rs {(item.price * item.quantity).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex flex-col items-end px-6 py-4 border-t">
            <div className="space-y-1 w-full max-w-[300px]">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>Rs {purchase.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Discount:</span>
                <span>Rs {purchase.discount.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>Rs {purchase.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground pt-2">
                <span>Cash Paid:</span>
                <span>Rs {purchase.cashAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Change:</span>
                <span>Rs {purchase.change.toFixed(2)}</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Action Buttons Bottom */}
      <div className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/purchases')}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sales
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-1" 
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export Items
          </Button>
          <Button 
            className="gap-1" 
            onClick={handlePrintReceipt}
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </div>
    </div>
  )
}

// Export the protected component
export const PurchaseDetailsPage = withAuthProtection(PurchaseDetailsPageContent) 