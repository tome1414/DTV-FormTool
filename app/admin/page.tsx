"use client";

import { useState, useRef, useEffect } from "react";
import { Eye, RefreshCw, Upload, Trash2, CheckCircle2, AlertTriangle, X, LayoutDashboard, Settings, Users, Download, Crop } from "lucide-react";
import { useStore, Applicant, ApplicationStatus, DocumentKey } from "@/lib/store";
import { findConsulateById } from "@/lib/consulateData";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import AuthGuard from "@/components/AuthGuard";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  レビュー中: "bg-blue-100 text-blue-800",
  書類不足: "bg-red-100 text-red-800",
  提出準備完了: "bg-green-100 text-green-800",
  大使館提出済み: "bg-purple-100 text-purple-800",
  大使館修正依頼: "bg-orange-100 text-orange-800",
  DTV承認: "bg-emerald-100 text-emerald-800",
};

const STATUS_I18N: Record<ApplicationStatus, string> = {
  レビュー中: "status.reviewing",
  書類不足: "status.insufficient",
  提出準備完了: "status.ready",
  大使館提出済み: "status.submitted",
  大使館修正依頼: "status.embassy_revision",
  DTV承認: "status.dtv_approved",
};

const ALL_STATUSES: ApplicationStatus[] = [
  "レビュー中",
  "書類不足",
  "提出準備完了",
  "大使館提出済み",
  "大使館修正依頼",
  "DTV承認",
];

const EMAIL_PREVIEW: Record<string, { subject: string; body: string }> = {
  レビュー中: {
    subject: "Your documents are under review",
    body: "Our team is currently reviewing your submitted documents. We will be in touch shortly.",
  },
  書類不足: {
    subject: "Action required: Missing or incomplete documents",
    body: "We reviewed your documents and found that some items require resubmission. Please log in to your account and take the necessary action.",
  },
  提出準備完了: {
    subject: "Your documents are ready for submission",
    body: "All documents have been verified and are ready for embassy submission. We will notify you once submitted.",
  },
  大使館提出済み: {
    subject: "Your documents have been submitted to the embassy",
    body: "Your documents have been submitted to the embassy. Please wait for the review result.",
  },
  大使館修正依頼: {
    subject: "Additional documents requested by the embassy",
    body: "The embassy has requested additional or revised documents. Please log in to your account and await further instructions.",
  },
  DTV承認: {
    subject: "🎉 Your DTV application has been approved",
    body: "Congratulations! Your Thailand DTV (Destination Thailand Visa) application has been approved.\n\nYou can enter Thailand by presenting the PDF attached to your official DTV approval email at immigration.\n\nOur team will send you further instructions shortly.",
  },
};

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

const BUNDLE_DOC_KEYS = ["acceptanceLetter", "invoice", "existingPdfBundle"] as const;

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
  const bundleReady = BUNDLE_DOC_KEYS.every((k) => applicant.documents[k]);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [bundleDownloading, setBundleDownloading] = useState(false);

  const handleBundleDownload = async () => {
    setBundleDownloading(true);
    try {
      const res = await fetch(`/api/applications/${applicant.id}/bundle`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bundle_${applicant.applicationNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — could add error state if needed
    } finally {
      setBundleDownloading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: applicant.id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${applicant.applicationNumber}_documents.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : t("admin.download_failed"));
    } finally {
      setDownloading(false);
    }
  };

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
        {downloadError && (
          <p className="text-xs text-red-500 pt-0.5">{downloadError}</p>
        )}
      </div>
      <button
        onClick={canDownload ? handleDownload : undefined}
        disabled={!canDownload || downloading}
        className={`w-full text-sm py-2 transition-colors font-medium flex items-center justify-center gap-2 ${
          canDownload
            ? "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        {downloading && (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        )}
        {canDownload ? t("admin.download_ready") : t("admin.download_pdf")}
      </button>

      {/* Bundle PDF Download */}
      <button
        onClick={bundleReady ? handleBundleDownload : undefined}
        disabled={!bundleReady || bundleDownloading}
        className={`mt-2 w-full text-sm py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
          bundleReady
            ? "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
        title={bundleReady ? undefined : t("admin.bundle_not_ready")}
      >
        {bundleDownloading
          ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          : <Download size={14} />
        }
        {bundleDownloading ? t("admin.bundle_generating") : t("admin.bundle_download")}
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
  レビュー中: "#60A5FA",
  書類不足: "#F87171",
  提出準備完了: "#34D399",
  大使館提出済み: "#A78BFA",
  大使館修正依頼: "#FB923C",
  DTV承認: "#10B981",
};
const STATUS_TW: Record<ApplicationStatus, string> = {
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
  const { t } = useI18n();

  const total = applicants.length;
  const submittedCount = applicants.filter(a => ["大使館提出済み", "大使館修正依頼", "DTV承認"].includes(a.status)).length;
  const revisionCount = applicants.filter(a => a.status === "大使館修正依頼").length;
  const approvedCount = applicants.filter(a => a.status === "DTV承認").length;
  const approvalRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  const statusCounts = (Object.keys(STATUS_HEX) as ApplicationStatus[]).map(s => ({
    label: t(STATUS_I18N[s]), value: applicants.filter(a => a.status === s).length,
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
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{t("admin.dashboard_title")}</h1>
        <p className="text-gray-500 text-sm">{t("admin.dashboard_subtitle")}</p>
      </div>

      {/* Approval funnel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700">{t("admin.flow_title")}</p>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
            <span className="text-emerald-600 font-bold text-lg">{approvalRate}%</span>
            <span className="text-xs text-emerald-700">{t("admin.approval_rate")}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <FunnelStep label={t("admin.total_label")} value={total} total={total} colorHex="#60A5FA" colorBg="bg-blue-50" />
          <FunnelStep label={t("admin.embassy_submitted_label")} value={submittedCount} total={total} colorHex="#A78BFA" colorBg="bg-purple-50" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-300 text-sm flex-shrink-0">┬→</span>
              <div className="flex-1 rounded-xl border-2 border-orange-300 bg-orange-50 p-2 text-center">
                <p className="text-lg font-bold text-orange-500">{revisionCount}</p>
                <p className="text-[10px] text-gray-600 leading-tight">{t("admin.embassy_revision_stat")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300 text-sm flex-shrink-0">└→</span>
              <div className="flex-1 rounded-xl border-2 border-emerald-400 bg-emerald-50 p-2 text-center">
                <p className="text-lg font-bold text-emerald-600">{approvedCount}</p>
                <p className="text-[10px] text-gray-600 leading-tight">{t("admin.dtv_approved_stat")}</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          ※ {t("admin.flow_note")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Status donut */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">{t("admin.status_breakdown")}</p>
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
          <p className="text-sm font-semibold text-gray-700 mb-1">{t("admin.monthly_trend")}</p>
          <VBarChart data={monthlyData} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Nationality distribution */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">{t("admin.nationality_stats")}</p>
          {natData.length > 0 ? (
            <div className="space-y-2">
              {natData.map(([nat, count], i) => (
                <HBar key={nat} label={nat} value={count} max={natMax} colorClass={natColors[i]} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">{t("admin.no_nationality_data")}</p>
          )}
        </div>

        {/* Document completion */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">{t("admin.doc_completion")}</p>
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

function PassportCropModal({
  applicationId,
  storagePath,
  onClose,
  onSaved,
}: {
  applicationId: string;
  storagePath: string;
  onClose: () => void;
  onSaved: (newPath: string) => void;
}) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // crop state (in canvas coords)
  const drag = useRef<{ startX: number; startY: number; active: boolean }>({ startX: 0, startY: 0, active: false });
  const cropRect = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    fetch(`/api/files?path=${encodeURIComponent(storagePath)}`)
      .then((r) => r.json())
      .then(({ url }) => setSignedUrl(url));
  }, [storagePath]);

  useEffect(() => {
    if (!signedUrl || !canvasRef.current) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current!;
      const maxW = 480;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setImgLoaded(true);
    };
    img.src = signedUrl;
  }, [signedUrl]);

  const redraw = (rect: { x: number; y: number; w: number; h: number } | null) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (rect && rect.w > 0 && rect.h > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(rect.x, rect.y, rect.w, rect.h);
      ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getPos(e);
    drag.current = { startX: x, startY: y, active: true };
    cropRect.current = null;
  };
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drag.current.active) return;
    const { x, y } = getPos(e);
    const rect = {
      x: Math.min(drag.current.startX, x),
      y: Math.min(drag.current.startY, y),
      w: Math.abs(x - drag.current.startX),
      h: Math.abs(y - drag.current.startY),
    };
    cropRect.current = rect;
    redraw(rect);
  };
  const onMouseUp = () => { drag.current.active = false; };

  const handleApply = async () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const rect = cropRect.current;
    if (!canvas || !img || !rect || rect.w < 4 || rect.h < 4) return;

    setSaving(true);
    const scale = img.width / canvas.width;
    const tmp = document.createElement("canvas");
    tmp.width = rect.w * scale;
    tmp.height = rect.h * scale;
    tmp.getContext("2d")!.drawImage(
      img,
      rect.x * scale, rect.y * scale, rect.w * scale, rect.h * scale,
      0, 0, tmp.width, tmp.height
    );

    tmp.toBlob(async (blob) => {
      if (!blob) { setSaving(false); return; }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch(`/api/applications/${applicationId}/crop-passport`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ croppedDataUrl: reader.result }),
          });
          if (res.ok) {
            const { storagePath: newPath } = await res.json();
            onSaved(newPath);
            onClose();
          }
        } finally {
          setSaving(false);
        }
      };
      reader.readAsDataURL(blob);
    }, "image/jpeg", 0.92);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <p className="font-semibold text-gray-800 text-sm">{t("admin.crop_title")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t("admin.crop_desc")}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <div className="p-4 overflow-auto max-h-[60vh] flex justify-center">
          {!imgLoaded && (
            <div className="h-40 flex items-center justify-center">
              <span className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={`rounded-lg border border-gray-200 cursor-crosshair ${imgLoaded ? "block" : "hidden"}`}
            style={{ maxWidth: "100%" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
          />
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
            {t("common.cancel")}
          </button>
          <button
            onClick={handleApply}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium flex items-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            {saving ? t("admin.crop_saving") : t("admin.crop_apply")}
          </button>
        </div>
      </div>
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
            <iframe
              src={displayUrl}
              className="w-full rounded-lg border border-gray-200"
              style={{ height: "480px" }}
              title={label}
            />
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
  const { t, lang } = useI18n();
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(applicant.status);
  const [toast, setToast] = useState<string | null>(null);
  const [adminFiles, setAdminFiles] = useState<Record<string, AdminUploadedFile | null>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [editingWarning, setEditingWarning] = useState<DocumentKey | null>(null);
  const [warningDraft, setWarningDraft] = useState("");
  const [previewDoc, setPreviewDoc] = useState<{ key: DocumentKey; label: string } | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminComment, setAdminComment] = useState("");
  const [showOnMypage, setShowOnMypage] = useState(false);
  const [cropPassportOpen, setCropPassportOpen] = useState(false);

  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    document.addEventListener("dragover", prevent);
    document.addEventListener("drop", prevent);
    return () => {
      document.removeEventListener("dragover", prevent);
      document.removeEventListener("drop", prevent);
    };
  }, []);

  const handleNotify = async () => {
    setNotifying(true);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: applicant.email,
          applicantName: applicant.name,
          applicationNumber: applicant.applicationNumber,
          notes: applicant.notes,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setToast(t("admin.notify_sent"));
      } else {
        setToast(`${t("admin.save_notify_error")}: ${json.error ?? res.status}`);
      }
    } catch {
      setToast(`${t("admin.save_notify_error")}: ${t("admin.network_error")}`);
    } finally {
      setNotifying(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleSave = () => {
    setAdminComment("");
    setShowOnMypage(false);
    setConfirmSave(true);
  };

  const handleConfirmSave = async (sendNotification: boolean) => {
    setConfirmSave(false);
    setSaving(true);
    updateStatus(applicant.id, selectedStatus);

    // コメントをマイページに表示する場合はDBのnotesに保存
    const comment = adminComment.trim();
    if (comment && showOnMypage) {
      await fetch(`/api/applications/${applicant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: comment }),
      }).catch(console.error);
    }

    if (sendNotification) {
      try {
        const res = await fetch("/api/notify-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: applicant.email,
            applicantName: applicant.name,
            applicationNumber: applicant.applicationNumber,
            newStatus: selectedStatus,
            adminComment: comment || undefined,
          }),
        });
        const json = await res.json();
        setToast(res.ok ? t("admin.save_notify_success") : `${t("admin.save_notify_error")}: ${json.error ?? res.status}`);
      } catch {
        setToast(`${t("admin.save_notify_error")}: ${t("admin.network_error")}`);
      }
    } else {
      setToast(t("admin.toast", { name: applicant.name, status: t(STATUS_I18N[selectedStatus]) }));
    }
    setSaving(false);
    setTimeout(() => setToast(null), 4000);
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
                <p className="text-xs text-gray-500">{t("admin.nationality_label")}：<span className="text-gray-700 font-medium">{applicant.nationality}</span></p>
              )}
              {applicant.consulateId && (() => {
                const c = findConsulateById(applicant.consulateId!);
                return c ? (
                  <p className="text-xs text-gray-500">{t("admin.consulate_label")}：<span className="text-gray-700 font-medium">{c.name_ja}</span></p>
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
            disabled={saving}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
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
                      <span className="text-xs text-yellow-600 font-medium flex-shrink-0">{t("admin.unconfirmed")}</span>
                    )}
                    {/* Preview button */}
                    {uploaded && (
                      <button
                        onClick={() => setPreviewDoc({ key, label: t(i18nKey) })}
                        title={t("common.preview")}
                        className="w-6 h-6 flex items-center justify-center rounded transition-colors text-gray-300 hover:text-blue-500 flex-shrink-0"
                      >
                        <Eye size={13} />
                      </button>
                    )}
                    {/* Crop button — passport image only */}
                    {uploaded && key === "passport" && applicant.documentPaths?.["passport"] && (
                      <button
                        onClick={() => setCropPassportOpen(true)}
                        title={t("admin.crop_passport")}
                        className="w-6 h-6 flex items-center justify-center rounded transition-colors text-gray-300 hover:text-orange-500 flex-shrink-0"
                      >
                        <Crop size={13} />
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
                        title={approved ? t("admin.unapprove") : t("admin.approve")}
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
                        title={warning ? t("admin.warning_edit") : t("admin.warning_add")}
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
                        title={t("admin.warning_remove")}
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
                        placeholder={t("admin.warning_placeholder")}
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
                          {t("common.cancel")}
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
              {t("admin.status_history")}
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
                      {t(STATUS_I18N[entry.status])}
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
                        {t("admin.not_uploaded")}
                      </span>
                    )}
                  </div>

                  {uploaded ? (
                    <div
                      className="flex items-center gap-2 mt-1"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) handleAdminFile(key, file);
                      }}
                    >
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
                        title={t("common.delete")}
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
          <button
            onClick={handleNotify}
            disabled={notifying}
            className="w-full border border-orange-300 text-orange-600 text-sm py-2 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {notifying && (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
            )}
            {t("admin.notify")}
          </button>
          <DownloadSection applicant={applicant} t={t} />
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* ── ステータス保存確認モーダル ── */}
      {confirmSave && (() => {
        const preview = EMAIL_PREVIEW[selectedStatus];
        const previewBody = preview
          ? adminComment.trim()
            ? `${preview.body}\n\n${adminComment.trim()}`
            : preview.body
          : "";
        const isWarningStatus = selectedStatus === "書類不足" || selectedStatus === "大使館修正依頼";
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h3 className="font-bold text-gray-800 text-base">{t("admin.confirm_save_title")}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t("admin.confirm_save_desc", { name: applicant.name, status: t(STATUS_I18N[selectedStatus]) })}
                </p>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                {/* Language warning */}
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {lang === "ja"
                    ? "⚠️ 日本語以外の申請者には英語でメールが届きます。コメントは英語で記入してください。"
                    : "⚠️ Please write your message in English. Non-Japanese applicants will receive this message in English."}
                </p>

                {/* Comment textarea */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Message to applicant <span className="text-gray-400 font-normal">(included in email)</span>
                    {isWarningStatus && (
                      <span className="ml-2 text-orange-500 font-semibold">⚠ Recommended</span>
                    )}
                  </label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="e.g. Your bank statement shows less than 500,000 THB. Please resubmit."
                    rows={3}
                    className={`w-full text-sm border rounded-lg px-3 py-2 resize-none focus:outline-none transition-colors ${
                      isWarningStatus
                        ? "border-orange-300 bg-orange-50 focus:border-orange-400"
                        : "border-gray-200 bg-gray-50 focus:border-blue-400"
                    }`}
                  />
                  {/* Show on mypage toggle */}
                  {adminComment.trim() && (
                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                      <div
                        onClick={() => setShowOnMypage(v => !v)}
                        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${showOnMypage ? "bg-blue-500" : "bg-gray-200"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showOnMypage ? "translate-x-4" : ""}`} />
                      </div>
                      <span className="text-xs text-gray-600">
                        {lang === "ja" ? "申請者のマイページにも表示する" : "Also show on applicant's My Page"}
                      </span>
                    </label>
                  )}
                </div>

                {/* Email preview */}
                {preview && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                    <div className="bg-gray-100 px-3 py-1.5 text-gray-500 font-medium flex items-center gap-1.5">
                      <span>📧</span> Email Preview
                    </div>
                    <div className="px-3 py-2.5 space-y-2 bg-gray-50">
                      <div>
                        <span className="text-gray-400">Subject: </span>
                        <span className="font-medium text-gray-700">[DTV Application] {preview.subject} — {applicant.applicationNumber}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <span className="text-gray-400 block mb-1">Body:</span>
                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">{previewBody}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 pb-5 pt-2 space-y-2 flex-shrink-0 border-t border-gray-100">
                <button
                  onClick={() => handleConfirmSave(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span>📧</span> {t("admin.save_with_notify")}
                </button>
                <button
                  onClick={() => handleConfirmSave(false)}
                  className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm py-2.5 rounded-lg font-medium transition-colors"
                >
                  {t("admin.save_without_notify")}
                </button>
                <button
                  onClick={() => setConfirmSave(false)}
                  className="w-full text-gray-400 hover:text-gray-600 text-sm py-1.5 transition-colors"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {previewDoc && (
        <PreviewModal
          label={previewDoc.label}
          adminFile={adminFiles[previewDoc.key] ?? null}
          storagePath={adminFiles[previewDoc.key] ? undefined : applicant.documentPaths?.[previewDoc.key]}
          uploadedAt={applicant.updatedAt}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {cropPassportOpen && applicant.documentPaths?.["passport"] && (
        <PassportCropModal
          applicationId={applicant.id}
          storagePath={applicant.documentPaths["passport"]}
          onClose={() => setCropPassportOpen(false)}
          onSaved={(newPath) => {
            updateDocument(applicant.id, "passport", true, newPath);
          }}
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
    ready: applicants.filter((a) => a.status === "提出準備完了").length,
    insufficient: applicants.filter((a) => a.status === "書類不足").length,
  };

  const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "applications", label: t("admin.title"), icon: <Users size={14} /> },
    { id: "dashboard",    label: t("admin.tab_dashboard"),  icon: <LayoutDashboard size={14} /> },
    { id: "settings",     label: t("admin.tab_settings"),   icon: <Settings size={14} /> },
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            {
              label: t("admin.total"),
              value: counts.total,
              color: "border-blue-400 bg-blue-50",
              text: "text-blue-700",
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
                      {DOC_DOTS.map((d, idx) => {
                        const uploaded = a.documents[d.key];
                        const approved = a.documentApprovals?.[d.key];
                        const dotColor = !uploaded
                          ? "bg-gray-100 text-gray-400"
                          : approved
                          ? "bg-green-500 text-white"
                          : "bg-yellow-400 text-white";
                        return (
                          <span
                            key={d.key}
                            title={t(d.i18nKey)}
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold select-none ${dotColor}`}
                          >
                            {idx + 1}
                          </span>
                        );
                      })}
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
