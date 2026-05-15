"use client";

import { useState, useRef, useEffect } from "react";
import { Eye, RefreshCw, CheckCircle2, MinusCircle, Upload } from "lucide-react";
import { useStore, ApplicationStatus, DocumentKey } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import AuthGuard from "@/components/AuthGuard";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  確認待ち: "bg-yellow-100 text-yellow-800 border-yellow-300",
  レビュー中: "bg-blue-100 text-blue-800 border-blue-300",
  書類不足: "bg-red-100 text-red-800 border-red-300",
  提出準備完了: "bg-green-100 text-green-800 border-green-300",
  大使館提出済み: "bg-purple-100 text-purple-800 border-purple-300",
  大使館修正依頼: "bg-orange-100 text-orange-800 border-orange-300",
  DTV承認: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const STATUS_I18N: Record<ApplicationStatus, string> = {
  確認待ち: "status.pending",
  レビュー中: "status.reviewing",
  書類不足: "status.insufficient",
  提出準備完了: "status.ready",
  大使館提出済み: "status.submitted",
  大使館修正依頼: "status.embassy_revision",
  DTV承認: "status.dtv_approved",
};

const STEP_INDEX: Record<ApplicationStatus, number> = {
  確認待ち: 1,
  レビュー中: 1,
  書類不足: 1,
  提出準備完了: 2,
  大使館提出済み: 3,
  大使館修正依頼: 3,
  DTV承認: 4,
};

const DOC_KEYS: Array<{ key: DocumentKey; required: boolean }> = [
  { key: "passport", required: true },
  { key: "bankStatement", required: true },
  { key: "photo", required: true },
  { key: "driverLicense", required: true },
];


function DocPreviewModal({
  docKey,
  storagePath,
  onClose,
}: {
  docKey: DocumentKey;
  storagePath?: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const label = t(`docs.${docKey}`);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    if (!storagePath) return;
    setLoading(true);
    fetch(`/api/files?path=${encodeURIComponent(storagePath)}`)
      .then((r) => r.json())
      .then(({ url }) => {
        setSignedUrl(url ?? null);
        const ext = storagePath.split(".").pop()?.toLowerCase() ?? "";
        setIsImage(["jpg", "jpeg", "png", "webp", "gif"].includes(ext));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [storagePath]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{t("common.preview")}</p>
            <h3 className="font-bold text-gray-800">{label}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-48">
              <span className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            </div>
          ) : signedUrl && isImage ? (
            <img
              src={signedUrl}
              alt={label}
              className="w-full max-h-96 object-contain rounded-xl border border-gray-200"
            />
          ) : signedUrl ? (
            <iframe
              src={signedUrl}
              className="w-full rounded-xl border border-gray-200"
              style={{ height: "480px" }}
              title={label}
            />
          ) : (
            <div className="flex items-center justify-center min-h-48 text-gray-400 text-sm">
              プレビューを読み込めませんでした
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

function MyPageContent() {
  const { myApplication, isLoading, updateDocument } = useStore();
  const { t } = useI18n();
  const [previewDoc, setPreviewDoc] = useState<DocumentKey | null>(null);
  const [uploading, setUploading] = useState<Partial<Record<DocumentKey, boolean>>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Partial<Record<DocumentKey, boolean>>>({});
  const fileRefs = useRef<Partial<Record<DocumentKey, HTMLInputElement | null>>>({});

  const handleUpload = async (key: DocumentKey, file: File) => {
    if (!myApplication) return;
    setUploading((p) => ({ ...p, [key]: true }));
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", myApplication.id);
      formData.append("documentKey", key);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (res.ok) {
        updateDocument(myApplication.id, key, true, json.path);
      } else {
        setUploadError(`アップロードエラー: ${json.error ?? res.status}`);
      }
    } catch (e) {
      setUploadError(`エラー: ${e instanceof Error ? e.message : "不明"}`);
    } finally {
      setUploading((p) => ({ ...p, [key]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  const applicant = myApplication;
  if (!applicant) return null;

  const stepIndex = STEP_INDEX[applicant.status];
  const steps = [
    t("mypage.steps.submit"),
    t("mypage.steps.review"),
    t("mypage.steps.ready"),
    t("mypage.steps.embassy"),
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">{t("mypage.title")}</h1>
      <p className="text-gray-500 text-sm mb-6">{t("mypage.subtitle")}</p>

      {/* Application Number & Status */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              {t("mypage.app_number")}
            </p>
            <p className="text-xl font-bold text-gray-800">
              {applicant.applicationNumber}
            </p>
          </div>
          <span
            className={`border rounded-full px-4 py-1.5 text-sm font-semibold ${STATUS_STYLES[applicant.status]}`}
          >
            {t(STATUS_I18N[applicant.status])}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {t("mypage.submitted_date")}: {applicant.submittedAt}
        </p>
      </div>

      {/* Warning for 書類不足 */}
      {applicant.status === "書類不足" && applicant.notes && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-5 flex gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-700 mb-1">
              {t("mypage.warning_title")}
            </p>
            <p className="text-sm text-red-600">{applicant.notes}</p>
          </div>
        </div>
      )}

      {/* Step Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-600 mb-4">
          {t("mypage.step_title")}
        </h2>
        <div className="flex items-center">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                    i <= stepIndex
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <span
                  className={`text-xs mt-1.5 whitespace-nowrap ${
                    i <= stepIndex ? "text-blue-700 font-medium" : "text-gray-400"
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 mb-4 ${
                    i < stepIndex ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-4">
          {t("mypage.doc_list_title")}
        </h2>
        {uploadError && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-red-500 text-sm">⚠️</span>
            <p className="text-xs text-red-600 flex-1">{uploadError}</p>
            <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
        <div className="space-y-2">
          {DOC_KEYS.map(({ key, required }) => {
            const uploaded = applicant.documents[key];
            const isUploading = uploading[key];
            const isDragOver = dragOver[key];
            return (
              <div
                key={key}
                className={`flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 rounded-lg px-1 transition-colors ${
                  isDragOver ? "bg-blue-50 border border-blue-300 border-dashed" : ""
                }`}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver((p) => ({ ...p, [key]: true }));
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOver((p) => ({ ...p, [key]: false }));
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver((p) => ({ ...p, [key]: false }));
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleUpload(key, file);
                }}
              >
                <div className="flex items-center gap-3">
                  {isUploading ? (
                    <span className="w-[18px] h-[18px] rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0" />
                  ) : uploaded ? (
                    <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <MinusCircle size={18} className="text-gray-300 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-700">{t(`docs.${key}`)}</span>
                  {required && (
                    <span className="text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded flex-shrink-0">
                      {t("common.required")}
                    </span>
                  )}
                  {isDragOver && (
                    <span className="text-xs text-blue-500 font-medium">ここにドロップ</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {uploaded ? (
                    <>
                      <button
                        onClick={() => setPreviewDoc(key)}
                        title={t("common.preview")}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        title={t("common.replace")}
                        onClick={() => fileRefs.current[key]?.click()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-blue-200 text-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => fileRefs.current[key]?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                    >
                      <Upload size={12} />
                      {t("common.upload")}
                    </button>
                  )}
                  <input
                    ref={(el) => { fileRefs.current[key] = el; }}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(key, file);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <DocPreviewModal
          docKey={previewDoc}
          storagePath={applicant.documentPaths?.[previewDoc]}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

export default function MyPage() {
  return (
    <AuthGuard requiredRole="applicant">
      <MyPageContent />
    </AuthGuard>
  );
}
