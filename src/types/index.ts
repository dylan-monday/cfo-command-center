// CFO Command Center - TypeScript Types
// Based on database schema from Tech Spec v1.0 and Addenda

// ============================================================================
// Entity Types
// ============================================================================

export type EntityType =
  | 's-corp'
  | 'partnership'
  | 'personal'
  | 'foreign-property'
  | 'rental-property'
  | 'primary-residence'
  | 'vacant-land';

export type EntitySlug =
  | 'mp'
  | 'got'
  | 'saratoga'
  | 'nice'
  | 'chippewa'
  | 'hvr'
  | 'personal';

export interface Entity {
  id: string;
  slug: EntitySlug;
  name: string;
  type: EntityType;
  tax_treatment: string;
  color: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Account Types
// ============================================================================

export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit'
  | 'brokerage'
  | 'retirement'
  | 'mortgage'
  | '529';

export interface Account {
  id: string;
  entity_id: string;
  name: string;
  type: AccountType;
  institution: string;
  last4?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Knowledge Base Types
// ============================================================================

export type KnowledgeCategory =
  | 'tax'
  | 'financial'
  | 'personal'
  | 'strategy'
  | 'cpa'
  | 'legal'
  | 'property';

export type KnowledgeSource = 'seed' | 'chat' | 'document' | 'user';

export type KnowledgeConfidence = 'confirmed' | 'inferred' | 'stale';

export interface KnowledgeEntry {
  id: string;
  entity_id?: string;
  category: KnowledgeCategory;
  key: string;
  value: string;
  source?: KnowledgeSource;
  confidence?: KnowledgeConfidence;
  supersedes_id?: string;
  created_at: string;
  verified_at?: string;
}

// ============================================================================
// Conversation Types
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title?: string;
  messages: Message[];
  extracted_facts?: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Transaction Types
// ============================================================================

export interface Transaction {
  id: string;
  account_id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  tax_category?: string;
  category_confirmed: boolean;
  notes?: string;
  document_id?: string;
  duplicate_hash: string;
  created_at: string;
}

// ============================================================================
// Tax Strategy Types
// ============================================================================

export type StrategyStatus =
  | 'active'
  | 'at-risk'
  | 'review'
  | 'not-started'
  | 'deprecated';

export type StrategyImpact = 'high' | 'medium' | 'low';

export interface TaxStrategy {
  id: string;
  entity_id: string;
  name: string;
  status: StrategyStatus;
  impact: StrategyImpact;
  description: string;
  action_required?: string;
  estimated_savings?: number;
  cpa_flag: boolean;
  tax_year?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Document Types
// ============================================================================

export type DocumentType =
  | 'bank-statement'
  | 'brokerage-statement'
  | 'retirement-statement'
  | 'tax-document'
  | 'insurance'
  | 'property-report'
  | 'invoice'
  | 'receipt'
  | '529-statement'
  | 'option-grant'
  | 'k1'
  | 'w2'
  | '1099'
  | 'pm-report'
  | 'other';

export type DocumentStatus = 'processing' | 'parsed' | 'confirmed' | 'error';

export interface KeyFigures {
  beginning_balance?: number;
  ending_balance?: number;
  total_income?: number;
  total_expenses?: number;
  contributions?: number;
  withdrawals?: number;
  gains_losses?: number;
  fees?: number;
  net_operating_income?: number;
}

export interface Document {
  id: string;
  entity_id?: string;
  account_id?: string;
  filename: string;
  storage_path: string;
  doc_type: DocumentType;
  doc_subtype?: string;
  source?: string;
  status: DocumentStatus;
  period_start?: string;
  period_end?: string;
  parsed_data?: Record<string, unknown>;
  key_figures?: KeyFigures;
  ai_summary?: string;
  tax_year?: number;
  pattern_id?: string;
  user_corrections?: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// Proactive Queue Types
// ============================================================================

export type AlertType = 'question' | 'alert' | 'recommendation' | 'deadline';

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low' | 'monitor';

export type AlertStatus = 'open' | 'dismissed' | 'resolved' | 'snoozed';

export interface ProactiveQueueItem {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  entity_id?: string;
  message: string;
  due_date?: string;
  status: AlertStatus;
  resolved_note?: string;
  created_at: string;
}

// ============================================================================
// Tax Estimate Types
// ============================================================================

export interface TaxEstimateBreakdown {
  entity_breakdowns?: Record<string, {
    income: number;
    deductions: number;
    tax: number;
  }>;
  federal_tax?: number;
  state_tax?: number;
  self_employment_tax?: number;
  qbi_deduction?: number;
  child_tax_credit?: number;
}

export interface TaxEstimate {
  id: string;
  tax_year: number;
  as_of_date: string;
  gross_income: number;
  total_deductions: number;
  taxable_income: number;
  estimated_tax: number;
  estimated_payments: number;
  withholding: number;
  projected_liability: number;
  breakdown?: TaxEstimateBreakdown;
  notes?: string;
  created_at: string;
}

// ============================================================================
// Notification Log Types (Addendum #1)
// ============================================================================

export type NotificationChannel = 'email' | 'in-app' | 'push';

export interface NotificationLog {
  id: string;
  alert_id?: string;
  channel: NotificationChannel;
  subject?: string;
  body_preview?: string;
  sent_at: string;
  opened_at?: string;
  dismissed_at?: string;
}

// ============================================================================
// Document Patterns Types (Addendum #3)
// ============================================================================

export interface ExtractionHints {
  field_locations?: Record<string, string>;
  key_identifiers?: string[];
  data_patterns?: string[];
}

export interface DocumentPattern {
  id: string;
  source: string;
  doc_subtype: string;
  entity_id?: string;
  account_id?: string;
  extraction_hints?: ExtractionHints;
  sample_fields?: Record<string, unknown>;
  parse_count: number;
  last_parsed_at?: string;
  created_at: string;
}

// ============================================================================
// Account Balances Types (Addendum #3)
// ============================================================================

export type BalanceType = 'ending' | 'beginning' | 'current' | 'available';

export interface AccountBalance {
  id: string;
  account_id: string;
  as_of_date: string;
  balance: number;
  balance_type: BalanceType;
  document_id?: string;
  created_at: string;
}

// ============================================================================
// Partner Types
// ============================================================================

export type PartnerRole =
  | 'cpa'
  | 'bookkeeper'
  | 'property-manager'
  | 'advisor'
  | 'attorney'
  | 'syndic';

export type PartnerStatus = 'active' | 'former';

export interface Partner {
  id: string;
  name: string;
  role: PartnerRole;
  company?: string;
  email?: string;
  phone?: string;
  entities?: string[];  // Array of entity IDs
  notes?: string;
  status: PartnerStatus;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
}

export interface ParseRequest {
  file: File;
  entity_hint?: EntitySlug;
  account_hint?: string;
  context?: string;
}

export interface ParseResponse {
  summary: string;
  key_figures: KeyFigures;
  transactions_count: number;
  entity_match: EntitySlug | null;
  questions: string[];
  status: DocumentStatus;
}

// ============================================================================
// Context Builder Types
// ============================================================================

export interface SystemContext {
  entities: Entity[];
  accounts: Account[];
  knowledge: KnowledgeEntry[];
  strategies: TaxStrategy[];
  alerts: ProactiveQueueItem[];
  latestTaxEstimate?: TaxEstimate;
  conversationHistory?: Message[];
}

// ============================================================================
// Database Types (Supabase)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      entities: {
        Row: Entity;
        Insert: Omit<Entity, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Entity, 'id' | 'created_at' | 'updated_at'>>;
      };
      accounts: {
        Row: Account;
        Insert: Omit<Account, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at'>>;
      };
      knowledge_base: {
        Row: KnowledgeEntry;
        Insert: Omit<KnowledgeEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<KnowledgeEntry, 'id' | 'created_at'>>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Conversation, 'id' | 'created_at' | 'updated_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at'>;
        Update: Partial<Omit<Transaction, 'id' | 'created_at'>>;
      };
      tax_strategies: {
        Row: TaxStrategy;
        Insert: Omit<TaxStrategy, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TaxStrategy, 'id' | 'created_at' | 'updated_at'>>;
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, 'id' | 'created_at'>;
        Update: Partial<Omit<Document, 'id' | 'created_at'>>;
      };
      proactive_queue: {
        Row: ProactiveQueueItem;
        Insert: Omit<ProactiveQueueItem, 'id' | 'created_at'>;
        Update: Partial<Omit<ProactiveQueueItem, 'id' | 'created_at'>>;
      };
      tax_estimates: {
        Row: TaxEstimate;
        Insert: Omit<TaxEstimate, 'id' | 'created_at'>;
        Update: Partial<Omit<TaxEstimate, 'id' | 'created_at'>>;
      };
      notification_log: {
        Row: NotificationLog;
        Insert: Omit<NotificationLog, 'id'>;
        Update: Partial<Omit<NotificationLog, 'id'>>;
      };
      document_patterns: {
        Row: DocumentPattern;
        Insert: Omit<DocumentPattern, 'id' | 'created_at'>;
        Update: Partial<Omit<DocumentPattern, 'id' | 'created_at'>>;
      };
      account_balances: {
        Row: AccountBalance;
        Insert: Omit<AccountBalance, 'id' | 'created_at'>;
        Update: Partial<Omit<AccountBalance, 'id' | 'created_at'>>;
      };
      partners: {
        Row: Partner;
        Insert: Omit<Partner, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Partner, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
