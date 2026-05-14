"use client";

import { useState, useRef } from "react";
import { Eye, RefreshCw, Upload, Trash2, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { useStore, Applicant, ApplicationStatus, DocumentKey } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import AuthGuard from "@/components/AuthGuard";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  確認待ち: "bg-yellow-100 text-yellow-800",
  レビュー中: "bg-blue-100 text-blue-800",
  書類不足: "bg-red-100 text-red-800",
  提出準備完了: "bg-green-100 text-green-800",
  大使館提出済み: "bg-purple-100 text-purple-800",
};

const STATUS_I18N: Record<ApplicationStatus, string> = {
  確認待ち: "status.pending",
  レビュー中: "status.reviewing",
  書類不足: "status.insufficient",
  提出準備完了: "status.ready",
  大使館提出済み: "status.submitted",
};

const ALL_STATUSES: ApplicationStatus[] = [
  "確認待ち",
  "レビュー中",
  "書類不足",
  "提出準備完了",
  "大使館提出済み",
];

const DOC_DOTS: { key: DocumentKey; i18nKey: string }[] = [
  { key: "passport", i18nKey: "docs.passport" },
  { key: "bankStatement", i18nKey: "docs.bankStatement" },
  { key: "photo", i18nKey: "docs.photo" },
  { key: "driverLicense", i18nKey: "docs.driverLicense" },
  { key: "pgaLicense", i18nKey: "docs.pgaLicense" },
  { key: "acceptanceLetter", i18nKey: "docs.acceptanceLetter" },
  { key: "invoice", i18nKey: "docs.invoice" },
  { key: "existingPdfBundle", i18nKey: "docs.existingPdfBundle" },
];

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50 animate-fade-in">
      <span className="text-green-400">✓</span>
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white">
        ✕
      </button>
    </div>
  );
}

// Documents the admin uploads on behalf of the applicant
const ADMIN_UPLOAD_DOCS: { key: DocumentKey; i18nKey: string }[] = [
  { key: "invoice", i18nKey: "docs.invoice" },
  { key: "acceptanceLetter", i18nKey: "docs.acceptanceLetter" },
  { key: "existingPdfBundle", i18nKey: "docs.existingPdfBundle" },
];

const USER_DOC_KEYS: DocumentKey[] = ["passport", "bankStatement", "photo"];
const ADMIN_DOC_KEYS: DocumentKey[] = ["invoice", "acceptanceLetter", "existingPdfBundle"];

interface AdminUploadedFile {
  name: string;
  size: number;
}

