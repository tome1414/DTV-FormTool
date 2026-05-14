"use client";

import { useState, useRef } from "react";
import { AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { checkPassportMargin, checkPhotoBackground, type AnalysisWarning } from "@/lib/imageAnalysis";
import { CONSULATE_REGIONS, findConsulateById, type Consulate } from "@/lib/consulateData";
import AuthGuard from "@/components/AuthGuard";

interface UploadedFile {
  file: File;
  preview: string | null;
}

interface DocConfig {
  key: string;
  required: boolean;
  hasNote: boolean;
  showGuide?: boolean;
}

const DOC_CONFIGS: DocConfig[] = [
  { key: "passport", required: true, hasNote: true },
  { key: "bankStatement", required: true, hasNote: true },
  { key: "photo", required: true, hasNote: true, showGuide: true },
  { key: "driverLicense", required: true, hasNote: true },
];

function ApplyContent() {
  const { t } = useI18n();
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({ passport: true });
  const [uploads, setUploads] = useState<Record<string, UploadedFile | null>>({});
  const [activeTab, setActiveTab] = useState<Record<string, "upload" | "preview">>({});
  const [submitted, setSubmitted] = useState(false);
  const [imageWarnings, setImageWarnings] = useState<Record<string, AnalysisWarning | null>>({});
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Applicant info form
  const [nationality, setNationality] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedConsulateId, setSelectedConsulateId] = useState("");

  const regionData = CONSULATE_REGIONS.find((r) => r.id === selectedRegion);
  const countryData = regionData?.countries.find((c) => c.country_ja === selectedCountry);
  const consulateInfo: (Consulate & { country_ja: string; country_en: string; region_ja: string }) | null =
    selectedConsulateId ? findConsulateById(selectedConsulateId) : null;

  const toggle = (key: string) =>
    setOpenKeys((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleFile = async (key: string, file: File) => {
    const isImage = file.type.startsWith("image/");
    const preview = isImage ? URL.createObjectURL(file) : null;
    setUploads((prev) => ({ ...prev, [key]: { file, preview } }));
    setActiveTab((prev) => ({ ...prev, [key]: "preview" }));
    setImageWarnings((prev) => ({ ...prev, [key]: null }));

    if (isImage && (key === "passport" || key === "photo")) {
      setAnalyzing((prev) => ({ ...prev, [key]: true }));
      const warning =
        key === "passport" ? await checkPassportMargin(file)
        : await checkPhotoBackground(file);
      setImageWarnings((prev) => ({ ...prev, [key]: warning }));
      setAnalyzing((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDrop = (key: string, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(key, file);
  };

  const handleRemove = (key: string) => {
    setUploads((prev) => ({ ...prev, [key]: null }));
    setActiveTab((prev) => ({ ...prev, [key]: "upload" }));
    setImageWarnings((prev) => ({ ...prev, [key]: null }));
    if (fileRefs.current[key]) fileRefs.current[key]!.value = "";
  };

  const requiredKeys = DOC_CONFIGS.filter((d) => d.required).map((d) => d.key);
  const uploadedRequired = requiredKeys.filter((k) => uploads[k]);
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
      <h1 className="text-2xl font-bold text-gray-800 mb-1">{t("apply.title")}</h1>
      <p className="text-gray-500 text-sm mb-6">{t("apply.subtitle")}</p>

      {/* ── Applicant Info Form ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">申請者情報</h2>

        {/* Nationality */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">国籍</label>
          <input
            type="text"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="例：日本、韓国、中国..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Consulate cascade */}
        <div className="mb-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">申請予定の領事館</label>
          <div className="grid grid-cols-3 gap-2">
            {/* Region */}
            <select
              value={selectedRegion}
              onChange={(e) => { setSelectedRegion(e.target.value); setSelectedCountry(""); setSelectedConsulateId(""); }}
              className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">地域を選択</option>
              {CONSULATE_REGIONS.map((r) => (
                <option key={r.id} value={r.id}>{r.label_ja}</option>
              ))}
            </select>

            {/* Country */}
            <select
              value={selectedCountry}
              onChange={(e) => { setSelectedCountry(e.target.value); setSelectedConsulateId(""); }}
              disabled={!selectedRegion}
              className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">国を選択</option>
              {regionData?.countries.map((c) => (
                <option key={c.country_ja} value={c.country_ja}>{c.country_ja}</option>
              ))}
            </select>

            {/* Consulate */}
            <select
              value={selectedConsulateId}
              onChange={(e) => setSelectedConsulateId(e.target.value)}
              disabled={!selectedCountry}
              className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">公館を選択</option>
              {countryData?.consulates.map((c) => (
                <option key={c.id} value={c.id}>{c.type}（{c.city_ja}）</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected consulate info card */}
        {consulateInfo && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-blue-800 mb-0.5">{consulateInfo.name_ja}</p>
            <p className="text-xs text-blue-600 mb-2">{consulateInfo.name_en}</p>
            {consulateInfo.note && (
              <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 mb-2">
                ⚠️ {consulateInfo.note}
              </p>
            )}
            <a
              href={consulateInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <ExternalLink size={11} />
              公式サイトで最新情報を確認する
            </a>
            <p className="text-xs text-gray-400 mt-1">
              ※ 管轄・居住地要件・必要書類・手数料・予約要否は各公館の公式サイトでご確認ください
            </p>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">{t("apply.progress_label")}</span>
          <span className="font-semibold text-blue-700">
            {t("apply.progress_count", {
              uploaded: uploadedRequired.length,
              total: requiredKeys.length,
            })}
          </span>
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
          const docLabel = t(`docs.${doc.key}`);
          const docNote = doc.hasNote ? t(`docs.${doc.key}_note`) : null;

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
                  {uploaded ? (
                    <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </span>
                  ) : (
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                        doc.required ? "border-red-400" : "border-gray-300"
                      }`}
                    />
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

                  {/* Tabs */}
                  {uploaded && (
                    <div className="flex gap-2 mt-3 mb-3">
                      <button
                        onClick={() =>
                          setActiveTab((p) => ({ ...p, [doc.key]: "upload" }))
                        }
                        className={`text-sm px-3 py-1 rounded-md border transition-colors ${
                          tab === "upload"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {t("common.upload")}
                      </button>
                      <button
                        onClick={() =>
                          setActiveTab((p) => ({ ...p, [doc.key]: "preview" }))
                        }
                        className={`text-sm px-3 py-1 rounded-md border transition-colors ${
                          tab === "preview"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {t("common.preview")}
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
                      <p className="text-gray-600 text-sm">{t("apply.drag_drop")}</p>
                      <p className="text-gray-400 text-xs mt-1">{t("apply.file_types")}</p>
                      <input
                        ref={(el) => {
                          fileRefs.current[doc.key] = el;
                        }}
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
                              <div
                                className="border-2 border-dashed border-blue-500 opacity-60"
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
                            <p className="font-medium text-gray-800 text-sm">
                              {uploaded.file.name}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {(uploaded.file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      )}
                      {/* Canvas API analysis result */}
                      {analyzing[doc.key] && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <Loader2 size={12} className="animate-spin" />
                          <span>画像を解析中...</span>
                        </div>
                      )}
                      {!analyzing[doc.key] && imageWarnings[doc.key] && (
                        <div className="mt-2 flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                          <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-orange-700 leading-relaxed">
                            {imageWarnings[doc.key]!.message}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => fileRefs.current[doc.key]?.click()}
                          className="text-sm px-3 py-1.5 border border-blue-400 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          {t("common.replace")}
                        </button>
                        <button
                          onClick={() => handleRemove(doc.key)}
                          className="text-sm px-3 py-1.5 border border-red-300 text-red-500 rounded-md hover:bg-red-50 transition-colors"
                        >
                          {t("common.delete")}
                        </button>
                        <input
                          ref={(el) => {
                            fileRefs.current[doc.key] = el;
                          }}
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
          onClick={() => setSubmitted(true)}
          className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${
            canSubmit
              ? "bg-blue-600 hover:bg-blue-700 shadow-md"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {canSubmit
            ? t("apply.submit_ready")
            : t("apply.submit_pending", {
                count: requiredKeys.length - uploadedRequired.length,
              })}
        </button>
      </div>
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
