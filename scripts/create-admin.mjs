// 管理者アカウント作成スクリプト
// 使い方: SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/create-admin.mjs <email>
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://jcubspwmcsnvrurpbizm.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.argv[2] || "hobby.chameleonclub@gmail.com";
const ROLE = "admin";

if (!SERVICE_ROLE_KEY) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY env var is required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`\n管理者アカウントを作成中: ${EMAIL}`);

  // 1. 招待メールを送信（本人がパスワードを設定する）
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(EMAIL);

  if (error) {
    // すでに登録済みの場合はユーザーを検索
    if (error.message.includes("already")) {
      console.log("⚠ すでに登録済みです。ロールのみ更新します...");
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users?.find((u) => u.email === EMAIL);
      if (existing) {
        await setRole(existing.id);
        return;
      }
    }
    console.error("❌ エラー:", error.message);
    process.exit(1);
  }

  console.log(`✓ 招待メールを送信しました → ${EMAIL}`);
  await setRole(data.user.id);
}

async function setRole(userId) {
  // 2. profiles テーブルにロールを設定
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, email: EMAIL, role: ROLE }, { onConflict: "id" });

  if (error) {
    console.error("❌ ロール設定エラー:", error.message);
    process.exit(1);
  }
  console.log(`✓ ロールを「${ROLE}」に設定しました`);
  console.log("\n✅ 完了！招待メールからパスワードを設定してもらってください。");
}

main();
