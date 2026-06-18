"use client";

import { useState, useRef, useEffect } from "react";
import { ExternalLink, Pencil, Check, X } from "lucide-react";
import WelcomeModal from "@/components/WelcomeModal";
import MultiPageUpload from "@/components/MultiPageUpload";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { checkPassportMargin, checkPhotoBackground } from "@/lib/imageAnalysis";
import { CONSULATE_REGIONS, findConsulateById, findConsulateLocation } from "@/lib/consulateData";
import NationalitySelect from "@/components/NationalitySelect";
import AuthGuard from "@/components/AuthGuard";
import { ApplicationStatus } from "@/lib/store";

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

interface UploadedFile {
  file: File;
  preview: string | null;
  storagePath?: string;
}

interface PageFile {
  id: string;
  file: File | null;
  preview?: string;
  storagePath?: string;
  isUploading?: boolean;
}

interface DocConfig {
  key: string;
  required: boolean;
  hasNote: boolean;
  showGuide?: boolean;
  multiPage?: boolean;
}

const DOC_CONFIGS: DocConfig[] = [
  { key: "passport", required: true, hasNote: true },
  { key: "bankStatement", required: true, hasNote: true },
  { key: "bankStatementHistory", required: true, hasNote: true, multiPage: true },
  { key: "photo", required: true, hasNote: true, showGuide: true },
  { key: "driverLicense", required: true, hasNote: true, multiPage: true },
];

function ApplyContent() {
  const { t } = useI18n();
  const { user, updateProfile } = useAuth();
  const { setAutoWarning, updateDocument, myApplication } = useStore();

  const [showWelcome, setShowWelcome] = useState(false);
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({ passport: true });
  const [uploads, setUploads] = useState<Record<string, UploadedFile | null>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, "upload" | "preview">>({});
  const [submitted, setSubmitted] = useState(false);
  const [bankHistoryPages, setBankHistoryPages] = useState<PageFile[]>([]);
  const [driverLicensePages, setDriverLicensePages] = useState<PageFile[]>([]);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const consulateInfo = user?.consulateId ? findConsulateById(user.consulateId) : null;

  // 初回登録後のウェルカムモーダル（localStorageフラグで1回だけ表示）
  useEffect(() => {
    if (localStorage.getItem("dtv_show_welcome") === "1") {
      localStorage.removeItem("dtv_show_welcome");
      setShowWelcome(true);
    }
  }, []);

  // myApplication ロード時に uploads/multiPage state を初期化
  useEffect(() => {
    if (!myApplication) return;

    // シングルページ書類
    const initialUploads: Record<string, UploadedFile | null> = {};
    DOC_CONFIGS.forEach((doc) => {
      if (!doc.multiPage && myApplication.documents[doc.key as import("@/lib/store").DocumentKey]) {
        const storagePath = myApplication.documentPaths?.[doc.key as import("@/lib/store").DocumentKey];
        initialUploads[doc.key] = {
          file: new File([], storagePath?.split("/").pop() ?? doc.key),
          preview: null,
          storagePath,
        };
      }
    });
    setUploads(initialUploads);

    // 複数ページ書類: storage_paths から復元
    const bankPaths = myApplication.documentStoragePaths?.bankStatementHistory ?? [];
    if (bankPaths.length > 0) {
      setBankHistoryPages(
        bankPaths.map((p, i) => ({ id: `loaded_bank_${i}`, file: null, storagePath: p }))
      );
    }

    const driverPaths = myApplication.documentStoragePaths?.driverLicense ?? [];
    if (driverPaths.length > 0) {
      setDriverLicensePages(
        driverPaths.map((p, i) => ({ id: `loaded_driver_${i}`, file: null, storagePath: p }))
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myApplication?.id]);

  // ── Inline profile edit state ──
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNationality, setEditNationality] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editConsulateId, setEditConsulateId] = useState("");

  const editRegionData = CONSULATE_REGIONS.find((r) => r.id === editRegion);
  const editCountryData = editRegionData?.countries.find((c) => c.country_ja === editCountry);
  const editConsulateInfo = editConsulateId ? findConsulateById(editConsulateId) : null;

  const startEditProfile = () => {
    const loc = user?.consulateId ? findConsulateLocation(user.consulateId) : null;
    setEditNationality(user?.nationality ?? "");
    setEditRegion(loc?.regionId ?? "");
    setEditCountry(loc?.countryJa ?? "");
    setEditConsulateId(user?.consulateId ?? "");
    setIsEditingProfile(true);
  };

  const saveProfile = () => {
    if (editNationality && editConsulateId) {
      updateProfile({ nationality: editNationality, consulateId: editConsulateId });
    }
    setIsEditingProfile(false);
  };

  const toggle = (key: string) => {
    setOpenKeys((prev) => {
      const willOpen = !prev[key];
      // 多ページ書類を開いたとき、ページが0件なら1ページ目を自動追加
      if (willOpen) {
        if (key === "bankStatementHistory" && bankHistoryPages.length === 0) {
          setBankHistoryPages([{ id: `page_${Date.now()}`, file: null }]);
        }
        if (key === "driverLicense" && driverLicensePages.length === 0) {
          setDriverLicensePages([{ id: `page_${Date.now()}`, file: null }]);
        }
      }
      return { ...prev, [key]: willOpen };
    });
  };

  // ファイル選択時：ローカルプレビューのみ（サーバー未送信）
  const handleFileSelect = (key: string, file: File) => {
    const isImage = file.type.startsWith("image/");
    const preview = isImage ? URL.createObjectURL(file) : null;
    setUploads((prev) => ({ ...prev, [key]: { file, preview, storagePath: undefined } }));

    // Canvas チェックはバックグラウンドで実行
    if (isImage && myApplication && (key === "passport" || key === "photo")) {
      const check = key === "passport" ? checkPassportMargin : checkPhotoBackground;
      check(file).then((warning) => {
        setAutoWarning(myApplication.id, key as import("@/lib/store").DocumentKey, warning?.message ?? null);
      });
    }
  };

  // 「提出する」ボタン押下時：実際にサーバーへアップロード
  const handleSubmitDoc = async (key: string) => {
    const uploadedFile = uploads[key];
    if (!uploadedFile || !myApplication) return;
    setUploading((prev) => ({ ...prev, [key]: true }));
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile.file);
      formData.append("applicationId", myApplication.id);
      formData.append("documentKey", key);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (res.ok) {
        setUploads((prev) => prev[key] ? { ...prev, [key]: { ...prev[key]!, storagePath: json.path } } : prev);
        updateDocument(myApplication.id, key as import("@/lib/store").DocumentKey, true, json.path);
      } else {
        setUploadError(`提出エラー: ${json.error ?? res.status}`);
      }
    } catch (e) {
      setUploadError(`ネットワークエラー: ${e instanceof Error ? e.message : "不明"}`);
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDrop = (key: string, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(key, file);
  };

  const handleRemove = (key: string) => {
    const storagePath = uploads[key]?.storagePath;
    setUploads((prev) => ({ ...prev, [key]: null }));
    setActiveTab((prev) => ({ ...prev, [key]: "upload" }));
    if (myApplication) {
      setAutoWarning(myApplication.id, key as import("@/lib/store").DocumentKey, null);
      updateDocument(myApplication.id, key as import("@/lib/store").DocumentKey, false);
    }
    if (fileRefs.current[key]) fileRefs.current[key]!.value = "";
    if (storagePath) {
      fetch(`/api/files?path=${encodeURIComponent(storagePath)}`, { method: "DELETE" }).catch(console.error);
    }
  };

  // bankStatementHistory 複数ページ操作
  const handleAddBankPage = () => {
    setBankHistoryPages((prev) => [
      ...prev,
      { id: `page_${Date.now()}`, file: null },
    ]);
  };

  const handleRemoveBankPage = (pageId: string) => {
    const page = bankHistoryPages.find((p) => p.id === pageId);
    if (page?.storagePath) {
      fetch(`/api/files?path=${encodeURIComponent(page.storagePath)}`, {
        method: "DELETE",
      }).catch(console.error);
    }
    setBankHistoryPages((prev) => prev.filter((p) => p.id !== pageId));
    // Update store if no more pages
    if (bankHistoryPages.filter((p) => p.id !== pageId).length === 0 && myApplication) {
      updateDocument(myApplication.id, "bankStatementHistory", false);
    }
  };

  const handleUploadBankPage = async (pageId: string, file: File) => {
    if (!myApplication) return;

    setBankHistoryPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, isUploading: true } : p))
    );
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", myApplication.id);
      formData.append("documentKey", "bankStatementHistory");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (res.ok) {
        setBankHistoryPages((prev) =>
          prev.map((p) =>
            p.id === pageId ? { ...p, file, storagePath: json.path, isUploading: false } : p
          )
        );
        // Mark as uploaded if at least one page is uploaded
        if (bankHistoryPages.some((p) => p.storagePath)) {
          updateDocument(myApplication.id, "bankStatementHistory", true, json.path);
        }
      } else {
        setUploadError(`アップロードエラー: ${json.error ?? res.status}`);
        setBankHistoryPages((prev) =>
          prev.map((p) => (p.id === pageId ? { ...p, isUploading: false } : p))
        );
      }
    } catch (e) {
      setUploadError(
        `ネットワークエラー: ${e instanceof Error ? e.message : "不明"}`
      );
      setBankHistoryPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, isUploading: false } : p))
      );
    }
  };

  // driverLicense 複数ページ操作
  const handleAddDriverPage = () => {
    setDriverLicensePages((prev) => [
      ...prev,
      { id: `page_${Date.now()}`, file: null },
    ]);
  };

  const handleRemoveDriverPage = (pageId: string) => {
    const page = driverLicensePages.find((p) => p.id === pageId);
    if (page?.storagePath) {
      fetch(`/api/files?path=${encodeURIComponent(page.storagePath)}`, {
        method: "DELETE",
      }).catch(console.error);
    }
    setDriverLicensePages((prev) => prev.filter((p) => p.id !== pageId));
    if (driverLicensePages.filter((p) => p.id !== pageId).length === 0 && myApplication) {
      updateDocument(myApplication.id, "driverLicense", false);
    }
  };

  const handleUploadDriverPage = async (pageId: string, file: File) => {
    if (!myApplication) return;

    setDriverLicensePages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, isUploading: true } : p))
    );
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", myApplication.id);
      formData.append("documentKey", "driverLicense");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (res.ok) {
        setDriverLicensePages((prev) =>
          prev.map((p) =>
            p.id === pageId ? { ...p, file, storagePath: json.path, isUploading: false } : p
          )
        );
        if (driverLicensePages.some((p) => p.storagePath)) {
          updateDocument(myApplication.id, "driverLicense", true, json.path);
        }
      } else {
        setUploadError(`アップロードエラー: ${json.error ?? res.status}`);
        setDriverLicensePages((prev) =>
          prev.map((p) => (p.id === pageId ? { ...p, isUploading: false } : p))
        );
      }
    } catch (e) {
      setUploadError(
        `ネットワークエラー: ${e instanceof Error ? e.message : "不明"}`
      );
      setDriverLicensePages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, isUploading: false } : p))
      );
    }
  };

  const requiredKeys = DOC_CONFIGS.filter((d) => d.required).map((d) => d.key);
  const uploadedRequired = requiredKeys.filter((k) => {
    if (k === "bankStatementHistory") {
      return bankHistoryPages.some((p) => p.storagePath) || !!myApplication?.documents.bankStatementHistory;
    }
    if (k === "driverLicense") {
      return driverLicensePages.some((p) => p.storagePath) || !!myApplication?.documents.driverLicense;
    }
    return !!uploads[k]?.storagePath;
  });
  const progress = Math.round((uploadedRequired.length / requiredKeys.length) * 100);
  const canSubmit = uploadedRequired.length === requiredKeys.length;

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <div className="bg-green-50 border border-green-300 rounded-xl p-10">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">{t("apply.success_title")}</h2>
          <p className="text-gray-600">{t("apply.success_number")}: DTV-2024-0009</p>
          <p className="text-gray-500 text-sm mt-2">{t("apply.success_desc")}</p>
          {consulateInfo && (
            <p className="text-gray-400 text-xs mt-3">
              申請先：{consulateInfo.name_ja}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        {user ? t("nav.mypage") : t("apply.title")}
      </h1>
      <p className="text-gray-500 text-sm mb-6">{t("apply.subtitle")}</p>

      {/* ── Applicant Info ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">申請者情報</h2>
          {!isEditingProfile && (
            <button
              onClick={startEditProfile}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
            >
              <Pencil size={12} />
              変更
            </button>
          )}
        </div>

        {isEditingProfile ? (
          /* ── Edit mode ── */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">国籍</label>
              <NationalitySelect value={editNationality} onChange={setEditNationality} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">申請予定の領事館</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={editRegion}
                  onChange={(e) => { setEditRegion(e.target.value); setEditCountry(""); setEditConsulateId(""); }}
                  className="border border-gray-300 rounded-lg px-2 py-2.5 sm:py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">地域</option>
                  {CONSULATE_REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>{r.label_ja}</option>
                  ))}
                </select>
                <select
                  value={editCountry}
                  onChange={(e) => { setEditCountry(e.target.value); setEditConsulateId(""); }}
                  disabled={!editRegion}
                  className="border border-gray-300 rounded-lg px-2 py-2.5 sm:py-2 text-sm focus:outline-none focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">国</option>
                  {editRegionData?.countries.map((c) => (
                    <option key={c.country_ja} value={c.country_ja}>{c.country_ja}</option>
                  ))}
                </select>
                <select
                  value={editConsulateId}
                  onChange={(e) => setEditConsulateId(e.target.value)}
                  disabled={!editCountry}
                  className="border border-gray-300 rounded-lg px-2 py-2.5 sm:py-2 text-sm focus:outline-none focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">公館</option>
                  {editCountryData?.consulates.map((c) => (
                    <option key={c.id} value={c.id}>{c.type}（{c.city_ja}）</option>
                  ))}
                </select>
              </div>
              {editConsulateInfo && (
                <p className="mt-1.5 text-xs text-blue-700 font-medium">{editConsulateInfo.name_ja}</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={saveProfile}
                disabled={!editNationality || !editConsulateId}
                className="flex items-center gap-1.5 text-sm px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                <Check size={13} />
                保存
              </button>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex items-center gap-1.5 text-sm px-4 py-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X size={13} />
                キャンセル
              </button>
            </div>
          </div>
        ) : user?.nationality && user?.consulateId ? (
          /* ── Read-only mode ── */
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16 shrink-0">国籍</span>
              <span className="text-sm font-medium text-gray-800">{user.nationality}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs text-gray-500 w-16 shrink-0 mt-0.5">申請先</span>
              <div>
                {consulateInfo ? (
                  <>
                    <p className="text-sm font-medium text-gray-800">{consulateInfo.name_ja}</p>
                    <p className="text-xs text-gray-400">{consulateInfo.name_en}</p>
                    {consulateInfo.note && (
                      <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 mt-1.5">
                        ⚠️ {consulateInfo.note}
                      </p>
                    )}
                    <a
                      href={consulateInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1"
                    >
                      <ExternalLink size={10} />
                      公式サイトで確認
                    </a>
                  </>
                ) : (
                  <span className="text-sm text-gray-500">{user.consulateId}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── Not set ── */
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
            国籍・申請先が未設定です。
            <button onClick={startEditProfile} className="ml-2 underline font-medium">
              こちらから設定してください
            </button>
          </div>
        )}
      </div>

      {/* Status & Steps */}
      {myApplication && (
        <div className="space-y-4 mb-6">
          {/* Application Number & Date */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-0.5">{t("mypage.app_number")}</p>
                <p className="text-sm font-mono font-semibold text-gray-800">{myApplication.applicationNumber}</p>
              </div>
              {myApplication.submittedAt && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">{t("mypage.submitted_date")}</p>
                  <p className="text-sm text-gray-700">
                    {new Date(myApplication.submittedAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">申請状況</p>
            <p className={`text-sm font-semibold px-3 py-2 rounded border inline-block ${STATUS_STYLES[myApplication.status]}`}>
              {t(STATUS_I18N[myApplication.status])}
            </p>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 mb-4">申請ステップ</p>
            <div className="relative flex items-center justify-between">
              {[
                { step: 1, label: t("mypage.steps.submit") },
                { step: 2, label: t("mypage.steps.review") },
                { step: 3, label: t("mypage.steps.ready") },
                { step: 4, label: t("mypage.steps.embassy") },
              ].map((s) => {
                const currentStep = STEP_INDEX[myApplication.status];
                const isActive = s.step <= currentStep;
                return (
                  <div key={s.step} className="flex flex-col items-center flex-1 relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm mb-2 transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {s.step}
                    </div>
                    <p className="text-xs text-gray-600 text-center whitespace-nowrap">{s.label}</p>
                  </div>
                );
              })}
              {/* Progress line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-0" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-blue-600 -z-0 transition-all"
                style={{
                  width: `${((STEP_INDEX[myApplication.status] - 1) * 33.33 + 16.66)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <span className="text-red-500 text-lg">⚠️</span>
          <p className="text-sm text-red-700 flex-1">{uploadError}</p>
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">✕</button>
        </div>
      )}

      {/* アップロード済み書類一覧 */}
      {myApplication && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">書類アップロード状況</p>
          <div className="space-y-0">
            {DOC_CONFIGS.map((doc) => {
              const isMultiPage = doc.multiPage;
              const pages = doc.key === "bankStatementHistory" ? bankHistoryPages : driverLicensePages;
              const uploadedCount = isMultiPage ? pages.filter((p) => p.storagePath).length : 0;
              const isUploaded = isMultiPage
                ? (uploadedCount > 0 || !!myApplication?.documents[doc.key as import("@/lib/store").DocumentKey])
                : !!uploads[doc.key]?.storagePath;
              return (
                <div
                  key={doc.key}
                  className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    {isUploaded ? (
                      <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">✓</span>
                    ) : (
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${doc.required ? "border-red-400" : "border-gray-300"}`} />
                    )}
                    <span className="text-sm text-gray-700">{t(`docs.${doc.key}`)}</span>
                    {doc.required && !isUploaded && (
                      <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">必須</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ${isUploaded ? "text-green-600" : "text-gray-400"}`}>
                    {isUploaded
                      ? isMultiPage
                        ? `${uploadedCount}ページ済み`
                        : "アップロード済み"
                      : "未アップロード"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* プログレスバー */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">{t("apply.progress_label")}</span>
              <span className="font-semibold text-blue-700">
                {uploadedRequired.length} / {requiredKeys.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Accordion Cards */}
      <div className="space-y-3">
        {DOC_CONFIGS.map((doc) => {
          const isOpen = openKeys[doc.key];
          const uploaded = uploads[doc.key];
          const docLabel = t(`docs.${doc.key}`);
          const docNote = doc.hasNote ? t(`docs.${doc.key}_note`) : null;

          // 3状態: 提出済み / 選択中（未提出） / 未選択
          const multiPages = doc.key === "bankStatementHistory" ? bankHistoryPages : driverLicensePages;
          const isSubmitted = doc.multiPage
            ? (multiPages.some((p) => p.storagePath) || !!myApplication?.documents[doc.key as import("@/lib/store").DocumentKey])
            : !!uploads[doc.key]?.storagePath;
          const isLocalOnly = !doc.multiPage && !!uploaded && !uploaded.storagePath;

          return (
            <div
              key={doc.key}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Header */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                onClick={() => toggle(doc.key)}
              >
                <div className="flex items-center gap-3">
                  {uploading[doc.key] ? (
                    <span className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0" />
                  ) : isSubmitted ? (
                    <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</span>
                  ) : isLocalOnly ? (
                    <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">!</span>
                  ) : (
                    <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${doc.required ? "border-red-400" : "border-gray-300"}`} />
                  )}
                  <span className="font-medium text-gray-800">{docLabel}</span>
                  {doc.required ? (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      {t("common.required")}
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {t("common.optional")}
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-sm">{isOpen ? "▲" : "▼"}</span>
              </button>

              {/* Body */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  {docNote && (
                    <div className="mt-3 mb-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-800">
                      ⚠️ {docNote}
                    </div>
                  )}

                  {/* 複数ページ書類 */}
                  {doc.key === "bankStatementHistory" ? (
                    <div className="mt-3">
                      <MultiPageUpload
                        pages={bankHistoryPages}
                        onAddPage={handleAddBankPage}
                        onRemovePage={handleRemoveBankPage}
                        onUploadPage={handleUploadBankPage}
                        maxPages={30}
                        disabled={false}
                        documentKey="bankStatementHistory"
                        t={t}
                      />
                    </div>
                  ) : doc.key === "driverLicense" ? (
                    <div className="mt-3">
                      <MultiPageUpload
                        pages={driverLicensePages}
                        onAddPage={handleAddDriverPage}
                        onRemovePage={handleRemoveDriverPage}
                        onUploadPage={handleUploadDriverPage}
                        maxPages={30}
                        disabled={false}
                        documentKey="driverLicense"
                        t={t}
                      />
                    </div>
                  ) : (
                    <div className="mt-3">
                      {/* 状態1: 未選択 → ドロップエリア */}
                      {!uploaded && (
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(doc.key, e)}
                          onClick={() => fileRefs.current[doc.key]?.click()}
                        >
                          <div className="text-3xl mb-2">📎</div>
                          <p className="text-gray-700 text-sm font-medium">{t("apply.drag_drop")}</p>
                          <p className="text-gray-400 text-xs mt-1">{t("apply.file_types")}</p>
                        </div>
                      )}

                      {/* 状態2: 選択済み・未提出 → プレビュー＋警告＋提出ボタン */}
                      {uploaded && !uploaded.storagePath && (
                        <div className="space-y-3">
                          {/* プレビュー */}
                          <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                            {uploaded.preview ? (
                              <div className="relative">
                                {doc.showGuide && (
                                  <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                                    <div className="border-2 border-dashed border-blue-500 opacity-60" style={{ width: "70px", height: "90px" }} />
                                  </div>
                                )}
                                <img src={uploaded.preview} alt="preview" className="max-h-56 w-full object-contain" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 p-4">
                                <span className="text-3xl">📄</span>
                                <div>
                                  <p className="font-medium text-gray-800 text-sm">{uploaded.file.name}</p>
                                  <p className="text-gray-400 text-xs">{(uploaded.file.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* 未提出の警告 */}
                          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                            <span className="text-amber-500 text-base flex-shrink-0">⚠️</span>
                            <p className="text-sm text-amber-800">まだサーバーに提出されていません。下の「提出する」を押してください。</p>
                          </div>
                          {/* ボタン群（一列に揃える） */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => fileRefs.current[doc.key]?.click()}
                              className="flex-1 py-2.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              差し替え
                            </button>
                            <button
                              onClick={() => handleSubmitDoc(doc.key)}
                              disabled={uploading[doc.key]}
                              className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors"
                            >
                              {uploading[doc.key] ? "提出中..." : "📤 提出する"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 状態3: 提出済み → プレビュー＋差し替え・削除 */}
                      {uploaded?.storagePath && (
                        <div className="space-y-3">
                          {/* 提出済みバッジ */}
                          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                            <span className="text-green-500 text-base flex-shrink-0">✅</span>
                            <p className="text-sm text-green-800 font-medium">提出済み</p>
                          </div>
                          {/* プレビュー */}
                          <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                            {uploaded.preview ? (
                              <div className="relative">
                                {doc.showGuide && (
                                  <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                                    <div className="border-2 border-dashed border-blue-500 opacity-60" style={{ width: "70px", height: "90px" }} />
                                  </div>
                                )}
                                <img src={uploaded.preview} alt="preview" className="max-h-56 w-full object-contain" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 p-4">
                                <span className="text-3xl">📄</span>
                                <div>
                                  <p className="font-medium text-gray-800 text-sm">{uploaded.file.name}</p>
                                  <p className="text-gray-400 text-xs">{(uploaded.file.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* ボタン群 */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => fileRefs.current[doc.key]?.click()}
                              className="flex-1 py-2.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              差し替え
                            </button>
                            <button
                              onClick={() => handleRemove(doc.key)}
                              className="flex-1 py-2.5 text-sm border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ファイル入力（共通） */}
                      <input
                        ref={(el) => { fileRefs.current[doc.key] = el; }}
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(doc.key, file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>


      {/* ウェルカムモーダル（初回登録時のみ） */}
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
    </div>
  );
}

export default function ApplyPage() {
  return (
    <AuthGuard>
      <ApplyContent />
    </AuthGuard>
  );
}