function DownloadSection({
  applicant,
  t,
}: {
  applicant: Applicant;
  t: (key: string, vars?: Record<string, string>) => string;
}) {
  const userReady = USER_DOC_KEYS.every((k) => applicant.documents[k]);
  const adminReady = ADMIN_DOC_KEYS.every((k) => applicant.documents[k]);
  const canDownload = userReady && adminReady;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      {/* Checklist */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className={userReady ? "text-green-500" : "text-red-400"}>
            {userReady ? "✓" : "✕"}
          </span>
          <span className={userReady ? "text-gray-600" : "text-red-500"}>
            {t("admin.download_pending_user")}
            {userReady && ` — OK`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={adminReady ? "text-green-500" : "text-red-400"}>
            {adminReady ? "✓" : "✕"}
          </span>
          <span className={adminReady ? "text-gray-600" : "text-red-500"}>
            {t("admin.download_pending_admin")}
            {adminReady && ` — OK`}
          </span>
        </div>
      </div>
      <button
        disabled={!canDownload}
        className={`w-full text-sm py-2 transition-colors font-medium ${
          canDownload
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        {canDownload ? t("admin.download_ready") : t("admin.download_pdf")}
      </button>
    </div>
  );
}

function DetailPanel({
  applicant,
  onClose,
}: {
  applicant: Applicant;
  onClose: () => void;
}) {
  const { updateStatus, updateDocument, updateDocumentWarning } = useStore();
  const { t } = useI18n();
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(applicant.status);
  const [toast, setToast] = useState<string | null>(null);
  const [adminFiles, setAdminFiles] = useState<Record<string, AdminUploadedFile | null>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [editingWarning, setEditingWarning] = useState<DocumentKey | null>(null);
  const [warningDraft, setWarningDraft] = useState("");

  const handleSave = () => {
    updateStatus(applicant.id, selectedStatus);
    setToast(t("admin.toast", { name: applicant.name, status: t(STATUS_I18N[selectedStatus]) }));
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdminFile = (key: DocumentKey, file: File) => {
    setAdminFiles((prev) => ({ ...prev, [key]: { name: file.name, size: file.size } }));
    updateDocument(applicant.id, key, true);
    setToast(t("admin.admin_upload_success"));
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdminRemove = (key: DocumentKey) => {
    setAdminFiles((prev) => ({ ...prev, [key]: null }));
    updateDocument(applicant.id, key, false);
    if (fileRefs.current[key]) fileRefs.current[key]!.value = "";
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h2 className="font-bold text-gray-800">{t("admin.detail_title")}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Applicant Info */}
        <div>
          <p className="text-xs text-gray-400 mb-1">{t("mypage.app_number")}</p>
          <p className="font-bold text-gray-800">{applicant.applicationNumber}</p>
          <p className="text-sm text-gray-600 mt-1">{applicant.name}</p>
          <p className="text-xs text-gray-400">{applicant.email}</p>
        </div>

        {/* Status Change */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t("admin.status_change")}
          </p>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ApplicationStatus)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{t(STATUS_I18N[s])}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition-colors font-medium"
          >
            {t("common.save")}
          </button>
        </div>

        {/* Document Status with numbered badges + warning */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t("mypage.doc_list_title")}
          </p>
          <div className="space-y-1">
            {DOC_DOTS.map(({ key, i18nKey }, idx) => {
              const uploaded = applicant.documents[key];
              const warning = applicant.documentWarnings?.[key];
              const isEditing = editingWarning === key;
              const badgeColor = !uploaded
                ? "bg-gray-100 text-gray-400"
                : warning
                ? "bg-yellow-400 text-white"
                : "bg-green-500 text-white";

              return (
                <div key={key}>
                  <div className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                    {/* Number badge */}
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${badgeColor}`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 flex-1">{t(i18nKey)}</span>
                    {/* △ warning toggle — only when uploaded */}
                    {uploaded && (
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setEditingWarning(null);
                          } else {
                            setEditingWarning(key);
                            setWarningDraft(warning ?? "");
                          }
                        }}
                        title={warning ? "警告メモを編集" : "警告メモを追加"}
                        className={`w-6 h-6 flex items-center justify-center rounded transition-colors flex-shrink-0 ${
                          warning
                            ? "text-yellow-500 hover:text-yellow-600"
                            : "text-gray-300 hover:text-yellow-400"
                        }`}
                      >
                        <AlertTriangle size={13} />
                      </button>
                    )}
                    {/* Remove warning */}
                    {warning && !isEditing && (
                      <button
                        onClick={() => updateDocumentWarning(applicant.id, key, null)}
                        title="警告を削除"
                        className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  {/* Warning display */}
                  {warning && !isEditing && (
                    <div className="ml-7 mb-1.5 flex items-start gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5">
                      <AlertTriangle size={11} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-700 leading-snug">{warning}</p>
                    </div>
                  )}
                  {/* Warning edit inline */}
                  {isEditing && (
                    <div className="ml-7 mb-1.5 space-y-1">
                      <textarea
                        className="w-full text-xs border border-yellow-300 rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:border-yellow-500 bg-yellow-50"
                        rows={2}
                        placeholder="警告・注意メモを入力..."
                        value={warningDraft}
                        onChange={(e) => setWarningDraft(e.target.value)}
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            updateDocumentWarning(applicant.id, key, warningDraft.trim() || null);
                            setEditingWarning(null);
                          }}
                          className="text-xs px-2.5 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded-md transition-colors"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingWarning(null)}
                          className="text-xs px-2.5 py-1 border border-gray-300 text-gray-500 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Admin Document Upload ── */}
        <div className="border border-blue-200 rounded-xl bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-600 text-base">📁</span>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              {t("admin.admin_upload_title")}
            </p>
          </div>
          <p className="text-xs text-blue-500 mb-4">{t("admin.admin_upload_desc")}</p>

          <div className="space-y-3">
            {ADMIN_UPLOAD_DOCS.map(({ key, i18nKey }) => {
              const uploaded = adminFiles[key] || (applicant.documents[key] ? { name: "既存ファイル", size: 0 } : null);
              return (
                <div key={key} className="bg-white rounded-lg border border-blue-100 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{t(i18nKey)}</span>
                    {uploaded ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {t("admin.admin_uploaded")}
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                        未アップロード
                      </span>
                    )}
                  </div>

                  {uploaded ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-lg px-2.5 py-1.5 min-w-0 border border-gray-100">
                        <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600 truncate">{uploaded.name}</span>
                        {uploaded.size > 0 && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {(uploaded.size / 1024).toFixed(0)}KB
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => fileRefs.current[key]?.click()}
                        title={t("admin.admin_replace_btn")}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-blue-200 text-blue-500 hover:bg-blue-50 transition-colors flex-shrink-0"
                      >
                        <RefreshCw size={13} />
                      </button>
                      <button
                        onClick={() => handleAdminRemove(key)}
                        title="削除"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-blue-200 rounded-lg p-3 flex items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => fileRefs.current[key]?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) handleAdminFile(key, file);
                      }}
                    >
                      <Upload size={14} className="text-blue-400" />
                      <p className="text-xs text-blue-500">クリックまたはドロップ</p>
                    </div>
                  )}

                  <input
                    ref={(el) => { fileRefs.current[key] = el; }}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAdminFile(key, file);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button className="w-full border border-orange-300 text-orange-600 text-sm py-2 rounded-lg hover:bg-orange-50 transition-colors">
            {t("admin.notify")}
          </button>
          <DownloadSection applicant={applicant} t={t} />
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function AdminContent() {
  const { applicants } = useStore();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = applicants.filter((a) => {
    const matchSearch =
      a.name.includes(search) ||
      a.applicationNumber.includes(search) ||
      a.email.includes(search);
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const selectedApplicant =
    applicants.find((a) => a.id === selectedId) || null;

  const counts = {
    total: applicants.length,
    waiting: applicants.filter((a) => a.status === "確認待ち").length,
    ready: applicants.filter((a) => a.status === "提出準備完了").length,
    insufficient: applicants.filter((a) => a.status === "書類不足").length,
  };

  return (
    <div className="flex gap-0 h-[calc(100vh-80px)]">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{t("admin.title")}</h1>
        <p className="text-gray-500 text-sm mb-6">{t("admin.subtitle")}</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            {
              label: t("admin.total"),
              value: counts.total,
              color: "border-blue-400 bg-blue-50",
              text: "text-blue-700",
            },
            {
              label: t("admin.waiting"),
              value: counts.waiting,
              color: "border-yellow-400 bg-yellow-50",
              text: "text-yellow-700",
            },
            {
              label: t("admin.ready"),
              value: counts.ready,
              color: "border-green-400 bg-green-50",
              text: "text-green-700",
            },
            {
              label: t("admin.insufficient"),
              value: counts.insufficient,
              color: "border-red-400 bg-red-50",
              text: "text-red-700",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-xl border-l-4 ${card.color} p-4 shadow-sm`}
            >
              <p className={`text-3xl font-bold ${card.text}`}>{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder={t("admin.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as ApplicationStatus | "all")
            }
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="all">{t("common.allStatus")}</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(STATUS_I18N[s])}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">
                  {t("admin.col_number")}
                </th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">
                  {t("admin.col_name")}
                </th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">
                  {t("admin.col_status")}
                </th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">
                  {t("admin.col_docs")}
                </th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">
                  {t("admin.col_date")}
                </th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">
                  {t("admin.col_updated")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${
                    selectedId === a.id ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    setSelectedId(selectedId === a.id ? null : a.id)
                  }
                >
                  <td className="px-5 py-3 font-mono text-gray-600">
                    {a.applicationNumber}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-800">{a.name}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[a.status]}`}
                    >
                      {t(STATUS_I18N[a.status])}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {DOC_DOTS.map((d, idx) => (
                        <span
                          key={d.key}
                          title={t(d.i18nKey)}
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold select-none ${
                            a.documents[d.key]
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {idx + 1}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{a.submittedAt}</td>
                  <td className="px-5 py-3 text-gray-400">{a.updatedAt}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-gray-400"
                  >
                    {t("admin.no_results")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedApplicant && (
        <DetailPanel
          applicant={selectedApplicant}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminContent />
    </AuthGuard>
  );
}
