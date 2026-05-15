import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ブラウザ・クライアントコンポーネントで使用（RLS適用）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// サーバーサイド専用（API Route / Server Component）: RLSをバイパス
// クライアントサイドでインポートしないこと
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

// ----------------------------------------------------------------
// 型定義（Supabaseテーブルに対応）
// ----------------------------------------------------------------
export type ApplicationStatus =
  | "確認待ち"
  | "レビュー中"
  | "書類不足"
  | "提出準備完了"
  | "大使館提出済み"
  | "大使館修正依頼"
  | "DTV承認";

export type DocumentKey =
  | "passport"
  | "bankStatement"
  | "photo"
  | "driverLicense"
  | "flightTicket"
  | "pgaLicense"
  | "acceptanceLetter"
  | "invoice"
  | "existingPdfBundle";

export interface DbApplication {
  id: string;
  application_number: string;
  user_id: string | null;
  status: ApplicationStatus;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  email: string;
  nationality: string | null;
  consulate_id: string | null;
  notes: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface DbDocument {
  id: string;
  application_id: string;
  document_key: DocumentKey;
  storage_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  is_uploaded: boolean;
  is_approved: boolean;
  warning: string | null;
  auto_warning: string | null;
  uploaded_at: string | null;
  updated_at: string;
}

export interface DbStatusHistory {
  id: string;
  application_id: string;
  status: ApplicationStatus;
  changed_by: string | null;
  timestamp: string;
}

export type Database = {
  public: {
    Tables: {
      applications: { Row: DbApplication; Insert: Partial<DbApplication>; Update: Partial<DbApplication> };
      documents: { Row: DbDocument; Insert: Partial<DbDocument>; Update: Partial<DbDocument> };
      status_history: { Row: DbStatusHistory; Insert: Partial<DbStatusHistory>; Update: Partial<DbStatusHistory> };
    };
  };
};
