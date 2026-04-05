-- ============================================================================
-- Partners Table Migration
-- External people Dylan works with: CPA, bookkeeper, property managers, etc.
-- ============================================================================

-- Create partners table
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,  -- cpa, bookkeeper, property-manager, advisor, attorney, syndic
  company TEXT,
  email TEXT,
  phone TEXT,
  entities UUID[],  -- Array of entity IDs they're associated with
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',  -- active, former
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_partners_role ON partners(role);
CREATE INDEX idx_partners_status ON partners(status);

-- Auto-update updated_at trigger
CREATE TRIGGER partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- RLS Policies (single-user system - authenticated users have full access)
CREATE POLICY "Authenticated users can read partners"
  ON partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert partners"
  ON partners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update partners"
  ON partners FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete partners"
  ON partners FOR DELETE TO authenticated USING (true);
