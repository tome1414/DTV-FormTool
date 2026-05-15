import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import JSZip from "jszip";

const BUCKET = "documents";

const DOC_LABEL: Record<string, string> = {
  passport:         "01_パスポート写真ページ",
  bankStatement:    "02_残高証明書",
  photo:            "03_顔写真",
  driverLicense:    "04_滞在証明書類",
  flightTicket:     "05_フライトeチケット",
  pgaLicense:       "06_PGAライセンス",
  acceptanceLetter: "07_受入れレター",
  invoice:          "08_インボイス",
  existingPdfBundle:"09_既存PDFバンドル",
};

export async function POST(request: NextRequest) {
  let body: { applicationId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { applicationId } = body;
  if (!applicationId) {
    return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
  }

  // DBからdocumentsレコードを取得
  const { data: docs, error: dbError } = await supabaseAdmin
    .from("documents")
    .select("document_key, storage_path, file_name")
    .eq("application_id", applicationId)
    .eq("is_uploaded", true)
    .not("storage_path", "is", null);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  if (!docs || docs.length === 0) {
    return NextResponse.json({ error: "アップロード済み書類がありません" }, { status: 404 });
  }

  // 申請番号を取得（ZIPファイル名に使用）
  const { data: appRow } = await supabaseAdmin
    .from("applications")
    .select("application_number")
    .eq("id", applicationId)
    .single();

  const appNumber = appRow?.application_number ?? applicationId;

  const zip = new JSZip();

  // 各ファイルをStorageからダウンロードしてZIPに追加
  const downloads = docs.map(async (doc) => {
    const path: string = doc.storage_path;
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(path);
    if (error || !data) {
      console.error(`[download] failed to fetch ${path}:`, error);
      return;
    }

    const ext = path.split(".").pop() ?? "bin";
    const label = DOC_LABEL[doc.document_key] ?? doc.document_key;
    const fileName = `${label}.${ext}`;

    const arrayBuffer = await data.arrayBuffer();
    zip.file(fileName, arrayBuffer);
  });

  await Promise.all(downloads);

  const zipArrayBuffer = await zip.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const blob = new Blob([zipArrayBuffer], { type: "application/zip" });

  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${appNumber}_documents.zip"`,
      "Content-Length": zipArrayBuffer.byteLength.toString(),
    },
  });
}
