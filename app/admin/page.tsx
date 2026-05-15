"use client";

import { useState, useRef, useEffect } from "react";
import { Eye, RefreshCw, Upload, Trash2, CheckCircle2, AlertTriangle, X, LayoutDashboard, Settings, Users } from "lucide-react";
import { useStore, Applicant, ApplicationStatus, DocumentKey } from "@/lib/store";
import { findConsulateById } from "@/lib/consulateData";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import AuthGuard from "@/components/AuthGuard";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  確認待ち: "bg-yellow-100 text-yellow-800",
  レビュー中: "bg-blue-100 text-blue-800",
  書類不足: "bg-red-100 text-red-800",
  提出準備完了: "bg-green-100 text-green-800",
  大使館提出済み: "bg-purple-100 text-purple-800",
  大使館修正依頼: "bg-orange-100 text-orange-800",
  DTV承認: "bg-emerald-100 text-emerald-800",
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

const ALL_STATUSES: ApplicationStatus[] = [
  "確認待ち",
  "レビュー中",
  "書類不足",
  "提出準備完了",
  "大使館提出済み",
  "大使館修正依頼",
  "DTV承認",
];

const DOC_DOTS: { key: DocumentKey; i18nKey: string }[] = [
  { key: "passport", i18nKey: "docs.passport" },
  { key: "bankStatement", i18nKey: "docs.bankStatement" },
  { key: "photo", i18nKey: "docs.photo" },
  { key: "driverLicense", i18nKey: "docs.driverLicense" },
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
  file: File;
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

// ── Chart helpers ─────────────────────────────────────────────────────────────

function DonutChart({ segments }: {
  segments: { label: string; value: number; hex: string; tw: string }[];
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="w-36 h-36 rounded-full bg-gray-100" />;
  let cum = 0;
  const parts = segments.filter(s => s.value > 0).map(s => {
    const start = (cum / total) * 360;
    cum += s.value;
    return `${s.hex} ${start.toFixed(1)}deg ${(cum / total * 360).toFixed(1)}deg`;
  });
  return (
    <div className="relative inline-flex items-center justify-center">
      <div className="w-36 h-36 rounded-full" style={{ background: `conic-gradient(${parts.join(",")})` }} />
      <div className="absolute w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
        <span className="text-2xl font-bold text-gray-800">{total}</span>
        <span className="text-xs text-gray-400">件</span>
      </div>
    </div>
  );
}

function HBar({ label, value, max, colorClass }: { label: string; value: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 6 : 0) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-28 shrink-0 text-right leading-tight">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
        <div className={`h-full rounded-full ${colorClass} flex items-center justify-end pr-2 transition-all duration-700`} style={{ width: `${pct}%` }}>
          {value > 0 && <span className="text-xs text-white font-semibold">{value}</span>}
        </div>
      </div>
    </div>
  );
}

function VBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-32 pt-4">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-500 font-medium">{d.value > 0 ? d.value : ""}</span>
          <div className="w-full flex items-end" style={{ height: "72px" }}>
            <div
              className="w-full bg-blue-500 rounded-t-md transition-all duration-700 hover:bg-blue-600"
              style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Dashboard view (superadmin only) ─────────────────────────────────────────

const STATUS_HEX: Record<ApplicationStatus, string> = {
  確認待ち: "#FBBF24",
  レビュー中: "#60A5FA",
  書類不足: "#F87171",
  提出準備完了: "#34D399",
  大使館提出済み: "#A78BFA",
  大使館修正依頼: "#FB923C",
  DTV承認: "#10B981",
};
const STATUS_TW: Record<ApplicationStatus, string> = {
  確認待ち: "bg-yellow-400",
  レビュー中: "bg-blue-400",
  書類不足: "bg-red-400",
  提出準備完了: "bg-green-400",
  大使館提出済み: "bg-purple-400",
  大使館修正依頼: "bg-orange-400",
  DTV承認: "bg-emerald-500",
};

function FunnelStep({
  label, value, total, colorHex, colorBg, arrow = true,
}: {
  label: string; value: number; total: number; colorHex: string; colorBg: string; arrow?: boolean;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 rounded-xl border-2 p-3 text-center ${colorBg}`} style={{ borderColor: colorHex }}>
        <p className="text-2xl font-bold" style={{ color: colorHex }}>{value}</p>
        <p className="text-xs text-gray-600 mt-0.5 leading-tight">{label}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{pct}%</p>
      </div>
      {arrow && <span className="text-gray-300 text-lg flex-shrink-0">→</span>}
    </div>
  );
}

function DashboardView() {
  const { applicants } = useStore();

  const total = applicants.length;
  const submittedCount = applicants.filter(a => ["大使館提出済み", "大使館修正依頼", "DTV承認"].includes(a.status)).length;
  const revisionCount = applicants.filter(a => a.status === "大使館修正依頼").length;
  const approvedCount = applicants.filter(a => a.status === "DTV承認").length;
  const approvalRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  const statusCounts = (Object.keys(STATUS_HEX) as ApplicationStatus[]).map(s => ({
    label: s, value: applicants.filter(a => a.status === s).length,
    hex: STATUS_HEX[s], tw: STATUS_TW[s],
  }));

  const nationalityMap: Record<string, number> = {};
  applicants.forEach(a => {
    if (a.nationality) nationalityMap[a.nationality] = (nationalityMap[a.nationality] || 0) + 1;
  });
  const natData = Object.entries(nationalityMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const natMax = Math.max(...natData.map(d => d[1]), 1);
  const natColors = ["bg-blue-500", "bg-blue-400", "bg-cyan-400", "bg-sky-400", "bg-indigo-400", "bg-teal-400"];

  const monthlyData = [
    { label: "10月", value: 3 },
    { label: "11月", value: 5 },
    { label: "12月", value: 2 },
    { label: "1月", value: 4 },
    { label: "2月", value: applicants.filter(a => a.submittedAt.startsWith("2024-02")).length + 6 },
    { label: "3月", value: applicants.filter(a => a.submittedAt.startsWith("2024-03")).length },
  ];

  const docKeys = ["passport", "bankStatement", "photo", "driverLicense"] as DocumentKey[];
  const docLabels: Record<string, string> = {
    passport: "パスポート", bankStatement: "残高証明書",
    photo: "顔写真", driverLicense: "滞在証明書類",
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">ダッシュボード</h1>
        <p className="text-gray-500 text-sm">申請状況の分析・統計</p>
      </div>

      {/* Approval funnel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700">申請〜承認フロー</p>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
            <span className="text-emerald-600 font-bold text-lg">{approvalRate}%</span>
            <span className="text-xs text-emerald-700">DTV承認率</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <FunnelStep label="総申請数" value={total} total={total} colorHex="#60A5FA" colorBg="bg-blue-50" />
          <FunnelStep label="大使館提出" value={submittedCount} total={total} colorHex="#A78BFA" colorBg="bg-purple-50" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-300 text-sm flex-shrink-0">┬→</span>
              <div className="flex-1 rounded-xl border-2 border-orange-300 bg-orange-50 p-2 text-center">
                <p className="text-lg font-bold text-orange-500">{revisionCount}</p>
                <p className="text-[10px] text-gray-600 leading-tight">大使館修正依頼</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300 text-sm flex-shrink-0">└→</span>
              <div className="flex-1 rounded-xl border-2 border-emerald-400 bg-emerald-50 p-2 text-center">
                <p className="text-lg font-bold text-emerald-600">{approvedCount}</p>
                <p className="text-[10px] text-gray-600 leading-tight">DTV承認済み</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          ※ 大使館修正依頼 → 修正対応 → DTV承認　または　大使館提出 → DTV承認（直接）の2フローあり
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Status donut */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">ステータス別内訳</p>
          <div className="flex items-center gap-4">
            <DonutChart segments={statusCounts} />
            <div className="space-y-1.5 flex-1">
              {statusCounts.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.hex }} />
                  <span className="text-xs text-gray-600 flex-1 leading-tight">{s.label}</span>
                  <span className="text-xs font-bold text-gray-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly trend */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-1">月別申請数（直近6ヶ月）</p>
          <VBarChart data={monthlyData} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Nationality distribution */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">国籍別申請数</p>
          {natData.length > 0 ? (
            <div className="space-y-2">
              {natData.map(([nat, count], i) => (
                <HBar key={nat} label={nat} value={count} max={natMax} colorClass={natColors[i]} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">国籍データなし</p>
          )}
        </div>

        {/* Document completion */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">書類提出率</p>
          <div className="space-y-3">
            {docKeys.map(key => {
              const submitted = applicants.filter(a => a.documents[key]).length;
              const pct = applicants.length > 0 ? Math.round((submitted / applicants.length) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{docLabels[key]}</span>
                    <span className="font-semibold text-gray-800">{submitted}/{applicants.length} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Settings view (superadmin only) ──────────────────────────────────────────

function SettingsView() {
  const roles = [
    {
      icon: "👑",
      label: "オーナー",
      desc: "全機能にアクセス可能",
      color: "border-yellow-300 bg-yellow-50",
      badge: "bg-yellow-100 text-yellow-800",
      accounts: [{ email: "owner@example.com", name: "オーナー" }],
      capabilities: ["申請管理・書類レビュー", "ダッシュボード・統計分析", "権限設定"],
    },
    {
      icon: "👤",
      label: "一般管理者",
      desc: "申請管理・書類レビューのみ",
      color: "border-gray-200 bg-white",
      badge: "bg-gray-100 text-gray-700",
      accounts: [{ email: "admin@example.com", name: "一般管理者" }],
      capabilities: ["申請管理・書類レビュー"],
    },
  ];

  return (
    <div className="space-y-6 pb-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">権限設定</h1>
        <p className="text-gray-500 text-sm">管理者アカウントと権限レベルの管理</p>
      </div>

      <div className="space-y-4">
        {roles.map(role => (
          <div key={role.label} className={`rounded-xl border-2 ${role.color} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{role.icon}</span>
                <div>
                  <p className="font-semibold text-gray-800">{role.label}</p>
                  <p className="text-xs text-gray-500">{role.desc}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${role.badge}`}>
                {role.accounts.length}アカウント
              </span>
            </div>
            <div className="space-y-2 mb-3">
              {role.accounts.map(acc => (
                <div key={acc.email} className="flex items-center gap-3 bg-white/60 rounded-lg px-3 py-2 border border-white">
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {acc.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{acc.name}</p>
                    <p className="text-xs text-gray-400">{acc.email}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {role.capabilities.map(cap => (
                <span key={cap} className="text-xs bg-white/80 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  ✓ {cap}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button disabled className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 text-gray-400 rounded-xl text-sm cursor-not-allowed hover:border-blue-300 hover:text-blue-400 transition-colors">
        <Users size={15} />
        管理者を招待（実装予定）
      </button>
    </div>
  );
}

function PreviewModal({
  label,
  adminFile,
  storagePath,
  uploadedAt,
  onClose,
}: {
  label: string;
  adminFile: AdminUploadedFile | null;
  storagePath?: string;
  uploadedAt: string;
  onClose: () => void;
}) {
  const [objUrl, setObjUrl] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [isMimeImage, setIsMimeImage] = useState(false);

  // Local file from admin upload
  useEffect(() => {
    if (adminFile?.file) {
      const url = URL.createObjectURL(adminFile.file);
      setObjUrl(url);
      setIsMimeImage(adminFile.file.type.startsWith("image/"));
      return () => URL.revokeObjectURL(url);
    }
    setObjUrl(null);
  }, [adminFile]);

  // Signed URL for applicant-uploaded files
  useEffect(() => {
    if (!adminFile && storagePath) {
      setLoadingUrl(true);
      fetch(`/api/files?path=${encodeURIComponent(storagePath)}`)
        .then((r) => r.json())
        .then(({ url }) => {
          setSignedUrl(url ?? null);
          // Detect mime type from path extension
          const ext = storagePath.split(".").pop()?.toLowerCase();
          setIsMimeImage(["jpg", "jpeg", "png", "webp", "gif"].includes(ext ?? ""));
        })
        .catch(console.error)
        .finally(() => setLoadingUrl(false));
    } else {
      setSignedUrl(null);
    }
  }, [adminFile, storagePath]);

  const displayUrl = objUrl ?? signedUrl;
  const isImage = isMimeImage;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 text-sm">{label}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {loadingUrl ? (
            <div className="h-52 flex items-center justify-center">
              <span className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            </div>
          ) : displayUrl && isImage ? (
            <img
              src={displayUrl}
              alt={label}
              className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
            />
          ) : displayUrl ? (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 flex items-center gap-4">
              <span className="text-5xl">📄</span>
              <div>
                <p className="font-medium text-gray-800 text-sm">{adminFile?.name ?? label}</p>
                {adminFile && (
                  <p className="text-gray-400 text-xs mt-1">
                    {(adminFile.size / 1024).toFixed(1)} KB
                  </p>
                )}
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                >
                  PDFを開く
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 h-52 flex flex-col items-center justify-center gap-3 text-center px-6">
              <span className="text-5xl">📄</span>
              <p className="text-sm text-gray-500 font-medium">{label}</p>
              <p className="text-xs text-gray-400">ファイルが見つかりません</p>
            </div>
          )}
          <p className="mt-3 text-xs text-gray-400">最終更新：{uploadedAt}</p>
        </div>
      </div>
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
  const { updateStatus, updateDocument, updateDocumentWarning, approveDocument, unapproveDocument } = useStore();
  const { t } = useI18n();
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(applicant.status);
  const [toast, setToast] = useState<string | null>(null);
  const [adminFiles, setAdminFiles] = useState<Record<string, AdminUploadedFile | null>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [editingWarning, setEditingWarning] = useState<DocumentKey | null>(null);
  const [warningDraft, setWarningDraft] = useState("");
  const [previewDoc, setPreviewDoc] = useState<{ key: DocumentKey; label: string } | null>(null);

  const handleSave = () => {
    updateStatus(applicant.id, selectedStatus);
    setToast(t("admin.toast", { name: applicant.name, status: t(STATUS_I18N[selectedStatus]) }));
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdminFile = async (key: DocumentKey, file: File) => {
    setAdminFiles((prev) => ({ ...prev, [key]: { name: file.name, size: file.size, file } }));
    updateDocument(applicant.id, key, true);
    setToast(t("admin.admin_upload_success"));
    setTimeout(() => setToast(null), 3000);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", applicant.id);
      formData.append("documentKey", key);
      await fetch("/api/upload", { method: "POST", body: formData });
    } catch (e) {
      console.error("Admin upload failed", e);
    }
  };

  const handleAdminRemove = (key: DocumentKey) => {
    const path = applicant.documentPaths?.[key];
    setAdminFiles((prev) => ({ ...prev, [key]: null }));
    updateDocument(applicant.id, key, false);
    if (fileRefs.current[key]) fileRefs.current[key]!.value = "";
    if (path) {
      fetch(`/api/files?path=${encodeURIComponent(path)}`, { method: "DELETE" }).catch(console.error);
    }
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
          {(applicant.nationality || applicant.consulateId) && (
            <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 space-y-0.5">
              {applicant.nationality && (
                <p className="text-xs text-gray-500">国籍：<span className="text-gray-700 font-medium">{applicant.nationality}</span></p>
              )}
              {applicant.consulateId && (() => {
                const c = findConsulateById(applicant.consulateId!);
                return c ? (
                  <p className="text-xs text-gray-500">申請先：<span className="text-gray-700 font-medium">{c.name_ja}</span></p>
                ) : null;
              })()}
            </div>
          )}
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
              const autoWarning = applicant.documentAutoWarnings?.[key];
              const approved = applicant.documentApprovals?.[key];
              const isEditing = editingWarning === key;

              // 3 states: gray=not uploaded, yellow△=pending/warning, green=approved
              const badgeColor = !uploaded
                ? "bg-gray-100 text-gray-400"
                : approved
                ? "bg-green-500 text-white"
                : "bg-yellow-400 text-white";

              return (
                <div key={key}>
                  <div className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                    {/* Number badge — △ overlay when pending/warning */}
                    <span className={`relative w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${badgeColor}`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 flex-1">{t(i18nKey)}</span>
                    {/* Pending label */}
                    {uploaded && !approved && !warning && (
                      <span className="text-xs text-yellow-600 font-medium flex-shrink-0">未確認</span>
                    )}
                    {/* Preview button */}
                    {uploaded && (
                      <button
                        onClick={() => setPreviewDoc({ key, label: t(i18nKey) })}
                        title="プレビュー"
                        className="w-6 h-6 flex items-center justify-center rounded transition-colors text-gray-300 hover:text-blue-500 flex-shrink-0"
                      >
                        <Eye size={13} />
                      </button>
                    )}
                    {/* ✓ approve toggle — green when approved, click again to un-approve */}
                    {uploaded && (
                      <button
                        onClick={() =>
                          approved
                            ? unapproveDocument(applicant.id, key)
                            : approveDocument(applicant.id, key)
                        }
                        title={approved ? "承認を取り消す" : "承認する"}
                        className={`w-6 h-6 flex items-center justify-center rounded transition-colors flex-shrink-0 ${
                          approved
                            ? "text-green-500 hover:text-gray-400"
                            : "text-gray-300 hover:text-green-500"
                        }`}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    )}
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
                  {/* Admin manual warning */}
                  {warning && !isEditing && (
                    <div className="ml-7 mb-1.5 flex items-start gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5">
                      <AlertTriangle size={11} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-700 leading-snug">{warning}</p>
                    </div>
                  )}
                  {/* Canvas API auto-detected warning */}
                  {autoWarning && (
                    <div className="ml-7 mb-1.5 flex items-start gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs flex-shrink-0 mt-0.5">🤖</span>
                      <p className="text-xs text-blue-700 leading-snug">
                        <span className="font-medium">自動検出：</span>{autoWarning}
                      </p>
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

        {/* ── Status History Timeline ── */}
        {applicant.statusHistory?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              ステータス履歴
            </p>
            <div className="relative pl-5 space-y-3">
              <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-gray-100" />
              {[...applicant.statusHistory].reverse().map((entry, i) => (
                <div key={i} className="relative flex items-start gap-3">
                  <div className={`absolute -left-[14px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                    i === 0 ? "bg-blue-500" : "bg-gray-300"
                  }`} />
                  <div>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[entry.status]}`}>
                      {entry.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">{entry.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

      {previewDoc && (
        <PreviewModal
          label={previewDoc.label}
          adminFile={adminFiles[previewDoc.key] ?? null}
          storagePath={adminFiles[previewDoc.key] ? undefined : applicant.documentPaths?.[previewDoc.key]}
          uploadedAt={applicant.updatedAt}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

type AdminTab = "applications" | "dashboard" | "settings";

function AdminContent() {
  const { applicants } = useStore();
  const { t } = useI18n();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const [activeTab, setActiveTab] = useState<AdminTab>("applications");
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

  const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "applications", label: t("admin.title"), icon: <Users size={14} /> },
    { id: "dashboard",    label: "ダッシュボード",  icon: <LayoutDashboard size={14} /> },
    { id: "settings",     label: "権限設定",        icon: <Settings size={14} /> },
  ];

  return (
    <div className="flex gap-0 h-[calc(100vh-80px)]">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Tab bar — only superadmin sees dashboard + settings */}
        {isSuperAdmin && (
          <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1 w-fit shadow-sm">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === "dashboard" && isSuperAdmin && <DashboardView />}
        {activeTab === "settings"  && isSuperAdmin && <SettingsView />}
        {activeTab !== "applications" && isSuperAdmin ? null : (
          <>
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
          </>
        )}
      </div>

      {/* Detail Panel */}
      {selectedApplicant && activeTab === "applications" && (
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
