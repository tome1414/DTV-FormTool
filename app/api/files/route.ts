import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, unauthorized, forbidden, canAccessApplication } from "@/lib/api-auth";

const BUCKET = "documents";
const SIGNED_URL_EXPIRES_IN = 60 * 60; // 1時間

// GET /api/files?path=<storage_path>
export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();

  const path = request.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path is required" }, { status: 400 });

  // pathの形式: {applicationId}/{documentKey}/{filename}
  const applicationId = path.split("/")[0];
  if (!await canAccessApplication(sessionUser, applicationId)) return forbidden();

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

  await supabaseAdmin
    .from("documents")
    .update({
      storage_path: null, file_name: null, mime_type: null,
      file_size: null, is_uploaded: false, is_approved: false, uploaded_at: null,
    })
    .eq("storage_path", path);

  return NextResponse.json({ success: true }, { status: 200 });
}
