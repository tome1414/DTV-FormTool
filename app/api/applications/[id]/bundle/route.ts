import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser, canAccessApplication, unauthorized, forbidden } from "@/lib/api-auth";

type Params = { params: { id: string } };

const BUCKET = "documents";

// 結合順: 残高証明 → 取引履歴(複数ページ) → 受入れレター → インボイス → 既存PDF一式
const SINGLE_BUNDLE_KEYS = ["bankStatement", "acceptanceLetter", "invoice", "existingPdfBundle"] as const;
const MULTI_BUNDLE_KEYS = ["bankStatementHistory"] as const;
const ALL_REQUIRED_KEYS = [...SINGLE_BUNDLE_KEYS, ...MULTI_BUNDLE_KEYS] as const;

async function fetchFileBytes(storagePath: string): Promise<Uint8Array | null> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(storagePath);
  if (error || !data) return null;
  const buf = await data.arrayBuffer();
  return new Uint8Array(buf);
}

function isImage(mimeType: string | null): boolean {
  return !!mimeType && (mimeType.startsWith("image/jpeg") || mimeType.startsWith("image/png"));
}

async function appendToPdf(merged: PDFDocument, bytes: Uint8Array, mimeType: string | null) {
  if (isImage(mimeType)) {
    const isJpeg = mimeType?.includes("jpeg") || mimeType?.includes("jpg");
    const img = isJpeg ? await merged.embedJpg(bytes) : await merged.embedPng(bytes);
    const page = merged.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  } else {
    try {
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const indices = src.getPageIndices();
      const copied = await merged.copyPages(src, indices);
      copied.forEach((p) => merged.addPage(p));
    } catch {
      console.error("[bundle] Failed to parse PDF, skipping page");
    }
  }
}

// GET /api/applications/[id]/bundle
export async function GET(_request: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();
  if (!await canAccessApplication(sessionUser, params.id)) return forbidden();

  const { data: docs, error: docsError } = await supabaseAdmin
    .from("documents")
    .select("document_key, storage_path, storage_paths, mime_type, is_uploaded")
    .eq("application_id", params.id)
    .in("document_key", ALL_REQUIRED_KEYS);

  if (docsError) {
    return NextResponse.json({ error: docsError.message }, { status: 500 });
  }

  const missing = ALL_REQUIRED_KEYS.filter(
    (k) => !docs?.find((d) => d.document_key === k && d.is_uploaded)
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing documents: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const merged = await PDFDocument.create();

  // 残高証明書
  const bankStatement = docs!.find((d) => d.document_key === "bankStatement")!;
  const bsBytes = await fetchFileBytes(bankStatement.storage_path!);
  if (bsBytes) await appendToPdf(merged, bsBytes, bankStatement.mime_type);

  // 取引履歴（複数ページ）
  const bankHistory = docs!.find((d) => d.document_key === "bankStatementHistory")!;
  const historyPaths: string[] = Array.isArray(bankHistory.storage_paths) && bankHistory.storage_paths.length > 0
    ? bankHistory.storage_paths
    : (bankHistory.storage_path ? [bankHistory.storage_path] : []);

  for (const path of historyPaths) {
    const bytes = await fetchFileBytes(path);
    if (bytes) await appendToPdf(merged, bytes, bankHistory.mime_type);
  }

  // 受入れレター・インボイス・既存PDF一式
  for (const key of ["acceptanceLetter", "invoice", "existingPdfBundle"] as const) {
    const doc = docs!.find((d) => d.document_key === key)!;
    const bytes = await fetchFileBytes(doc.storage_path!);
    if (bytes) await appendToPdf(merged, bytes, doc.mime_type);
  }

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
