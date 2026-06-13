import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/ping?secret=<PING_SECRET>
// Supabase への軽いクエリで週次アクティビティを維持する
// GitHub Actions から毎週自動実行される
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!secret || secret !== process.env.PING_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();

  const { count, error } = await supabaseAdmin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[ping] Supabase error:", error.message);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const ms = Date.now() - start;

  console.log(`[ping] ok — profiles: ${count}, ${ms}ms`);
  return NextResponse.json({
    ok: true,
    profiles: count,
    ms,
    timestamp: new Date().toISOString(),
  });
}
