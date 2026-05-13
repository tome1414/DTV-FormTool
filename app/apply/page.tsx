"use client";

import { useState, useRef } from "react";

interface UploadedFile {
  file: File;
  preview: string | null;
}

interface DocConfig {
  key: string;
  label: string;
  required: boolean;
  note?: string;
  showGuide?: boolean;
}

const DOC_CONFIGS: DocConfig[] = [
  {
    key: "passport",
    label: "パスポート写真ページ",
    required: true,
    note: "スキャンの場合は余白をトリミングしてください。申請サイトで読み込みエラーの原因になります",
  },
  {
    key: "bankStatement",
    label: "残高証明書",
    required: true,
    note: "DTV要件：残高50万バーツ（約200万円）以上が必要です",
  },
  {
    key: "photo",
    label: "顔写真",
    required: true,
    note: "縦4.5cm × 横3.5cm、白背景、正面を向いた写真をご用意ください。帽子・サングラス不可。",
    showGuide: true,
  },
  {
    key: "driverLicense",
    label: "運転免許証",
    required: false,
  },
  {
    key: "flightTicket",
    label: "フライトEチケット",
    required: false,
  },
];

export default function ApplyPage() {
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({
    passport: true,
  });
  const [uploads, setUploads] = useState<Record<string, UploadedFile | null>>(
    {}
  );
  const [activeTab, setActiveTab] = useState<Record<string, "upload" | "preview">>({});
  const [submitted, setSubmitted] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const toggle = (key: string) => {
    setOpenKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFile = (key: string, file: File) => {
    const isImage = file.type.startsWith("image/");
    const preview = isImage ? URL.createObjectURL(file) : null;
    setUploads((prev) => ({ ...prev, [key]: { file, preview } }));
    setActiveTab((prev) => ({ ...prev, [key]: "preview" }));
  };

  const handleDrop = (key: string, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(key, file);
  };

  const handleRemove = (key: string) => {
    setUploads((prev) => ({ ...prev, [key]: null }));
    setActiveTab((prev) => ({ ...prev, [key]: "upload" }));
    if (fileRefs.current[key]) fileRefs.current[key]!.value = "";
  };

  const requiredKeys = DOC_CONFIGS.filter((d) => d.required).map((d) => d.key);
  const uploadedRequired = requiredKeys.filter((k) => uploads[k]);
  const progress = Math.round((uploadedRequired.length / requiredKeys.length) * 100);
  const canSubmit = uploadedRequired.length === requiredKeys.length;

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <div className="bg-green-50 border border-green-300 rounded-xl p-10">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">申請書類を送信しました</h2>
          <p className="text-gray-600">申請番号: DTV-2024-0009</p>
          <p className="text-gray-500 text-sm mt-2">書類の確認後、マイページでステータスをご確認いただけます。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">書類アップロード</h1>
      <p className="text-gray-500 text-sm mb-6">必須書類3種類をアップロードしてください</p>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">必須書類の進捗</span>
          <span className="font-semibold text-blue-700">{uploadedRequired.length} / {requiredKeys.length} 完了</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Accordion Cards */}
      <div className="space-y-3">
        {DOC_CONFIGS.map((doc) => {
          const isOpen = openKeys[doc.key];
          const uploaded = uploads[doc.key];
          const tab = activeTab[doc.key] || "upload";

          return (
            <div key={doc.key} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                onClick={() => toggle(doc.key)}
              >
                <div className="flex items-center gap-3">
                  {uploaded ? (
                    <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">✓</span>
                  ) : (
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${doc.required ? "border-red-400" : "border-gray-300"}`} />
                  )}
                  <span className="font-medium text-gray-800">{doc.label}</span>
                  {doc.required ? (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">必須</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">任意</span>
                  )}
                </div>
                <span className="text-gray-400 text-sm">{isOpen ? "▲" : "▼"}</span>
              </button>

              {/* Body */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  {/* Note */}
                  {doc.note && (
                    <div className="mt-3 mb-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-800">
                      ⚠️ {doc.note}
                    </div>
                  )}

                  {/* Tabs */}
                  {uploaded && (
                    <div className="flex gap-2 mt-3 mb-3">
                      <button
                        onClick={() => setActiveTab((p) => ({ ...p, [doc.key]: "upload" }))}
                        className={`text-sm px-3 py-1 rounded-md border transition-colors ${tab === "upload" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                      >
                        アップロード
                      </button>
                      <button
                        onClick={() => setActiveTab((p) => ({ ...p, [doc.key]: "preview" }))}
                        className={`text-sm px-3 py-1 rounded-md border transition-colors ${tab === "preview" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                      >
                        プレビュー
                      </button>
                    </div>
                  )}

                  {/* Upload Area */}
                  {(!uploaded || tab === "upload") && (
                    <div
                      className="mt-3 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(doc.key, e)}
                      onClick={() => fileRefs.current[doc.key]?.click()}
                    >
                      <div className="text-3xl mb-2">📎</div>
                      <p className="text-gray-600 text-sm">クリックまたはドラッグ&ドロップ</p>
                      <p className="text-gray-400 text-xs mt-1">PNG, JPG, PDF 対応</p>
                      <input
                        ref={(el) => { fileRefs.current[doc.key] = el; }}
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFile(doc.key, file);
                        }}
                      />
                    </div>
                  )}

                  {/* Preview Area */}
                  {uploaded && tab === "preview" && (
                    <div className="mt-3">
                      {uploaded.preview ? (
                        <div className="relative inline-block">
                          {doc.showGuide && (
                            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                              <div className="border-2 border-dashed border-blue-500 opacity-60"
                                style={{ width: "70px", height: "90px" }}
                              />
                            </div>
                          )}
                          <img
                            src={uploaded.preview}
                            alt="preview"
                            className="max-h-64 max-w-full rounded-lg border border-gray-200 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                          <span className="text-3xl">📄</span>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{uploaded.file.name}</p>
                            <p className="text-gray-400 text-xs">{(uploaded.file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => fileRefs.current[doc.key]?.click()}
                          className="text-sm px-3 py-1.5 border border-blue-400 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          差し替え
                        </button>
                        <button
                          onClick={() => handleRemove(doc.key)}
                          className="text-sm px-3 py-1.5 border border-red-300 text-red-500 rounded-md hover:bg-red-50 transition-colors"
                        >
                          削除
                        </button>
                        <input
                          ref={(el) => { fileRefs.current[doc.key] = el; }}
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(doc.key, file);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="mt-6">
        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${
            canSubmit
              ? "bg-blue-600 hover:bg-blue-700 shadow-md"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {canSubmit ? "書類を送信する" : `必須書類をすべてアップロードしてください（残り ${requiredKeys.length - uploadedRequired.length} 件）`}
        </button>
      </div>
    </div>
  );
}
