"use client"

import { useEffect, useRef } from "react"

// Types
export type ReceiptItem = {
  id: string
  name: string
  quantity: number
  price: number
  sku?: string
}

export type ReceiptData = {
  id: string
  receiptNumber: string
  items: ReceiptItem[]
  subtotal: number
  discount: number
  total: number
  cashAmount: number
  change: number
  customerName: string
  date: string
}

export type ReceiptSettings = {
  business: {
    name: string
    address: string
    phone: string
    email: string
    website: string
    taxId: string
  }
  pos: {
    receiptHeader: string
    receiptFooter: string
    logo: string
  }
}

type ReceiptPrinterProps = {
  receiptData: ReceiptData
  settings: ReceiptSettings
  onPrintComplete?: () => void
}

export function ReceiptPrinter({ receiptData, settings, onPrintComplete }: ReceiptPrinterProps) {
  const printFrameRef = useRef<HTMLIFrameElement>(null)
  const hasPrintedRef = useRef(false)
  
  // Effect to trigger print when component mounts
  useEffect(() => {
    // Format a number to currency - moved inside useEffect
    const formatCurrency = (amount: number) => {
      return `Rs ${amount.toFixed(2)}`
    }
    
    const iframe = printFrameRef.current
    if (iframe && iframe.contentWindow) {
      // Generate receipt HTML content
      const generateReceiptHTML = () => {
        const { business, pos } = settings
        // Logo is already prepared by the parent component
        const logoUrl = `${process.env.NEXT_PUBLIC_API_Image_URL}${pos.logo || ''}`
        console.log(logoUrl)
        const formattedDate = new Date(receiptData.date).toLocaleString()
        const receiptNumber = receiptData.receiptNumber

        // Enhanced logging for debugging the receipt items
        console.log("Receipt items count:", receiptData.items.length)
        console.log("Receipt items details:", JSON.stringify(receiptData.items, null, 2))

        // Ensure items are properly processed
        if (!receiptData.items || !Array.isArray(receiptData.items)) {
          console.error("Receipt items is not an array:", receiptData.items)
          // Provide a fallback empty array to prevent errors
          receiptData.items = []
        }

        // Validate each item to ensure it has required properties
        const validItems = receiptData.items.map((item, index) => {
          if (!item || typeof item !== 'object') {
            console.error(`Invalid item at index ${index}:`, item)
            // Return a placeholder item to prevent rendering errors
            return {
              id: `error-${index}`,
              name: 'Error: Invalid Item',
              quantity: 1,
              price: 0
            }
          }
          return item
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

        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Sales Receipt ${receiptNumber}</title>
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
              
              .footer-branding {
                font-style: normal;
                font-size: 11px;
                color: #555;
              }
              
              .footer-branding .company {
                font-weight: bold;
                font-size: 12px;
              }
              
              .footer-branding .tagline {
                font-style: italic;
              }
              
              .footer-branding .contact {
                font-size: 11px;
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
            </script>
          </head>
          <body>
            <div class="page">
              <!-- CUSTOMER COPY -->
              <div class="receipt">
                <div class="copy-type">Customer Copy</div>
                
                <div class="receipt-header">
                  ${logoUrl ? `<img src="${logoUrl}" alt="${business.name} Logo" class="logo" onerror="handleImageError(this)">` : ''}
                  <div class="business-name">${business.name}</div>
                  <div class="business-details">
                    ${business.address}<br>
                    ${business.phone ? `Tel: ${business.phone}` : ''} 
                    ${business.email ? `<br>Email: ${business.email}` : ''}
                    ${business.website ? `<br>Web: ${business.website}` : ''}
                    ${business.taxId ? `<br>Tax ID: ${business.taxId}` : ''}
                  </div>
                  ${pos.receiptHeader ? `<div class="custom-header">${pos.receiptHeader}</div>` : ''}
                </div>
                
                <div class="receipt-title">SALES RECEIPT</div>
                
                <div class="receipt-info">
                  <div class="info-row">
                    <span><strong>Receipt:</strong></span>
                    <span>${receiptNumber}</span>
                  </div>
                  <div class="info-row">
                    <span><strong>Date:</strong></span>
                    <span>${formattedDate}</span>
                  </div>
                  ${receiptData.customerName ? `
                  <div class="info-row">
                    <span><strong>Customer:</strong></span>
                    <span>${receiptData.customerName}</span>
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
                    ${validItems.map((item) => `
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
                    <span>${formatCurrency(receiptData.subtotal)}</span>
                  </div>
                  ${receiptData.discount > 0 ? `
                  <div class="total-row">
                    <span>Discount:</span>
                    <span>-${formatCurrency(receiptData.discount)}</span>
                  </div>` : ''}
                  <div class="total-row final">
                    <span>TOTAL:</span>
                    <span>${formatCurrency(receiptData.total)}</span>
                  </div>
                  <div class="total-row">
                    <span>Cash:</span>
                    <span>${formatCurrency(receiptData.cashAmount)}</span>
                  </div>
                  <div class="total-row">
                    <span>Change:</span>
                    <span>${formatCurrency(receiptData.change)}</span>
                  </div>
                </div>
                
                <div class="receipt-footer">
                  ${pos.receiptFooter ? pos.receiptFooter : 'Thank you for your business!'}
                  <div class="footer-branding">
                    <div class="company">Brought to you by RTN GLOBAL</div>
                    <div class="tagline">Smart software. Simple solutions.</div>
                    <div class="contact">+92 310 7864419</div>
                  </div>
                </div>
                
                <div class="watermark">Customer Copy</div>
              </div>
              
              <!-- MERCHANT COPY -->
              <div class="receipt">
                <div class="copy-type">Merchant Copy</div>
                
                <div class="receipt-header">
                  ${logoUrl ? `<img src="${logoUrl}" alt="${business.name} Logo" class="logo" onerror="handleImageError(this)">` : ''}
                  <div class="business-name">${business.name}</div>
                  <div class="business-details">
                    ${business.address}<br>
                    ${business.phone ? `Tel: ${business.phone}` : ''} 
                    ${business.email ? `<br>Email: ${business.email}` : ''}
                    ${business.website ? `<br>Web: ${business.website}` : ''}
                    ${business.taxId ? `<br>Tax ID: ${business.taxId}` : ''}
                  </div>
                  ${pos.receiptHeader ? `<div class="custom-header">${pos.receiptHeader}</div>` : ''}
                </div>
                
                <div class="receipt-title">SALES RECEIPT</div>
                
                <div class="receipt-info">
                  <div class="info-row">
                    <span><strong>Receipt:</strong></span>
                    <span>${receiptNumber}</span>
                  </div>
                  <div class="info-row">
                    <span><strong>Date:</strong></span>
                    <span>${formattedDate}</span>
                  </div>
                  ${receiptData.customerName ? `
                  <div class="info-row">
                    <span><strong>Customer:</strong></span>
                    <span>${receiptData.customerName}</span>
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
                    ${validItems.map((item) => `
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
                    <span>${formatCurrency(receiptData.subtotal)}</span>
                  </div>
                  ${receiptData.discount > 0 ? `
                  <div class="total-row">
                    <span>Discount:</span>
                    <span>-${formatCurrency(receiptData.discount)}</span>
                  </div>` : ''}
                  <div class="total-row final">
                    <span>TOTAL:</span>
                    <span>${formatCurrency(receiptData.total)}</span>
                  </div>
                  <div class="total-row">
                    <span>Cash:</span>
                    <span>${formatCurrency(receiptData.cashAmount)}</span>
                  </div>
                  <div class="total-row">
                    <span>Change:</span>
                    <span>${formatCurrency(receiptData.change)}</span>
                  </div>
                </div>
                
                <div class="receipt-footer">
                  ${pos.receiptFooter ? pos.receiptFooter : 'Thank you for your business!'}
                  <div class="footer-branding">
                    <div class="company">Brought to you by RTN GLOBAL</div>
                    <div class="tagline">Smart software. Simple solutions.</div>
                    <div class="contact">+92 310 7864419</div>
                  </div>
                </div>
                
                <div class="watermark">Merchant Copy</div>
              </div>
            </div>
          </body>
          </html>
        `;
      }

      // Handle print action
      const printReceipt = () => {
        if (!printFrameRef.current || hasPrintedRef.current) return
        
        try {
          const frameWindow = printFrameRef.current.contentWindow
          if (!frameWindow) throw new Error("Could not access print frame window")
          
          // Set flag to prevent multiple prints
          hasPrintedRef.current = true
          
          frameWindow.focus()
          frameWindow.print()
          
          // Callback when print dialog is closed
          if (onPrintComplete) {
            // Small delay to ensure print dialog is fully closed
            setTimeout(() => {
              onPrintComplete()
            }, 500)
          }
        } catch (error) {
          console.error('Error printing receipt:', error)
          // Reset flag on error
          hasPrintedRef.current = false
        }
      }

      const iframeDoc = iframe.contentWindow.document
      iframeDoc.open()
      iframeDoc.write(generateReceiptHTML())
      iframeDoc.close()
      
      // Delay print to allow iframe and images to fully load
      setTimeout(printReceipt, 1500)
    }
  }, [receiptData, settings, onPrintComplete])

  return (
    <iframe
      ref={printFrameRef}
      style={{ 
        position: 'absolute',
        top: '-9999px',
        width: '0',
        height: '0',
        border: 'none'
      }}
      title="Receipt Printer Frame"
    />
  )
} 