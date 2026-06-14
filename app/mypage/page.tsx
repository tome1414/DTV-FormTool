"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export default function MyPageRedirect() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    router.push("/apply");
  }, [router]);

  // Show "マイページ" while redirecting (instead of "書類アップロード")
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">{t("nav.mypage")}</h1>
      <p className="text-gray-500 text-sm mb-6">{t("apply.subtitle")}</p>
    </div>
  );
}
