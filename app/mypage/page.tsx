"use client";

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

function MyPageContent() {
  const { applicants } = useStore();
  const { user } = useAuth();
  const { t } = useI18n();

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
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      uploaded ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {uploaded ? "✓" : "−"}
                  </span>
                  <span className="text-sm text-gray-700">{t(`docs.${key}`)}</span>
                  {required && (
                    <span className="text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded">
                      {t("common.required")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${
                      uploaded ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {uploaded ? t("mypage.uploaded") : t("mypage.not_submitted")}
                  </span>
                  {uploaded && (
                    <button className="text-xs border border-blue-300 text-blue-500 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                      {t("common.replace")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
