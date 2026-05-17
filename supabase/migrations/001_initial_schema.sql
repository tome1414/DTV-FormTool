-- ============================================================
-- DTV Formtool - Initial Schema
-- ============================================================

-- ----------------------------------------------------------------
-- Application number sequence
-- ----------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS application_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TEXT LANGUAGE sql AS $$
  SELECT 'DTV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('application_number_seq')::text, 4, '0');
$$;

-- ----------------------------------------------------------------
-- applications
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT       UNIQUE NOT NULL DEFAULT generate_application_number(),
  user_id           UUID,                          -- FK to auth.users added in auth migration
  status            TEXT        NOT NULL DEFAULT '確認待ち'
                    CHECK (status IN (
                      '確認待ち', 'レビュー中', '書類不足',
                      '提出準備完了', '大使館提出済み', '大使館修正依頼', 'DTV承認'
                    )),
  last_name         TEXT        NOT NULL,
  first_name        TEXT        NOT NULL,
  middle_name       TEXT,
  email             TEXT        NOT NULL,
  nationality       TEXT,
  consulate_id      TEXT,
  notes             TEXT,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- documents
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   UUID        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_key     TEXT        NOT NULL
                   CHECK (document_key IN (
                     'passport', 'bankStatement', 'photo', 'driverLicense',
                     'flightTicket', 'pgaLicense', 'acceptanceLetter',
                     'invoice', 'existingPdfBundle'
                   )),
  storage_path     TEXT,
  file_name        TEXT,
  mime_type        TEXT,
  file_size        BIGINT,
  is_uploaded      BOOLEAN     NOT NULL DEFAULT FALSE,
  is_approved      BOOLEAN     NOT NULL DEFAULT FALSE,
  warning          TEXT,                            -- 管理者手動メモ
  auto_warning     TEXT,                            -- Canvas API 自動検出
  uploaded_at      TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, document_key)
);

-- ----------------------------------------------------------------
-- status_history
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_history (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   UUID        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status           TEXT        NOT NULL,
  changed_by       UUID,                            -- FK to auth.users added in auth migration
  timestamp        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_applications_user_id    ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status     ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_email      ON applications(email);
CREATE INDEX IF NOT EXISTS idx_documents_app_id        ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_status_history_app_id   ON status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_status_history_ts       ON status_history(timestamp DESC);

-- ----------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------
-- RLS (service_role bypasses RLS automatically in Supabase)
-- anon/authenticated policies will be added in the auth migration
-- ----------------------------------------------------------------
ALTER TABLE applications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- Storage bucket: documents (private)
-- ----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800,   -- 50 MB per file
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: storage.objects is managed by Supabase (RLS already enabled)
