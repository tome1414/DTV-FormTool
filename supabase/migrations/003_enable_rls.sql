-- ============================================================
-- Migration 003: Enable Row Level Security
-- ============================================================
-- service_role キーは RLS をバイパスするため管理者 API は引き続き全件アクセス可能。
-- authenticated ロール（ユーザー JWT）には自分のデータのみ許可。
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own" ON profiles
  FOR ALL TO authenticated
  USING  (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── applications ─────────────────────────────────────────────
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 申請者は自分の application のみ参照可
CREATE POLICY "applications_own_select" ON applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 申請者は自分の application のみ INSERT 可（user_id を自動設定）
CREATE POLICY "applications_own_insert" ON applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE / DELETE は service_role（管理者 API）のみ許可（ポリシーなし = deny）

-- ── documents ────────────────────────────────────────────────
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_own_select" ON documents
  FOR SELECT TO authenticated
  USING (
    application_id IN (
      SELECT id FROM applications WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "documents_own_update" ON documents
  FOR UPDATE TO authenticated
  USING (
    application_id IN (
      SELECT id FROM applications WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    application_id IN (
      SELECT id FROM applications WHERE user_id = auth.uid()
    )
  );

-- ── status_history ────────────────────────────────────────────
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "status_history_own_select" ON status_history
  FOR SELECT TO authenticated
  USING (
    application_id IN (
      SELECT id FROM applications WHERE user_id = auth.uid()
    )
  );
