/**
 * 全書類アップロード済みの申請者をSupabaseに作成するスクリプト
 * 使い方: node scripts/seed-full-docs.mjs
 *
 * - ダミーの1px PNGを書類ごとにStorageへアップロード
 * - applicationsとdocumentsテーブルに書き込む
 * - DownloadセクションがOKになるテスト用申請者が作成される
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

// .env.local を手動パース
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 最小限のダミーPNGバイト列（1×1px 透明PNG）
const DUMMY_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489" +
  "0000000a49444154789c6260000000020001e221bc330000000049454e44ae426082",
  "hex"
);

const DOCUMENT_KEYS = [
  "passport", "bankStatement", "photo", "driverLicense",
  "flightTicket", "pgaLicense", "acceptanceLetter", "invoice", "existingPdfBundle",
];

async function run() {
  console.log("▶ Creating test applicant with all documents...");

  // 申請者作成
  const { data: app, error: appErr } = await supabase
    .from("applications")
    .insert({
      last_name: "テスト",
      first_name: "フルドック",
      email: "fulldoc-test@example.com",
      nationality: "日本",
      status: "提出準備完了",
    })
    .select()
    .single();

  if (appErr) {
    console.error("❌ Failed to create application:", appErr.message);
    process.exit(1);
  }

  console.log(`✓ Application created: ${app.application_number} (id: ${app.id})`);

  // ステータス履歴
  await supabase.from("status_history").insert({
    application_id: app.id,
    status: "提出準備完了",
  });

  // 各書類をStorageにアップロード → documentsテーブルに記録
  for (const key of DOCUMENT_KEYS) {
    const storagePath = `${app.id}/${key}/dummy.png`;

    const { error: upErr } = await supabase.storage
      .from("documents")
      .upload(storagePath, DUMMY_PNG, { contentType: "image/png", upsert: true });

    if (upErr) {
      console.warn(`  ⚠ Storage upload failed for ${key}: ${upErr.message}`);
    }

    const { error: docErr } = await supabase.from("documents").upsert(
      {
        application_id: app.id,
        document_key: key,
        storage_path: storagePath,
        file_name: "dummy.png",
        mime_type: "image/png",
        file_size: DUMMY_PNG.length,
        is_uploaded: true,
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: "application_id,document_key" }
    );

    if (docErr) {
      console.warn(`  ⚠ DB upsert failed for ${key}: ${docErr.message}`);
    } else {
      console.log(`  ✓ ${key}`);
    }
  }

  console.log("");
  console.log("✅ Done!");
  console.log(`   申請番号: ${app.application_number}`);
  console.log(`   名前: テスト フルドック`);
  console.log(`   管理者ページで確認 → ダウンロードボタンが青くなるはずです`);
}

run();
