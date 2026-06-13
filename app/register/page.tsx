"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import NationalitySelect from "@/components/NationalitySelect";
import { CONSULATE_REGIONS, findConsulateById } from "@/lib/consulateData";

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [nationality, setNationality] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedConsulateId, setSelectedConsulateId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const regionData = CONSULATE_REGIONS.find((r) => r.id === selectedRegion);
  const countryData = regionData?.countries.find((c) => c.country_ja === selectedCountry);
  const consulateInfo = selectedConsulateId ? findConsulateById(selectedConsulateId) : null;

  const canSubmit =
    email.trim() &&
    password.trim().length >= 6 &&
    lastName.trim() &&
    firstName.trim() &&
    nationality &&
    selectedConsulateId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const result = await register(
        email.trim(), password,
        lastName.trim(), firstName.trim(), middleName.trim(),
        nationality, selectedConsulateId
      );
      if (!result.success) {
        setError(result.error ?? t("register.error_default"));
        return;
      }
      // 初回登録フラグ — apply画面でウェルカムモーダルを1回だけ表示する
      localStorage.setItem("dtv_show_welcome", "1");
      // router.push だとセッションCookieの確立タイミングでmiddlewareに弾かれることがある
      // window.location.href でフルリロードすることで確実にセッションを確立させる
      window.location.href = "/apply";
    } catch {
      setError(t("register.error_runtime"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg px-5 py-8 sm:px-8 sm:py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-md">
              <span className="text-white text-2xl">🛂</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t("register.title")}</h1>
            <p className="text-gray-400 text-sm mt-1">{t("register.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("register.last_name")}<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder={t("register.placeholder_last")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("register.first_name")}<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder={t("register.placeholder_first")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("register.middle_name")}
                <span className="text-gray-400 font-normal text-xs ml-1.5">{t("register.middle_name_optional")}</span>
              </label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder={t("register.placeholder_middle")}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("register.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("register.password")}
                <span className="text-gray-400 font-normal text-xs ml-1">{t("register.password_hint")}</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                {t("register.section_applicant")}
              </p>

              {/* Nationality */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("register.nationality")}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <NationalitySelect value={nationality} onChange={setNationality} />
              </div>

              {/* Consulate cascade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("register.consulate")}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value);
                      setSelectedCountry("");
                      setSelectedConsulateId("");
                    }}
                    className="border border-gray-300 rounded-lg px-2 py-2.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">{t("register.region")}</option>
                    {CONSULATE_REGIONS.map((r) => (
                      <option key={r.id} value={r.id}>{r.label_ja}</option>
                    ))}
                  </select>

                  <select
                    value={selectedCountry}
                    onChange={(e) => { setSelectedCountry(e.target.value); setSelectedConsulateId(""); }}
                    disabled={!selectedRegion}
                    className="border border-gray-300 rounded-lg px-2 py-2.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">{t("register.country")}</option>
                    {regionData?.countries.map((c) => (
                      <option key={c.country_ja} value={c.country_ja}>{c.country_ja}</option>
                    ))}
                  </select>

                  <select
                    value={selectedConsulateId}
                    onChange={(e) => setSelectedConsulateId(e.target.value)}
                    disabled={!selectedCountry}
                    className="border border-gray-300 rounded-lg px-2 py-2.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">{t("register.consulate")}</option>
                    {countryData?.consulates.map((c) => (
                      <option key={c.id} value={c.id}>{c.type}（{c.city_ja}）</option>
                    ))}
                  </select>
                </div>

                {consulateInfo && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
                    <p className="text-xs font-semibold text-blue-800">{consulateInfo.name_ja}</p>
                    <p className="text-xs text-blue-500 mt-0.5">{consulateInfo.name_en}</p>
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
                      {t("register.official_site")}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
                canSubmit && !loading
                  ? "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {loading ? t("register.loading") : t("register.submit")}
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => { window.location.href = "/login"; }}
              className="text-sm text-blue-600 hover:underline"
            >
              {t("register.already_have_account")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
