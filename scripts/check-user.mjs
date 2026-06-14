import { createClient } from "@supabase/supabase-js";

// Load from environment variables
const supabaseUrl = process.env.SUPABASE_URL || "https://jcubspwmcsnvrurpbizm.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY env var is required");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = "hobby.chameleonclub@gmail.com";

const { data: { users } } = await supabase.auth.admin.listUsers();
const user = users.find(u => u.email === EMAIL);

if (!user) { console.log("ユーザーが見つかりません"); process.exit(1); }

console.log("=== Auth User ===");
console.log("ID:", user.id);
console.log("Email:", user.email);
console.log("Created:", user.created_at);
console.log("Last sign in:", user.last_sign_in_at ?? "なし");

const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();

console.log("\n=== Profile ===");
console.log(profile);

const { data: apps } = await supabase
  .from("applications")
  .select("id, application_number, status, submitted_at")
  .eq("user_id", user.id);

console.log("\n=== Applications ===");
console.log(apps?.length ? apps : "申請レコードなし");
