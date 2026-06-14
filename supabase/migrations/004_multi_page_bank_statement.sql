-- ============================================================
-- Support multiple pages for bankStatementHistory
-- ============================================================

-- 1. Add new column for multiple files (JSONB array)
ALTER TABLE documents
ADD COLUMN storage_paths JSONB DEFAULT '[]'::jsonb;

-- 2. Update CHECK constraint to include bankStatementHistory
ALTER TABLE documents
DROP CONSTRAINT documents_document_key_check;

ALTER TABLE documents
ADD CONSTRAINT documents_document_key_check
CHECK (document_key IN (
  'passport', 'bankStatement', 'bankStatementHistory', 'photo', 'driverLicense',
  'flightTicket', 'pgaLicense', 'acceptanceLetter',
  'invoice', 'existingPdfBundle'
));

-- 3. Create index on storage_paths for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_storage_paths ON documents USING GIN (storage_paths);

-- 4. Note: Old single-file entries will continue using storage_path (NULL/empty string)
--    New bankStatementHistory entries will use storage_paths (JSONB array)
