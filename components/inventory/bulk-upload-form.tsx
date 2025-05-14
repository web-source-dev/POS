"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inventoryService } from "@/lib/inventory-service";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, FileUp, X, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function BulkUploadForm() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    totalRows?: number;
    successCount?: number;
    errorCount?: number;
    errors?: Array<{ row: number; sku: string; error: string }>;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid file format",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleDownloadTemplate = () => {
    inventoryService.downloadTemplate();
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await inventoryService.bulkUpload(formData);
      
      setUploadResult({
        success: true,
        message: result.message,
        totalRows: result.totalRows,
        successCount: result.successCount,
        errorCount: result.errorCount,
        errors: result.errors
      });
      
      toast({
        title: "Upload Complete",
        description: `Successfully added ${result.successCount} out of ${result.totalRows} items`,
        variant: result.errorCount > 0 ? "default" : "default",
      });
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : "Upload failed"
      });
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Bulk Upload Inventory</CardTitle>
        <CardDescription>
          Upload multiple inventory items at once using a CSV file.
          Download the template below and fill it with your inventory data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Button 
              onClick={handleDownloadTemplate} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download size={18} />
              Download Template
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              Use this template to format your inventory data correctly
            </p>
          </div>

          <div className="border rounded-md p-6 bg-muted/30">
            {!file ? (
              <div className="flex flex-col items-center justify-center py-10">
                <FileUp size={48} className="text-muted-foreground mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-primary font-medium">Click to upload</span> 
                  <span className="text-muted-foreground"> or drag and drop</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-2">CSV (max. 10MB)</p>
                <Input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 bg-background rounded border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <FileUp size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium truncate max-w-[200px] sm:max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  disabled={uploading}
                >
                  <X size={18} />
                </Button>
              </div>
            )}
          </div>

          {uploadResult && (
            <Alert variant={uploadResult.success ? "default" : "destructive"}>
              <div className="flex items-start gap-3">
                {uploadResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <div>
                  <AlertTitle>
                    {uploadResult.success ? "Upload Successful" : "Upload Failed"}
                  </AlertTitle>
                  <AlertDescription>
                    {uploadResult.message}
                    {uploadResult.success && uploadResult.totalRows && (
                      <div className="mt-2">
                        <p>
                          Successfully added {uploadResult.successCount} out of {uploadResult.totalRows} items
                          {uploadResult.errorCount && uploadResult.errorCount > 0 
                            ? ` (${uploadResult.errorCount} errors)`
                            : ''
                          }
                        </p>
                        
                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                          <div className="mt-4">
                            <p className="font-medium mb-2">Error details:</p>
                            <div className="max-h-60 overflow-y-auto border rounded-md">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b bg-muted/50">
                                    <th className="px-3 py-2 text-left">Row</th>
                                    <th className="px-3 py-2 text-left">SKU</th>
                                    <th className="px-3 py-2 text-left">Error</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {uploadResult.errors.map((error, index) => (
                                    <tr key={index} className="border-b last:border-0">
                                      <td className="px-3 py-2">{error.row}</td>
                                      <td className="px-3 py-2">{error.sku}</td>
                                      <td className="px-3 py-2">{error.error}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-3">
        {uploading && (
          <div className="flex-1 pr-6">
            <Progress value={undefined} className="h-2" />
          </div>
        )}
        <Button 
          disabled={!file || uploading}
          onClick={handleUpload}
          className="flex items-center gap-2"
        >
          <FileUp size={18} />
          {uploading ? 'Uploading...' : 'Upload Inventory'}
        </Button>
      </CardFooter>
    </Card>
  );
} 