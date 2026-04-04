-- ============================================================================
-- CFO Command Center - Initial Schema
-- Migration 001: Create all 12 tables, indexes, and triggers
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table 1: entities
-- Core business/property entities in the financial ecosystem
-- ----------------------------------------------------------------------------
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    's-corp', 'partnership', 'personal', 'foreign-property',
    'rental-property', 'primary-residence', 'vacant-land'
  )),
  tax_treatment TEXT NOT NULL,
  color TEXT NOT NULL,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE entities IS 'Business entities, properties, and personal accounts';
COMMENT ON COLUMN entities.slug IS 'URL-safe identifier (mp, got, saratoga, nice, chippewa, hvr, personal)';
COMMENT ON COLUMN entities.type IS 's-corp, partnership, personal, foreign-property, rental-property, primary-residence, vacant-land';
COMMENT ON COLUMN entities.tax_treatment IS 'How this entity is treated for tax purposes';
COMMENT ON COLUMN entities.color IS 'Hex color for UI display';

-- ----------------------------------------------------------------------------
-- Table 2: document_patterns (must come before documents due to FK)
-- Learned patterns for parsing similar documents
-- ----------------------------------------------------------------------------
CREATE TABLE document_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  doc_subtype TEXT NOT NULL,
  entity_id UUID REFERENCES entities(id),
  account_id UUID, -- Will add FK after accounts table created
  extraction_hints JSONB,
  sample_fields JSONB,
  parse_count INTEGER DEFAULT 0,
  last_parsed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE document_patterns IS 'Learned extraction patterns for document types from specific sources';
COMMENT ON COLUMN document_patterns.source IS 'Institution/source identifier (e.g., "chase", "schwab")';
COMMENT ON COLUMN document_patterns.extraction_hints IS 'JSON hints for field locations and data patterns';

-- ----------------------------------------------------------------------------
-- Table 3: accounts
-- Bank accounts, credit cards, brokerages, mortgages, etc.
-- ----------------------------------------------------------------------------
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'checking', 'savings', 'credit', 'brokerage',
    'retirement', 'mortgage', '529'
  )),
  institution TEXT NOT NULL,
  last4 TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE accounts IS 'Financial accounts linked to entities';
COMMENT ON COLUMN accounts.type IS 'checking, savings, credit, brokerage, retirement, mortgage, 529';
COMMENT ON COLUMN accounts.last4 IS 'Last 4 digits of account number for identification';

-- Now add the FK from document_patterns to accounts
ALTER TABLE document_patterns
  ADD CONSTRAINT fk_document_patterns_account
  FOREIGN KEY (account_id) REFERENCES accounts(id);

-- ----------------------------------------------------------------------------
-- Table 4: documents
-- Uploaded/parsed financial documents
-- ----------------------------------------------------------------------------
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id),
  account_id UUID REFERENCES accounts(id),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN (
    'bank-statement', 'brokerage-statement', 'retirement-statement',
    'tax-document', 'insurance', 'property-report', 'invoice',
    'receipt', '529-statement', 'option-grant', 'k1', 'w2',
    '1099', 'pm-report', 'other'
  )),
  doc_subtype TEXT,
  source TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN (
    'processing', 'parsed', 'confirmed', 'error'
  )),
  period_start DATE,
  period_end DATE,
  parsed_data JSONB,
  key_figures JSONB,
  ai_summary TEXT,
  tax_year INTEGER,
  pattern_id UUID REFERENCES document_patterns(id),
  user_corrections JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE documents IS 'Uploaded financial documents with AI-extracted data';
COMMENT ON COLUMN documents.doc_type IS 'Document category (bank-statement, k1, w2, etc.)';
COMMENT ON COLUMN documents.status IS 'processing, parsed, confirmed, error';
COMMENT ON COLUMN documents.key_figures IS 'Extracted numeric values (balances, totals, etc.)';
COMMENT ON COLUMN documents.ai_summary IS 'Claude-generated summary of document contents';

