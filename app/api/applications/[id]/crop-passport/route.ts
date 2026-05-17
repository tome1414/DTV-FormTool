import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, isAdmin, canAccessApplication, unauthorized, forbidden } from "@/lib/api-auth";

type Params = { params: { id: string } };

const BUCKET = "documents";

// POST /api/applications/[id]/crop-passport
// Body: { croppedDataUrl: string } — base64 data URL of the cropped image
export async function POST(request: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();
  if (!isAdmin(sessionUser)) return forbidden();
  if (!await canAccessApplication(sessionUser, params.id)) return forbidden();

  let body: { croppedDataUrl: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { croppedDataUrl } = body;
  if (!croppedDataUrl?.startsWith("data:image/")) {
    return NextResponse.json({ error: "croppedDataUrl must be a valid image data URL" }, { status: 400 });
  }

  // Decode base64
  const [header, base64] = croppedDataUrl.split(",");
  const mimeType = header.match(/data:(image\/[^;]+)/)?.[1] ?? "image/jpeg";
  const buffer = Buffer.from(base64, "base64");

  const ext = mimeType.includes("png") ? "png" : "jpg";
  const storagePath = `${params.id}/passport/cropped.${ext}`;

  // Upload (upsert) cropped image to storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Update documents record
  const { error: dbError } = await supabaseAdmin
    .from("documents")
    .update({
      storage_path: storagePath,
      file_name: `cropped.${ext}`,
      mime_type: mimeType,
      file_size: buffer.byteLength,
      is_uploaded: true,
      uploaded_at: new Date().toISOString(),
    })
    .eq("application_id", params.id)
    .eq("document_key", "passport");

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, storagePath }, { status: 200 });
}
