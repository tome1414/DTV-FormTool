import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, unauthorized, forbidden, canAccessApplication } from "@/lib/api-auth";

const BUCKET = "documents";
const SIGNED_URL_EXPIRES_IN = 60 * 60; // 1時間

// GET /api/files?path=<storage_path>
// GET /api/files?path=<storage_path>&download=1  → proxy raw file bytes (used by canvas crop to avoid CORS)
export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();

  const path = request.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path is required" }, { status: 400 });

  // pathの形式: {applicationId}/{documentKey}/{filename}
  const applicationId = path.split("/")[0];
  if (!await canAccessApplication(sessionUser, applicationId)) return forbidden();

  // ?download=1: proxy the raw file bytes so the browser can use it
  // in a Canvas without cross-origin taint issues
  if (request.nextUrl.searchParams.get("download") === "1") {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(path);
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
    }
    const buf = await data.arrayBuffer();
    const mime = data.type || "application/octet-stream";
    return new NextResponse(Buffer.from(buf), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "no-store",
      },
    });
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_IN);

  if (error) {
    console.error("[files] signed url error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl }, { status: 200 });
}

// DELETE /api/files?path=<storage_path>
export async function DELETE(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();

  const path = request.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path is required" }, { status: 400 });

  const applicationId = path.split("/")[0];
  if (!await canAccessApplication(sessionUser, applicationId)) return forbidden();

  const { error: storageError } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  // path形式: {applicationId}/{documentKey}/{filename}
  const parts = path.split("/");
  const appId = parts[0] ?? "";
  const docKey = parts[1] ?? "";
  const MULTI_PAGE_KEYS = ["bankStatementHistory", "driverLicense"];

  if (MULTI_PAGE_KEYS.includes(docKey)) {
    // application_id + document_key で行を特定（storage_pathは最後のページで上書きされるため使えない）
    const { data: existing } = await supabaseAdmin
      .from("documents")
      .select("storage_paths")
      .eq("application_id", appId)
      .eq("document_key", docKey)
      .maybeSingle();

    const remaining: string[] = Array.isArray(existing?.storage_paths)
      ? (existing.storage_paths as string[]).filter((p: string) => p !== path)
      : [];

    await supabaseAdmin
      .from("documents")
      .update({
        storage_paths: remaining.length > 0 ? remaining : null,
        storage_path: remaining.length > 0 ? remaining[remaining.length - 1] : null,
        is_uploaded: remaining.length > 0,
        ...(remaining.length === 0 ? { file_name: null, mime_type: null, file_size: null, is_approved: false, uploaded_at: null } : {}),
      })
      .eq("application_id", appId)
      .eq("document_key", docKey);
  } else {
    await supabaseAdmin
      .from("documents")
      .update({
        storage_path: null, file_name: null, mime_type: null,
        file_size: null, is_uploaded: false, is_approved: false, uploaded_at: null,
      })
      .eq("storage_path", path);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
