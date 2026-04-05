/**
 * CPA Packet Data Types
 *
 * Data structures for the CPA packet PDF generator.
 */

// ============================================================================
// Entity Data
// ============================================================================

export interface EntitySummary {
  id: string;
  slug: string;
  name: string;
  type: string;
  color: string;
  income: LineItem[];
  expenses: LineItem[];
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  documents: DocumentStatus[];
  notableItems: string[];
  strategyNotes: string[];
}

export interface LineItem {
  label: string;
  amount: number;
  taxFormRef?: string; // e.g., "(Schedule E Line 3)"
  notes?: string;
}

// ============================================================================
// Document Status
// ============================================================================

export type DocStatusType = 'received' | 'missing' | 'review';

export interface DocumentStatus {
  name: string;
  type: string;
  status: DocStatusType;
  receivedDate?: string;
  notes?: string;
}

export interface DocumentChecklistItem {
  entitySlug: string;
  entityName: string;
  docType: string;
  description: string;
  status: DocStatusType;
  notes?: string;
}

// ============================================================================
// Tax Strategy
// ============================================================================

export interface StrategyItem {
  name: string;
  entityName: string;
  status: string;
  impact: string;
  estimatedSavings?: number;
  description: string;
  cpaFlag: boolean;
  actionRequired?: string;
}

// ============================================================================
// Open Questions
// ============================================================================

export interface OpenQuestion {
  question: string;
  context?: string;
  entityName?: string;
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// Complete Packet Data
// ============================================================================

export interface CPAPacketData {
  // Metadata
  taxYear: number;
  generatedAt: string;
  preparedFor?: {
    name: string;
    company?: string;
  };
  preparedBy: string;

  // Executive summary (AI-generated)
  executiveSummary: string;

  // Entity breakdowns
  entities: EntitySummary[];

  // Document checklist
  documentChecklist: DocumentChecklistItem[];

  // Strategies
  strategies: StrategyItem[];

  // Open questions
  openQuestions: OpenQuestion[];

  // Summary stats
  stats: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    documentsReceived: number;
    documentsMissing: number;
    documentsReview: number;
    activeStrategies: number;
    totalEstimatedSavings: number;
  };
}

// ============================================================================
// Expected Documents by Entity Type
// ============================================================================

export const EXPECTED_DOCUMENTS: Record<string, string[]> = {
  's-corp': [
    '1099-NEC forms (all clients)',
    'Bank statements (12 months)',
    'Credit card statements',
    'Payroll summary (W-2, 941)',
    'Health insurance premiums',
    '401(k) contributions',
    'Business expense receipts',
    'Home office documentation',
  ],
  partnership: [
    'K-1 (Schedule K-1)',
    'Bank statements',
    'Property management reports',
    'Mortgage interest (Form 1098)',
    'Property tax statements',
    'Insurance declarations',
    'Repair/maintenance receipts',
  ],
  'rental-property': [
    'Rental income summary',
    'Bank statements',
    'Property management reports',
    'Mortgage interest (Form 1098)',
    'Property tax statements',
    'Insurance declarations',
    'Repair/maintenance receipts',
    'Tenant lease agreements',
  ],
  'foreign-property': [
    'Rental income summary (if any)',
    'Bank statements (foreign)',
    'Mortgage/loan statements',
    'Property tax statements',
    'Insurance declarations',
    'FBAR documentation',
    'FATCA forms',
    'Currency conversion records',
  ],
  'primary-residence': [
    'Mortgage interest (Form 1098)',
    'Property tax statements',
    'Insurance declarations',
    'Home improvement receipts (if any)',
  ],
  'vacant-land': [
    'Property tax statements',
    'Purchase documentation',
  ],
  personal: [
    'W-2 forms (all employers)',
    'Investment statements (1099-DIV, 1099-INT)',
    'Brokerage statements',
    'Retirement account statements',
    'Health insurance (Form 1095)',
    'Charitable donation receipts',
    'Student loan interest (Form 1098-E)',
    'Estimated tax payments',
  ],
};
