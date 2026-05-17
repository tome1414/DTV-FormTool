/**
 * モックアカウント3件を Supabase Auth に作成するスクリプト
 * 実行: node scripts/seed-mock-users.mjs
 */

const SUPABASE_URL = "https://jcubspwmcsnvrurpbizm.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MOCK_USERS = [
  {
    email: "applicant@example.com",
    password: "password123",
    metadata: {
      role: "applicant",
      last_name: "田中",
      first_name: "太郎",
      nationality: "日本",
      consulate_id: "jp-tokyo",
    },
  },
  {
    email: "admin@example.com",
    password: "admin123",
    metadata: {
      role: "admin",
      last_name: "一般",
      first_name: "管理者",
    },
  },
  {
    email: "owner@example.com",
    password: "owner123",
    metadata: {
      role: "superadmin",
      last_name: "オーナー",
      first_name: "",
    },
  },
];

async function createUser({ email, password, metadata }) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (data?.msg?.includes("already been registered") || data?.code === "email_exists") {
      console.log(`⚠  ${email} はすでに登録済みです（スキップ）`);
      return null;
    }
    console.error(`✗  ${email} の作成に失敗:`, JSON.stringify(data));
    return null;
  }

  console.log(`✓  ${email} (${metadata.role}) を作成しました`);
  return data;
}

console.log("=== DTV Formtool モックユーザー作成 ===\n");

for (const u of MOCK_USERS) {
  await createUser(u);
}

console.log("\n完了。Supabase Dashboard > Authentication > Users で確認してください。");
