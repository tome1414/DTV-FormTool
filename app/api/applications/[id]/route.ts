import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, ApplicationStatus } from "@/lib/supabase";
import { getSessionUser, isAdmin, unauthorized, forbidden, canAccessApplication } from "@/lib/api-auth";

type Params = { params: { id: string } };

// GET /api/applications/[id]
export async function GET(_request: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();

  const { id } = params;
  if (!await canAccessApplication(sessionUser, id)) return forbidden();

  const [appResult, historyResult] = await Promise.all([
    supabaseAdmin.from("applications").select(`*, documents(*)`).eq("id", id).single(),
    supabaseAdmin.from("status_history").select("*").eq("application_id", id).order("timestamp", { ascending: true }),
  ]);

  if (appResult.error) {
    const status = appResult.error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: appResult.error.message }, { status });
  }

  return NextResponse.json(
    { data: { ...appResult.data, statusHistory: historyResult.data ?? [] } },
    { status: 200 }
  );
}

// PATCH /api/applications/[id] — 管理者のみ
export async function PATCH(request: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();
  if (!isAdmin(sessionUser)) return forbidden();

  const { id } = params;

  let body: {
    status?: ApplicationStatus;
    notes?: string;
    nationality?: string;
    consulateId?: string;
    changedBy?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { data: current, error: fetchError } = await supabaseAdmin
    .from("applications")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    const status = fetchError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: fetchError.message }, { status });
  }

  const updates: Record<string, unknown> = {};
  if (body.status      !== undefined) updates.status       = body.status;
  if (body.notes       !== undefined) updates.notes        = body.notes;
  if (body.nationality !== undefined) updates.nationality  = body.nationality;
  if (body.consulateId !== undefined) updates.consulate_id = body.consulateId;

  let updatedApp = current;
  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabaseAdmin
      .from("applications")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    updatedApp = data;
  }

  if (body.status && body.status !== current.status) {
    await supabaseAdmin.from("status_history").insert({
      application_id: id,
      status: body.status,
      changed_by: body.changedBy ?? null,
    });
  }

  return NextResponse.json({ data: updatedApp }, { status: 200 });
}

// DELETE /api/applications/[id] — 管理者のみ
export async function DELETE(_request: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();
  if (!isAdmin(sessionUser)) return forbidden();

  const { id } = params;

  const { data: docs } = await supabaseAdmin
    .from("documents")
    .select("storage_path")
    .eq("application_id", id)
    .not("storage_path", "is", null);

  if (docs && docs.length > 0) {
    await supabaseAdmin.storage.from("documents").remove(docs.map((d) => d.storage_path as string));
  }

  const { error } = await supabaseAdmin.from("applications").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true }, { status: 200 });
}
