"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useI18n, Lang, LANG_LABELS, LANG_NAMES } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";

const LANG_ORDER_ALL: Lang[] = ["en", "ja", "zh", "ko", "hi", "ru"];
const LANG_ORDER_ADMIN: Lang[] = ["en", "ja"];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
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
  );
}
