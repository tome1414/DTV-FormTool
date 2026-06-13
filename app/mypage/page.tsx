"use client";

import { useState, useRef, useEffect } from "react";
import { Eye, RefreshCw, CheckCircle2, MinusCircle, Upload, Download } from "lucide-react";
import WelcomeModal from "@/components/WelcomeModal";
import { useStore, ApplicationStatus, DocumentKey } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import AuthGuard from "@/components/AuthGuard";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  レビュー中: "bg-blue-100 text-blue-800 border-blue-300",
  書類不足: "bg-red-100 text-red-800 border-red-300",
  提出準備完了: "bg-green-100 text-green-800 border-green-300",
  大使館提出済み: "bg-purple-100 text-purple-800 border-purple-300",
  大使館修正依頼: "bg-orange-100 text-orange-800 border-orange-300",
  DTV承認: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const STATUS_I18N: Record<ApplicationStatus, string> = {
  レビュー中: "status.reviewing",
  書類不足: "status.insufficient",
  提出準備完了: "status.ready",
  大使館提出済み: "status.submitted",
  大使館修正依頼: "status.embassy_revision",
  DTV承認: "status.dtv_approved",
};

const STEP_INDEX: Record<ApplicationStatus, number> = {
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

const DOC_NOTE_KEYS: Partial<Record<DocumentKey, string>> = {
  passport: "docs.passport_note",
  bankStatement: "docs.bankStatement_note",
  photo: "docs.photo_note",
  driverLicense: "docs.driverLicense_note",
};


function DropRow({
  onFileDrop,
  children,
  className,
}: {
  onFileDrop: (file: File) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const counter = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const onFileDropRef = useRef(onFileDrop);
  useEffect(() => { onFileDropRef.current = onFileDrop; });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      counter.current++;
      setIsDragOver(true);
    };
    const onDragOver = (e: DragEvent) => { e.preventDefault(); };
    const onDragLeave = () => {
      counter.current--;
      if (counter.current === 0) setIsDragOver(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      counter.current = 0;
      setIsDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) onFileDropRef.current(file);
    };

    el.addEventListener("dragenter", onDragEnter);
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragenter", onDragEnter);
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${className ?? ""} transition-colors ${
        isDragOver ? "bg-blue-50 outline outline-2 outline-blue-300 outline-dashed rounded-lg" : ""
      }`}
    >
      {isDragOver && (
        <span className="absolute text-xs text-blue-500 font-medium pointer-events-none" style={{ right: 8, top: "50%", transform: "translateY(-50%)" }}>
          {t("common.drop_here")}
        </span>
      )}
      {children}
    </div>
  );
}

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
              {t("common.preview_error")}
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
  const { myApplication, isLoading, updateDocument, refresh } = useStore();
  const { t } = useI18n();

  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    document.addEventListener("dragover", prevent);
    document.addEventListener("drop", prevent);
    return () => {
      document.removeEventListener("dragover", prevent);
      document.removeEventListener("drop", prevent);
    };
  }, []);
  const [previewDoc, setPreviewDoc] = useState<DocumentKey | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // 初回登録後のウェルカムモーダル（/applyに行けなかった場合のフォールバック）
  useEffect(() => {
    if (localStorage.getItem("dtv_show_welcome") === "1") {
      localStorage.removeItem("dtv_show_welcome");
      setShowWelcome(true);
    }
  }, []);
  const [uploading, setUploading] = useState<Partial<Record<DocumentKey, boolean>>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bundleDownloading, setBundleDownloading] = useState(false);
  const [bundleSizeLabel, setBundleSizeLabel] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  const handleDismissNote = async () => {
    if (!myApplication || dismissing) return;
    setDismissing(true);
    try {
      const res = await fetch(`/api/applications/${myApplication.id}/dismiss-notes`, {
        method: "POST",
      });
      if (res.ok) refresh();
    } finally {
      setDismissing(false);
    }
  };
  const fileRefs = useRef<Partial<Record<DocumentKey, HTMLInputElement | null>>>({});

  const handleBundleDownload = async () => {
    if (!myApplication || bundleDownloading) return;
    setBundleDownloading(true);
    try {
      const res = await fetch(`/api/applications/${myApplication.id}/bundle`);
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        alert(error ?? "Download failed");
        return;
      }
      const blob = await res.blob();
      setBundleSizeLabel(formatBytes(blob.size));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bundle_${myApplication.applicationNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed");
    } finally {
      setBundleDownloading(false);
    }
  };

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
        <div className="text-gray-400 text-sm">{t("common.loading")}</div>
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 mb-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              {t("mypage.app_number")}
            </p>
            <p className="text-xl font-bold text-gray-800">
              {applicant.applicationNumber}
            </p>
          </div>
          <span
            className={`border rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-semibold flex-shrink-0 ${STATUS_STYLES[applicant.status]}`}
          >
            {t(STATUS_I18N[applicant.status])}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {t("mypage.submitted_date")}: {applicant.submittedAt}
        </p>
      </div>

      {/* Admin notes (shown when admin has set a message to display on mypage) */}
      {applicant.notes && (() => {
        const raw = applicant.notes!;
        const sep = raw.indexOf("|||");
        const noteDate = sep > 0 ? raw.slice(0, sep) : null;
        const noteText = sep > 0 ? raw.slice(sep + 3) : raw;
        const isWarning = applicant.status === "書類不足" || applicant.status === "大使館修正依頼";
        return (
          <div className={`border rounded-xl p-4 mb-5 ${isWarning ? "bg-red-50 border-red-300" : "bg-amber-50 border-amber-300"}`}>
            <div className="flex gap-3">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className={`font-semibold ${isWarning ? "text-red-700" : "text-amber-700"}`}>
                      {t("mypage.warning_title")}
                    </p>
                    {noteDate && (
                      <p className={`text-xs mt-0.5 ${isWarning ? "text-red-400" : "text-amber-500"}`}>
                        {t("mypage.note_added_on")} {noteDate}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleDismissNote}
                    disabled={dismissing}
                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors disabled:opacity-50 ${
                      isWarning
                        ? "border-red-300 text-red-600 hover:bg-red-100"
                        : "border-amber-300 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {dismissing ? "..." : t("mypage.dismiss_note")}
                  </button>
                </div>
                <p className={`text-sm ${isWarning ? "text-red-600" : "text-amber-700"}`}>{noteText}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Step Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-600 mb-4">
          {t("mypage.step_title")}
        </h2>
        <div className="flex items-center">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                    i <= stepIndex
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <span
                  className={`text-[10px] sm:text-xs mt-1 sm:mt-1.5 text-center leading-tight ${
                    i <= stepIndex ? "text-blue-700 font-medium" : "text-gray-400"
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 mb-5 ${
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
            const noteKey = DOC_NOTE_KEYS[key];
            return (
              <DropRow
                key={key}
                className="relative py-3 border-b border-gray-100 last:border-0 px-1"
                onFileDrop={(file) => handleUpload(key, file)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {isUploading ? (
                      <span className="w-[18px] h-[18px] rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0 mt-0.5" />
                    ) : uploaded ? (
                      <CheckCircle2 size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <MinusCircle size={18} className="text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-700 font-medium">{t(`docs.${key}`)}</span>
                        {required && (
                          <span className="text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded flex-shrink-0">
                            {t("common.required")}
                          </span>
                        )}
                      </div>
                      {noteKey && !uploaded && (
                        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{t(noteKey)}</p>
                      )}
                    </div>
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
              </DropRow>
            );
          })}
        </div>
      </div>

      {/* Bundle Download */}
      {(() => {
        const BUNDLE_KEYS: DocumentKey[] = ["acceptanceLetter", "invoice", "existingPdfBundle"];
        const allReady = BUNDLE_KEYS.every((k) => applicant.documents[k]);
        if (!allReady) return null;
        return (
          <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-4 sm:p-5 mt-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-700">{t("mypage.bundle_title")}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t("mypage.bundle_desc")}</p>
              </div>
              <button
                onClick={handleBundleDownload}
                disabled={bundleDownloading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors w-full sm:w-auto flex-shrink-0"
              >
                {bundleDownloading
                  ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <Download size={15} />
                }
                {bundleDownloading
                  ? t("mypage.bundle_generating")
                  : bundleSizeLabel
                    ? `${t("mypage.bundle_download")} (${bundleSizeLabel})`
                    : t("mypage.bundle_download")
                }
              </button>
            </div>
          </div>
        );
      })()}

      {/* ウェルカムモーダル（初回登録時のフォールバック） */}
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

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
