import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { recordTaxPaymentToCashDrawer } from "@/services/taxService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { TaxRecord } from "@/types/tax";

// Define an error interface
interface APIError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

interface TaxPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  taxRecord: TaxRecord | null;
  onPaymentComplete: () => void;
}

const TaxPayment = ({ isOpen, onClose, taxRecord, onPaymentComplete }: TaxPaymentProps) => {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Calculate remaining amount
  const remainingAmount = taxRecord 
    ? taxRecord.taxAmount - taxRecord.paidAmount 
    : 0;
  
  const handlePayment = async () => {
    if (!taxRecord) return;
    
    if (!amount || Number(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }
    
    if (Number(amount) > remainingAmount) {
      toast({
        title: "Amount too high",
        description: `Payment amount cannot exceed the remaining balance of ${remainingAmount}`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      await recordTaxPaymentToCashDrawer({
        taxId: taxRecord._id,
        amount: Number(amount),
        paymentMethod,
        notes
      });
      
      toast({
        title: "Payment Successful",
        description: `Payment of Rs. ${Number(amount).toLocaleString()} has been recorded.`,
      });
      
      // Reset form and close dialog
      setAmount("");
      setPaymentMethod("Cash");
      setNotes("");
      onClose();
      
      // Refresh parent component
      onPaymentComplete();
    } catch (error: unknown) {
      console.error("Error processing tax payment:", error);
      
      // Handle specific errors
      const apiError = error as APIError;
      if (apiError.response?.data?.message) {
        toast({
          title: "Payment Failed",
          description: apiError.response.data.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Failed",
          description: "There was an error processing your payment. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Tax Payment</DialogTitle>
          <DialogDescription>
            {taxRecord ? `Record a payment for ${taxRecord.taxId} - ${taxRecord.type}` : "Loading..."}
          </DialogDescription>
        </DialogHeader>
        
        {taxRecord && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount:</p>
                <p className="font-medium">Rs. {taxRecord.taxAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining:</p>
                <p className="font-medium">Rs. {remainingAmount.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (Rs.)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                max={remainingAmount.toString()}
                placeholder="Enter payment amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional details about this payment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={loading || !taxRecord}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Process Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaxPayment; 