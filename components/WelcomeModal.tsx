"use client";

import { useI18n } from "@/lib/i18n";

export default function WelcomeModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();

  const docs = [
    {
      emoji: "🛂",
      label: t("docs.passport"),
      note: t("apply.welcome_note_passport"),
      color: "bg-blue-50 border-blue-200",
      badge: "bg-blue-100 text-blue-700",
    },
    {
      emoji: "🏦",
      label: t("docs.bankStatement"),
      note: t("apply.welcome_note_bank"),
      color: "bg-green-50 border-green-200",
      badge: "bg-green-100 text-green-700",
    },
    {
      emoji: "🤳",
      label: t("docs.photo"),
      note: t("apply.welcome_note_photo"),
      color: "bg-purple-50 border-purple-200",
      badge: "bg-purple-100 text-purple-700",
    },
    {
      emoji: "📋",
      label: t("docs.driverLicense"),
      note: t("apply.welcome_note_driver"),
      color: "bg-orange-50 border-orange-200",
      badge: "bg-orange-100 text-orange-700",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-700 px-6 py-5 text-white text-center">
          <div className="text-4xl mb-2">📋</div>
          <h2 className="text-lg font-bold">{t("apply.welcome_title")}</h2>
          <p className="text-blue-200 text-xs mt-1">{t("apply.welcome_subtitle")}</p>
        </div>

        {/* Document list */}
        <div className="p-5 space-y-2.5">
          {docs.map((doc, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl border p-3 ${doc.color}`}
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{doc.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${doc.badge}`}>
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">{doc.label}</span>
                </div>
                <p className="text-xs text-gray-500 leading-snug">{doc.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {t("apply.welcome_start")}
          </button>
        </div>
      </div>
    </div>
  );
}
