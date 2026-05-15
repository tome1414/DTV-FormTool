import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DocumentKey } from "@/lib/supabase";

const BUCKET = "documents";
const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
];

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const applicationId = formData.get("applicationId") as string | null;
  const documentKey = formData.get("documentKey") as DocumentKey | null;

  if (!file || !applicationId || !documentKey) {
    return NextResponse.json(
      { error: "file, applicationId, documentKey are required" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}` },
      { status: 415 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File size exceeds 50MB limit" },
      { status: 413 }
    );
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${applicationId}/${documentKey}/${Date.now()}.${ext}`;

  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("[upload] storage error:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: dbError } = await supabaseAdmin
    .from("documents")
    .upsert(
      {
        application_id: applicationId,
        document_key: documentKey,
        storage_path: uploadData.path,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        is_uploaded: true,
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: "application_id,document_key" }
    );

  if (dbError) {
    console.error("[upload] db error:", dbError);
    // ストレージへのアップロードは成功しているのでパスは返す
    return NextResponse.json(
      { path: uploadData.path, warning: "DB record update failed" },
      { status: 207 }
    );
  }

  return NextResponse.json({ path: uploadData.path }, { status: 200 });
}
