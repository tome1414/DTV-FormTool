import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, canAccessApplication, unauthorized, forbidden } from "@/lib/api-auth";

type Params = { params: { id: string } };

const BUCKET = "documents";
const BUNDLE_KEYS = ["acceptanceLetter", "invoice", "existingPdfBundle"] as const;

async function fetchFileBytes(storagePath: string): Promise<Uint8Array | null> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(storagePath);
  if (error || !data) return null;
  const buf = await data.arrayBuffer();
  return new Uint8Array(buf);
}

function isImage(mimeType: string | null): boolean {
  return !!mimeType && (mimeType.startsWith("image/jpeg") || mimeType.startsWith("image/png"));
}

// GET /api/applications/[id]/bundle
export async function GET(_request: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();
  if (!await canAccessApplication(sessionUser, params.id)) return forbidden();

  // Fetch document records for the 3 bundle keys
  const { data: docs, error: docsError } = await supabaseAdmin
    .from("documents")
    .select("document_key, storage_path, mime_type, is_uploaded")
    .eq("application_id", params.id)
    .in("document_key", BUNDLE_KEYS);

  if (docsError) {
    return NextResponse.json({ error: docsError.message }, { status: 500 });
  }

  const missing = BUNDLE_KEYS.filter(
    (k) => !docs?.find((d) => d.document_key === k && d.is_uploaded && d.storage_path)
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing documents: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // Merge into one PDF
  const merged = await PDFDocument.create();

  for (const key of BUNDLE_KEYS) {
    const doc = docs!.find((d) => d.document_key === key)!;
    const bytes = await fetchFileBytes(doc.storage_path!);
    if (!bytes) {
      return NextResponse.json({ error: `Failed to download ${key}` }, { status: 500 });
    }

    if (isImage(doc.mime_type)) {
      // Embed image as a full-page PDF page
      const isJpeg = doc.mime_type?.includes("jpeg") || doc.mime_type?.includes("jpg");
      const img = isJpeg ? await merged.embedJpg(bytes) : await merged.embedPng(bytes);
      const page = merged.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    } else {
      // Load as PDF and copy all pages
      try {
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const indices = src.getPageIndices();
        const copied = await merged.copyPages(src, indices);
        copied.forEach((p) => merged.addPage(p));
      } catch {
        // If PDF parsing fails, skip with a blank placeholder page
        console.error(`[bundle] Failed to parse PDF for ${key}`);
      }
    }
  }

  // Serialize with object streams compression
  const pdfBytes = await merged.save({ useObjectStreams: true });

  const { data: app } = await supabaseAdmin
    .from("applications")
    .select("application_number")
    .eq("id", params.id)
    .single();

  const filename = `bundle_${app?.application_number ?? params.id}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBytes.byteLength.toString(),
    },
  });
}