-- ----------------------------------------------------------------------------
-- Table 5: knowledge_base
-- The brain - all facts about the financial ecosystem
-- ----------------------------------------------------------------------------
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id),
  category TEXT NOT NULL CHECK (category IN (
    'tax', 'financial', 'personal', 'strategy',
    'cpa', 'legal', 'property'
  )),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT CHECK (source IN ('seed', 'chat', 'document', 'user')),
  confidence TEXT CHECK (confidence IN ('confirmed', 'inferred', 'stale')),
  supersedes_id UUID REFERENCES knowledge_base(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

COMMENT ON TABLE knowledge_base IS 'Persistent facts about the financial ecosystem';
COMMENT ON COLUMN knowledge_base.category IS 'Fact category: tax, financial, personal, strategy, cpa, legal, property';
COMMENT ON COLUMN knowledge_base.source IS 'Where fact originated: seed, chat, document, user';
COMMENT ON COLUMN knowledge_base.confidence IS 'confirmed, inferred, or stale';
COMMENT ON COLUMN knowledge_base.supersedes_id IS 'If this fact replaces an older fact, link to it';

-- ----------------------------------------------------------------------------
-- Table 6: conversations
-- Chat history with extracted facts
-- ----------------------------------------------------------------------------
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  extracted_facts UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE conversations IS 'Chat conversations with message history';
COMMENT ON COLUMN conversations.messages IS 'Array of {role, content, timestamp} message objects';
COMMENT ON COLUMN conversations.extracted_facts IS 'Array of knowledge_base IDs extracted from this conversation';

-- ----------------------------------------------------------------------------
-- Table 7: transactions
-- Individual financial transactions from statements
-- ----------------------------------------------------------------------------
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  tax_category TEXT,
  category_confirmed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  document_id UUID REFERENCES documents(id),
  duplicate_hash TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE transactions IS 'Individual financial transactions imported from statements';
COMMENT ON COLUMN transactions.amount IS 'Positive for credits/income, negative for debits/expenses';
COMMENT ON COLUMN transactions.duplicate_hash IS 'SHA256 hash for deduplication';
COMMENT ON COLUMN transactions.category_confirmed IS 'True if user has confirmed the category';

-- ----------------------------------------------------------------------------
-- Table 8: tax_strategies
-- Active and potential tax optimization strategies
-- ----------------------------------------------------------------------------
CREATE TABLE tax_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'active', 'at-risk', 'review', 'not-started', 'deprecated'
  )),
  impact TEXT NOT NULL CHECK (impact IN ('high', 'medium', 'low')),
  description TEXT NOT NULL,
  action_required TEXT,
  estimated_savings NUMERIC,
  cpa_flag BOOLEAN DEFAULT FALSE,
  tax_year INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tax_strategies IS 'Tax optimization strategies with status tracking';
COMMENT ON COLUMN tax_strategies.status IS 'active, at-risk, review, not-started, deprecated';
COMMENT ON COLUMN tax_strategies.impact IS 'Expected tax savings impact: high, medium, low';
COMMENT ON COLUMN tax_strategies.cpa_flag IS 'True if needs CPA review/input';

-- ----------------------------------------------------------------------------
-- Table 9: proactive_queue
-- Questions, alerts, recommendations, and deadlines
-- ----------------------------------------------------------------------------
CREATE TABLE proactive_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'question', 'alert', 'recommendation', 'deadline'
  )),
  priority TEXT NOT NULL CHECK (priority IN (
    'critical', 'high', 'medium', 'low', 'monitor'
  )),
  entity_id UUID REFERENCES entities(id),
  message TEXT NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'dismissed', 'resolved', 'snoozed'
  )),
  resolved_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE proactive_queue IS 'Proactive alerts, questions, and action items';
COMMENT ON COLUMN proactive_queue.type IS 'question, alert, recommendation, deadline';
COMMENT ON COLUMN proactive_queue.priority IS 'critical, high, medium, low, monitor';
COMMENT ON COLUMN proactive_queue.status IS 'open, dismissed, resolved, snoozed';

-- ----------------------------------------------------------------------------
-- Table 10: tax_estimates
-- Rolling tax liability projections
-- ----------------------------------------------------------------------------
CREATE TABLE tax_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_year INTEGER NOT NULL,
  as_of_date DATE NOT NULL,
  gross_income NUMERIC NOT NULL,
  total_deductions NUMERIC NOT NULL,
  taxable_income NUMERIC NOT NULL,
  estimated_tax NUMERIC NOT NULL,
  estimated_payments NUMERIC NOT NULL,
  withholding NUMERIC NOT NULL,
  projected_liability NUMERIC NOT NULL,
  breakdown JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tax_estimates IS 'Point-in-time tax liability projections';
