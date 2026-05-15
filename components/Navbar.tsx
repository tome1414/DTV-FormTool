"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useI18n, Lang, LANG_LABELS, LANG_NAMES } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";
import { Bell, X } from "lucide-react";

const MONTHLY_REPORT = {
  month: "2024年3月",
  newApplicants: 7,
  dtvApproved: 1,
  embassyRevision: 1,
  documentsInsufficient: 2,
  inProgress: 5,
  approvalRate: 11,
  details: [
    { label: "新規申請数", value: 7, color: "text-blue-600" },
    { label: "DTV承認数", value: 1, color: "text-emerald-600" },
    { label: "大使館修正依頼", value: 1, color: "text-orange-500" },
    { label: "書類不足・差戻し", value: 2, color: "text-red-500" },
    { label: "処理中（未完了）", value: 5, color: "text-gray-600" },
  ],
  attention: [
    "書類不足のまま2週間以上経過：2件（佐藤 次郎、中村 勇気）",
    "大使館修正依頼から未対応7日以上：1件（加藤 美穂）",
  ],
};

function MonthlyReportModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end pt-16 pr-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-blue-800 text-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Bell size={16} />
            <div>
              <p className="font-semibold text-sm">月次レポート</p>
              <p className="text-blue-200 text-xs">{MONTHLY_REPORT.month}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Approval rate highlight */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
            <span className="text-3xl font-bold text-emerald-600">{MONTHLY_REPORT.approvalRate}%</span>
            <div>
              <p className="text-sm font-semibold text-emerald-700">DTV承認率</p>
              <p className="text-xs text-emerald-600">承認 {MONTHLY_REPORT.dtvApproved}件 / 総申請 {MONTHLY_REPORT.newApplicants}件</p>
            </div>
          </div>

          {/* Summary */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">今月のサマリー</p>
            <div className="space-y-1.5">
              {MONTHLY_REPORT.details.map(d => (
                <div key={d.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{d.label}</span>
                  <span className={`font-bold ${d.color}`}>{d.value}件</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attention items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">注意が必要な案件</p>
            <div className="space-y-1.5">
              {MONTHLY_REPORT.attention.map((item, i) => (
                <div key={i} className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  <span className="text-yellow-500 text-xs mt-0.5 flex-shrink-0">⚠</span>
                  <p className="text-xs text-yellow-800 leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-gray-400 text-center border-t border-gray-100 pt-3">
            送信元: DTV Portal System &lt;noreply@dtv-portal.com&gt;
          </p>
        </div>
      </div>
    </div>
  );
}

const LANG_ORDER_ALL: Lang[] = ["en", "ja", "zh", "ko", "hi", "ru"];
const LANG_ORDER_ADMIN: Lang[] = ["en", "ja"];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [notifRead, setNotifRead] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isAdminPage = pathname.startsWith("/admin");
  const LANG_ORDER = isAdminPage ? LANG_ORDER_ADMIN : LANG_ORDER_ALL;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navLinks = user
    ? user.role === "admin"
      ? [{ href: "/admin", label: t("nav.admin") }]
      : [
          { href: "/apply", label: t("nav.upload") },
          { href: "/mypage", label: t("nav.mypage") },
        ]
    : [{ href: "/apply", label: t("nav.upload") }];

  return (
    <>
    <nav className="bg-blue-800 text-white px-6 py-3 flex items-center gap-4 shadow-md">
      {/* Brand */}
      <span className="font-bold text-lg mr-2 whitespace-nowrap">DTV Portal</span>

      {/* Nav links */}
      <div className="flex items-center gap-1 flex-1">
        {navLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
              pathname === l.href
                ? "bg-white text-blue-800 font-semibold"
                : "hover:bg-blue-700"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Language switcher */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen((o) => !o)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-blue-600 hover:bg-blue-700 transition-colors"
          >
            <span>{LANG_LABELS[lang]}</span>
            <span className="text-blue-300 text-xs">▾</span>
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 min-w-[140px]">
              {LANG_ORDER.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLang(l);
                    setLangOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    lang === l ? "text-blue-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  <span>{LANG_NAMES[l]}</span>
                  <span className="text-xs text-gray-400">{LANG_LABELS[l]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification bell — admin only */}
        {isAdmin && (
          <button
            onClick={() => { setReportOpen(true); setNotifRead(true); }}
            className="relative p-1.5 rounded-full hover:bg-blue-700 transition-colors"
            title="月次レポート通知"
          >
            <Bell size={18} />
            {!notifRead && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-blue-800" />
            )}
          </button>
        )}

        {/* Auth buttons */}
        {user ? (
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-600 transition-colors whitespace-nowrap"
          >
            {t("nav.logout")}
          </button>
        ) : (
          <Link
            href="/login"
            className={`text-sm px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
              pathname === "/login"
                ? "bg-white text-blue-800 font-semibold"
                : "hover:bg-blue-700"
            }`}
          >
            {t("nav.login")}
          </Link>
        )}
      </div>
    </nav>
    {reportOpen && <MonthlyReportModal onClose={() => setReportOpen(false)} />}
    </>
  );
}
