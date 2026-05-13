"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/apply", label: "書類アップロード" },
  { href: "/mypage", label: "マイページ" },
  { href: "/admin", label: "管理者ダッシュボード" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-blue-800 text-white px-6 py-3 flex items-center gap-6 shadow-md">
      <span className="font-bold text-lg mr-4">DTV申請管理</span>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`text-sm px-3 py-1.5 rounded transition-colors ${
            pathname === l.href
              ? "bg-white text-blue-800 font-semibold"
              : "hover:bg-blue-700"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
