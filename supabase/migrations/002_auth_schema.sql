-- ============================================================
-- DTV Formtool - Auth Schema (profiles + RLS)
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ----------------------------------------------------------------
-- profiles (extends auth.users)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        UNIQUE NOT NULL,
  role         TEXT        NOT NULL DEFAULT 'applicant'
               CHECK (role IN ('applicant', 'admin', 'superadmin')),
  first_name   TEXT,
  last_name    TEXT,
  middle_name  TEXT,
  nationality  TEXT,
  consulate_id TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role  ON profiles(role);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------
-- Auto-create profile on Supabase Auth user creation
-- user_metadata に role / first_name / last_name 等を渡すことで設定可能
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name, middle_name, nationality, consulate_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'applicant'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'middle_name',
    NEW.raw_user_meta_data->>'nationality',
    NEW.raw_user_meta_data->>'consulate_id'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ----------------------------------------------------------------
-- applications: user_id FK を profiles に追加
-- ----------------------------------------------------------------
ALTER TABLE applications
  ADD CONSTRAINT fk_applications_user_id
  FOREIGN KEY (user_id) REFERENCES profiles(id)
  DEFERRABLE INITIALLY DEFERRED;

-- ----------------------------------------------------------------
-- RLS Policies
-- ※ service_role は RLS を自動バイパス（API Routes はすべて service_role 使用）
-- ※ middleware は authenticated ユーザーの session で profiles を参照するため SELECT policy が必要
-- ----------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールを読める
CREATE POLICY "read_own_profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- 自分のプロフィールを更新できる
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- applications: 自分の申請のみ読める（管理者は API Route で service_role 使用）
CREATE POLICY "read_own_applications" ON applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_applications" ON applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- documents: 自分の申請に紐づく書類のみ
CREATE POLICY "read_own_documents" ON documents
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

-- status_history: 自分の申請の履歴のみ
CREATE POLICY "read_own_status_history" ON status_history
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );
