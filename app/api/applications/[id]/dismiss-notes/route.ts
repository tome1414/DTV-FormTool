import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, unauthorized } from "@/lib/api-auth";

type Params = { params: { id: string } };

// POST /api/applications/[id]/dismiss-notes
// Allows the applicant who owns the application to clear admin notes
export async function POST(_request: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();

  // Verify the session user owns this application
  const { data: app, error: appError } = await supabaseAdmin
    .from("applications")
    .select("user_id")
    .eq("id", params.id)
    .single();

  if (appError || !app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (app.user_id !== sessionUser.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("applications")
    .update({ notes: null })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
