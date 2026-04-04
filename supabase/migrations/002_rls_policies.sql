-- ============================================================================
-- CFO Command Center - Row Level Security Policies
-- Migration 002: Enable RLS and create policies for all tables
--
-- This is a single-user system, so policies allow authenticated users
-- full CRUD access to all tables. RLS is enabled as a security best practice.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enable RLS on all tables
-- ----------------------------------------------------------------------------

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Entities policies
-- ----------------------------------------------------------------------------

CREATE POLICY "Authenticated users can read entities"
  ON entities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert entities"
  ON entities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update entities"
  ON entities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete entities"
  ON entities FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- Accounts policies
-- ----------------------------------------------------------------------------

CREATE POLICY "Authenticated users can read accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert accounts"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete accounts"
  ON accounts FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- Knowledge Base policies
-- ----------------------------------------------------------------------------

CREATE POLICY "Authenticated users can read knowledge_base"
  ON knowledge_base FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert knowledge_base"
  ON knowledge_base FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update knowledge_base"
  ON knowledge_base FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete knowledge_base"
  ON knowledge_base FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- Conversations policies
-- ----------------------------------------------------------------------------

CREATE POLICY "Authenticated users can read conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- Transactions policies
-- ----------------------------------------------------------------------------

CREATE POLICY "Authenticated users can read transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- Tax Strategies policies
-- ----------------------------------------------------------------------------

CREATE POLICY "Authenticated users can read tax_strategies"
  ON tax_strategies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tax_strategies"
  ON tax_strategies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tax_strategies"
  ON tax_strategies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tax_strategies"
  ON tax_strategies FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- Documents policies
-- ----------------------------------------------------------------------------

CREATE POLICY "Authenticated users can read documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- Proactive Queue policies
-- ----------------------------------------------------------------------------

CREATE POLICY "Authenticated users can read proactive_queue"
  ON proactive_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert proactive_queue"
  ON proactive_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update proactive_queue"
  ON proactive_queue FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete proactive_queue"
  ON proactive_queue FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- Tax Estimates policies
-- ----------------------------------------------------------------------------

CREATE POLICY "Authenticated users can read tax_estimates"
  ON tax_estimates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tax_estimates"
  ON tax_estimates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tax_estimates"
  ON tax_estimates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tax_estimates"
  ON tax_estimates FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- Notification Log policies
-- ----------------------------------------------------------------------------

CREATE POLICY "Authenticated users can read notification_log"
  ON notification_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notification_log"
  ON notification_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notification_log"
  ON notification_log FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete notification_log"
  ON notification_log FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- Document Patterns policies
-- ----------------------------------------------------------------------------

CREATE POLICY "Authenticated users can read document_patterns"
  ON document_patterns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert document_patterns"
  ON document_patterns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update document_patterns"
  ON document_patterns FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete document_patterns"
  ON document_patterns FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- Account Balances policies
-- ----------------------------------------------------------------------------

CREATE POLICY "Authenticated users can read account_balances"
  ON account_balances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert account_balances"
  ON account_balances FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update account_balances"
  ON account_balances FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete account_balances"
  ON account_balances FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- Service Role Bypass
-- The service role key bypasses RLS automatically, so admin operations
-- using SUPABASE_SERVICE_ROLE_KEY will work without additional policies.
-- ============================================================================

-- ============================================================================
-- END OF MIGRATION 002
-- ============================================================================
