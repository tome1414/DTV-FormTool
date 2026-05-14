"use client";

import { useState } from "react";
import { Eye, RefreshCw, CheckCircle2, MinusCircle, Trash2 } from "lucide-react";
import { useStore, ApplicationStatus, DocumentKey } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AuthGuard from "@/components/AuthGuard";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  確認待ち: "bg-yellow-100 text-yellow-800 border-yellow-300",
  レビュー中: "bg-blue-100 text-blue-800 border-blue-300",
  書類不足: "bg-red-100 text-red-800 border-red-300",
  提出準備完了: "bg-green-100 text-green-800 border-green-300",
  大使館提出済み: "bg-purple-100 text-purple-800 border-purple-300",
};

const STATUS_I18N: Record<ApplicationStatus, string> = {
  確認待ち: "status.pending",
  レビュー中: "status.reviewing",
  書類不足: "status.insufficient",
  提出準備完了: "status.ready",
  大使館提出済み: "status.submitted",
};

const STEP_INDEX: Record<ApplicationStatus, number> = {
  確認待ち: 1,
  レビュー中: 1,
  書類不足: 1,
  提出準備完了: 2,
  大使館提出済み: 3,
};

const DOC_KEYS: Array<{ key: DocumentKey; required: boolean }> = [
  { key: "passport", required: true },
  { key: "bankStatement", required: true },
  { key: "photo", required: true },
  { key: "driverLicense", required: false },
  { key: "flightTicket", required: false },
  { key: "pgaLicense", required: false },
  { key: "acceptanceLetter", required: false },
];

// Document types: image-based vs PDF-based
const DOC_TYPE: Record<DocumentKey, "image" | "pdf"> = {
  passport: "image",
  bankStatement: "pdf",
  photo: "image",
  driverLicense: "image",
  flightTicket: "pdf",
  pgaLicense: "pdf",
  acceptanceLetter: "pdf",
  invoice: "pdf",
};

function DocPreviewModal({
  docKey,
  onClose,
}: {
  docKey: DocumentKey;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const label = t(`docs.${docKey}`);
  const isImage = DOC_TYPE[docKey] === "image";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
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

        {/* Preview Area */}
        <div className="p-6">
          {isImage ? (
            // Image document mock preview
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center min-h-64">
              {docKey === "photo" ? (
                <>
                  <div className="w-28 h-36 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-center mb-4 relative">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-3xl">👤</span>
                    </div>
                    {/* Guide frame */}
                    <div className="absolute inset-2 border-2 border-dashed border-blue-400 rounded opacity-60" />
                  </div>
                  <p className="text-xs text-gray-400">4.5cm × 3.5cm</p>
                </>
              ) : docKey === "passport" ? (
                <>
                  <div className="w-full max-w-sm bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl p-5 text-white mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs opacity-60">PASSPORT</p>
                        <p className="text-sm font-mono mt-1">JPN</p>
                      </div>
                      <span className="text-2xl">🛂</span>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 mb-3">
                      <div className="flex gap-3 items-center">
                        <div className="w-12 h-14 bg-white/20 rounded flex items-center justify-center text-xl">
                          👤
                        </div>
                        <div>
                          <div className="h-2 bg-white/40 rounded w-20 mb-1.5" />
                          <div className="h-2 bg-white/30 rounded w-16 mb-1.5" />
                          <div className="h-2 bg-white/30 rounded w-12" />
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-xs opacity-60 tracking-wider">
                      P&lt;JPN&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-24 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center mb-4">
                    <span className="text-3xl">🪪</span>
                  </div>
                </>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {t("mypage.uploaded")}（モックプレビュー）
              </p>
            </div>
          ) : (
            // PDF document mock preview
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 min-h-64">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                {/* PDF header */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                  <div className="w-10 h-12 bg-red-50 border border-red-200 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-red-500">PDF</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{label}</p>
                    <p className="text-xs text-gray-400">document.pdf</p>
                  </div>
                </div>
                {/* Mock content lines */}
                <div className="space-y-2">
                  {[80, 65, 75, 50, 70, 45, 60].map((w, i) => (
                    <div
                      key={i}
                      className="h-2.5 bg-gray-100 rounded"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
                {/* Mock table */}
                <div className="mt-4 border border-gray-100 rounded overflow-hidden">
                  {[1, 2, 3].map((r) => (
                    <div
                      key={r}
                      className="flex border-b border-gray-100 last:border-0"
                    >
                      <div className="w-1/3 px-3 py-2 bg-gray-50 border-r border-gray-100">
                        <div className="h-2 bg-gray-200 rounded w-full" />
                      </div>
                      <div className="flex-1 px-3 py-2">
                        <div className="h-2 bg-gray-100 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                {t("mypage.uploaded")}（モックプレビュー）
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end gap-2">
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
  const { applicants } = useStore();
  const { user } = useAuth();
  const { t } = useI18n();
  const [previewDoc, setPreviewDoc] = useState<DocumentKey | null>(null);

  const applicant = applicants.find((a) => a.id === user?.userId);
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
        <div className="space-y-2">
          {DOC_KEYS.map(({ key, required }) => {
            const uploaded = applicant.documents[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  {uploaded ? (
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
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-blue-200 text-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">{t("mypage.not_submitted")}</span>
                  )}
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
