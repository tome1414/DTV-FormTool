"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      if (!user) {
        setError(t("login.error"));
        return;
      }
      router.push(user.role === "applicant" ? "/mypage" : "/admin");
    } catch {
      setError(t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg px-5 py-8 sm:px-8 sm:py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-md">
              <span className="text-white text-2xl">🛂</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t("login.title")}</h1>
            <p className="text-gray-400 text-sm mt-1">{t("login.subtitle")}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("login.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("login.password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5 flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
              }`}
            >
              {loading ? "..." : t("login.submit")}
            </button>
          </form>

          {/* Create account */}
          <div className="text-center mt-5">
            <Link href="/register" className="text-sm text-blue-600 hover:underline">
              {t("login.create_account")}
            </Link>
          </div>

          {/* Hints */}
          <div className="mt-7 border-t border-gray-100 pt-5 space-y-1.5">
            <p className="text-xs text-gray-400">{t("login.hint_applicant")}</p>
            <p className="text-xs text-gray-400">{t("login.hint_admin")}</p>
            <p className="text-xs text-gray-400">Owner: owner@example.com / owner123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