COMMENT ON COLUMN tax_estimates.breakdown IS 'Detailed breakdown by entity, tax type, etc.';
COMMENT ON COLUMN tax_estimates.projected_liability IS 'Amount owed (or refund if negative) after payments/withholding';

-- ----------------------------------------------------------------------------
-- Table 11: notification_log
-- Track sent notifications
-- ----------------------------------------------------------------------------
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES proactive_queue(id),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in-app', 'push')),
  subject TEXT,
  body_preview TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ
);

COMMENT ON TABLE notification_log IS 'Log of sent notifications for tracking engagement';
COMMENT ON COLUMN notification_log.channel IS 'email, in-app, push';

-- ----------------------------------------------------------------------------
-- Table 12: account_balances
-- Historical balance snapshots
-- ----------------------------------------------------------------------------
CREATE TABLE account_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  as_of_date DATE NOT NULL,
  balance NUMERIC NOT NULL,
  balance_type TEXT NOT NULL CHECK (balance_type IN (
    'ending', 'beginning', 'current', 'available'
  )),
  document_id UUID REFERENCES documents(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE account_balances IS 'Historical balance snapshots from statements';
COMMENT ON COLUMN account_balances.balance_type IS 'ending, beginning, current, available';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Accounts
CREATE INDEX idx_accounts_entity ON accounts(entity_id);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_institution ON accounts(institution);

-- Knowledge Base
CREATE INDEX idx_knowledge_entity ON knowledge_base(entity_id);
CREATE INDEX idx_knowledge_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_key ON knowledge_base(key);
CREATE INDEX idx_knowledge_source ON knowledge_base(source);
CREATE INDEX idx_knowledge_confidence ON knowledge_base(confidence);

-- Transactions
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_tax_category ON transactions(tax_category);

-- Documents
CREATE INDEX idx_documents_entity ON documents(entity_id);
CREATE INDEX idx_documents_account ON documents(account_id);
CREATE INDEX idx_documents_type ON documents(doc_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_tax_year ON documents(tax_year);

-- Tax Strategies
CREATE INDEX idx_strategies_entity ON tax_strategies(entity_id);
CREATE INDEX idx_strategies_status ON tax_strategies(status);
CREATE INDEX idx_strategies_impact ON tax_strategies(impact);
CREATE INDEX idx_strategies_cpa_flag ON tax_strategies(cpa_flag) WHERE cpa_flag = TRUE;

-- Proactive Queue
CREATE INDEX idx_proactive_queue_status ON proactive_queue(status);
CREATE INDEX idx_proactive_queue_priority ON proactive_queue(priority);
CREATE INDEX idx_proactive_queue_entity ON proactive_queue(entity_id);
CREATE INDEX idx_proactive_queue_type ON proactive_queue(type);
CREATE INDEX idx_proactive_queue_due_date ON proactive_queue(due_date);
CREATE INDEX idx_proactive_queue_open ON proactive_queue(status, priority) WHERE status = 'open';

-- Tax Estimates
CREATE INDEX idx_tax_estimates_year ON tax_estimates(tax_year);
CREATE INDEX idx_tax_estimates_date ON tax_estimates(as_of_date);

-- Account Balances
CREATE INDEX idx_account_balances_account ON account_balances(account_id);
CREATE INDEX idx_account_balances_date ON account_balances(as_of_date);

-- Document Patterns
CREATE INDEX idx_document_patterns_source ON document_patterns(source);
CREATE INDEX idx_document_patterns_subtype ON document_patterns(doc_subtype);

-- Notification Log
CREATE INDEX idx_notification_log_alert ON notification_log(alert_id);
CREATE INDEX idx_notification_log_channel ON notification_log(channel);
CREATE INDEX idx_notification_log_sent ON notification_log(sent_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tax_strategies_updated_at
  BEFORE UPDATE ON tax_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- END OF MIGRATION 001
-- ============================================================================
