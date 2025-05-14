"use client"

import { BulkUploadForm } from "@/components/inventory/bulk-upload-form"
import { MainLayout } from "@/components/layout/main-layout"
import { withAuthProtection } from "@/lib/protected-route"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

// Protected page for authenticated users only
export default withAuthProtection(function BulkUploadPage() {
  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                <Link href="/inventory">
                  <ArrowLeft size={18} />
                </Link>
              </Button>
              <h2 className="text-2xl font-semibold tracking-tight">Bulk Upload Inventory</h2>
            </div>
            <p className="text-muted-foreground">
              Upload multiple inventory items at once using a CSV file
            </p>
          </div>
        </div>
        
        <div className="py-6">
          <BulkUploadForm />
        </div>
        
        <div className="bg-muted/50 border rounded-lg p-6 mt-8">
          <h3 className="text-lg font-medium mb-4">Instructions for Bulk Upload</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">1. Download the template</h4>
              <p className="text-muted-foreground text-sm">
                Click the &nbsp;<span className="font-semibold">Download Template</span>&nbsp; button to get a CSV file with the correct column headers.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">2. Fill in your data</h4>
              <p className="text-muted-foreground text-sm">
                Open the CSV file in a spreadsheet program like Excel or Google Sheets and fill in your inventory data.
                Required fields are: name, sku, category, and price.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">3. Save as CSV</h4>
              <p className="text-muted-foreground text-sm">
                Save your file as a CSV (Comma Separated Values) file.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">4. Upload your file</h4>
              <p className="text-muted-foreground text-sm">
                Click the upload area to select your CSV file, then click &nbsp;<span className="font-semibold">Upload Inventory</span>&nbsp; to start the process.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">5. Review results</h4>
              <p className="text-muted-foreground text-sm">
                After the upload completes, you&quot;ll see a summary of the results, including any errors that occurred.
              </p>
            </div>
          </div>
          
          <div className="mt-6 bg-muted rounded-md p-4">
            <h4 className="font-medium mb-2">Field Descriptions</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">name*</span> - Product name (required)</p>
              <p><span className="font-semibold">sku*</span> - Unique Stock Keeping Unit (required)</p>
              <p><span className="font-semibold">category*</span> - Primary category (required)</p>
              <p><span className="font-semibold">subcategory</span> - Secondary category (optional)</p>
              <p><span className="font-semibold">subcategory2</span> - Tertiary category (optional)</p>
              <p><span className="font-semibold">brand</span> - Product brand (optional)</p>
              <p><span className="font-semibold">supplier</span> - Supplier ID (optional)</p>
              <p><span className="font-semibold">price*</span> - Selling price (required)</p>
              <p><span className="font-semibold">purchasePrice</span> - Purchase price (optional)</p>
              <p><span className="font-semibold">stock</span> - Current stock quantity (optional)</p>
              <p><span className="font-semibold">description</span> - Product description (optional)</p>
              <p><span className="font-semibold">reorderLevel</span> - Stock level for reorder alert (optional)</p>
              <p><span className="font-semibold">location</span> - Storage location (optional)</p>
              <p><span className="font-semibold">expiryDate</span> - Expiry date in YYYY-MM-DD format (optional)</p>
              <p><span className="font-semibold">unitOfMeasure</span> - Unit of measurement (optional)</p>
              <p><span className="font-semibold">measureValue</span> - Value of measurement (optional)</p>
              <p><span className="font-semibold">tags</span> - Comma-separated list of tags (optional)</p>
              <p><span className="font-semibold">taxRate</span> - Tax rate percentage (optional)</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}) 