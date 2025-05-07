export interface TaxSlab {
  minIncome: number;
  maxIncome?: number;
  fixedAmount: number;
  rate: number;
  description: string;
}

export interface TaxPeriod {
  startDate: Date;
  endDate: Date;
}

export interface TaxSettings {
  userId: string;
  businessType: 'Sole Proprietor' | 'Partnership' | 'Private Limited' | 'Public Limited' | 'Other';
  taxIdentificationNumber?: string;
  nationalTaxNumber?: string;
  
  // Sales tax settings
  salesTaxEnabled: boolean;
  salesTaxRate: number;
  salesTaxIncludedInPrice: boolean;
  
  // Income tax settings
  incomeTaxEnabled: boolean;
  useDefaultTaxSlabs: boolean;
  customTaxSlabs: TaxSlab[];
  
  // Zakat settings
  zakatEnabled: boolean;
  zakatCalculationType: 'Automatic' | 'Manual';
  zakatRate: number;
  zakatExemptCategories: string[];
  
  // Tax filing periods
  taxFilingPeriods: {
    incomeTax: 'Monthly' | 'Quarterly' | 'Annually';
    salesTax: 'Monthly' | 'Quarterly' | 'Annually';
    zakat: 'Annually' | 'Custom';
  };
  
  // Tax reminders
  enableTaxReminders: boolean;
  reminderDays: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxAttachment {
  name: string;
  path: string;
  uploadedAt: Date;
}

export interface TaxRecord {
  _id: string;
  taxId: string;
  userId: string;
  type: 'Income Tax' | 'Sales Tax' | 'Zakat' | 'Custom Tax' | 'Advance Tax';
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  description: string;
  paymentStatus: 'Paid' | 'Pending' | 'Partially Paid' | 'Exempt';
  paidAmount: number;
  paymentDate: Date | null;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Check' | 'Online' | 'Other';
  taxPeriod: TaxPeriod;
  reference: string;
  attachments: TaxAttachment[];
  isManualEntry: boolean;
  isFinalAssessment: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Frontend formatting properties
  periodStartFormatted?: string;
  periodEndFormatted?: string;
  paymentDateFormatted?: string;
  createdAtFormatted?: string;
}

export interface TaxSummary {
  summary: {
    period: string;
    totalTaxAmount: number;
    totalPaidAmount: number;
    pendingAmount: number;
    totalRecords: number;
    countByType: Record<string, number>;
    countByStatus: Record<string, number>;
    estimatedIncome: number;
    estimatedIncomeTax: number;
  };
  recentRecords: TaxRecord[];
}

export interface TaxCalculationResult {
  annualIncome: number;
  taxAmount: number;
  effectiveRate: number;
}

export interface ZakatCalculationResult {
  netAssets: number;
  zakatRate: number;
  zakatAmount: number;
} 