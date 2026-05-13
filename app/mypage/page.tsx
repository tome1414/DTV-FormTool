"use client";

import { useStore, ApplicationStatus, DocumentKey } from "@/lib/store";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  確認待ち: "bg-yellow-100 text-yellow-800 border-yellow-300",
  レビュー中: "bg-blue-100 text-blue-800 border-blue-300",
  書類不足: "bg-red-100 text-red-800 border-red-300",
  提出準備完了: "bg-green-100 text-green-800 border-green-300",
  大使館提出済み: "bg-purple-100 text-purple-800 border-purple-300",
};

const STEPS = ["書類提出", "書類確認", "提出準備完了", "大使館提出"];

const STEP_INDEX: Record<ApplicationStatus, number> = {
  確認待ち: 1,
  レビュー中: 1,
  書類不足: 1,
  提出準備完了: 2,
  大使館提出済み: 3,
};

const DOC_LABELS: Record<DocumentKey, { label: string; required: boolean }> = {
  passport: { label: "パスポート写真ページ", required: true },
  bankStatement: { label: "残高証明書", required: true },
  photo: { label: "顔写真", required: true },
  driverLicense: { label: "運転免許証", required: false },
  flightTicket: { label: "フライトEチケット", required: false },
  pgaLicense: { label: "PGAライセンス", required: false },
  acceptanceLetter: { label: "受け入れレター", required: false },
};

export default function MyPage() {
  const { applicants, currentUserId } = useStore();
  const applicant = applicants.find((a) => a.id === currentUserId)!;
  const stepIndex = STEP_INDEX[applicant.status];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">マイページ</h1>
      <p className="text-gray-500 text-sm mb-6">申請状況をご確認いただけます</p>

      {/* Application Number & Status */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">申請番号</p>
            <p className="text-xl font-bold text-gray-800">{applicant.applicationNumber}</p>
          </div>
          <span className={`border rounded-full px-4 py-1.5 text-sm font-semibold ${STATUS_STYLES[applicant.status]}`}>
            {applicant.status}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">申請日: {applicant.submittedAt}</p>
      </div>

      {/* Warning for 書類不足 */}
      {applicant.status === "書類不足" && applicant.notes && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-5 flex gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-700 mb-1">書類に不備があります</p>
            <p className="text-sm text-red-600">{applicant.notes}</p>
          </div>
        </div>
      )}

      {/* Step Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-600 mb-4">申請ステップ</h2>
        <div className="flex items-center">
          {STEPS.map((step, i) => (
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
                <span className={`text-xs mt-1.5 whitespace-nowrap ${i <= stepIndex ? "text-blue-700 font-medium" : "text-gray-400"}`}>
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < stepIndex ? "bg-blue-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-4">書類一覧</h2>
        <div className="space-y-2">
          {(Object.entries(DOC_LABELS) as [DocumentKey, typeof DOC_LABELS[DocumentKey]][]).map(([key, { label, required }]) => {
            const uploaded = applicant.documents[key];
            return (
              <div key={key} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${uploaded ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                    {uploaded ? "✓" : "−"}
                  </span>
                  <span className="text-sm text-gray-700">{label}</span>
                  {required && (
                    <span className="text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded">必須</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${uploaded ? "text-green-600" : "text-gray-400"}`}>
                    {uploaded ? "提出済み" : "未提出"}
                  </span>
                  {uploaded && (
                    <button className="text-xs border border-blue-300 text-blue-500 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                      差し替え
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
