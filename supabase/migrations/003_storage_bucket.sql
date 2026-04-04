-- ============================================================================
-- CFO Command Center - Storage Bucket Setup
-- Migration 003: Create documents storage bucket with access policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Create the documents bucket (private)
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,  -- Private bucket
  52428800,  -- 50MB max file size
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'text/csv',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Storage policies for authenticated access
-- ----------------------------------------------------------------------------

-- Allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to read/download documents
CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

-- Allow authenticated users to update documents (replace)
CREATE POLICY "Authenticated users can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to delete documents
CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

-- ============================================================================
-- Storage Path Convention
--
-- Documents should be stored with the following path structure:
--   {entity_slug}/{year}/{doc_type}/{filename}
--
-- Examples:
--   mp/2026/bank-statement/chase-business-checking-march-2026.pdf
--   got/2025/pm-report/appfolio-owner-statement-q4-2025.pdf
--   personal/2025/tax-document/1099-schwab-2025.pdf
--
-- This allows for easy browsing and organization by entity and year.
-- ============================================================================

-- ============================================================================
-- END OF MIGRATION 003
-- ============================================================================
