"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

const CONTENT = {
  ja: {
    title: "プライバシーポリシー",
    updated: "最終更新：2026年5月19日",
    back: "← ログインページへ戻る",
    copyright: "© 2026 DTV Portal. All rights reserved.",
    sections: [
      {
        heading: "1. 事業者情報",
        body: "本プライバシーポリシーは、DTV Portal（以下「本サービス」）を運営する事業者が、申請者の個人情報をどのように収集・利用・管理するかを定めるものです。",
      },
      {
        heading: "2. 収集する個人情報",
        intro: "本サービスは、DTV申請処理のために以下の情報を収集します。",
        table: [
          ["氏名（姓・名・ミドルネーム）", "申請者の識別"],
          ["メールアドレス", "ログイン・通知メール送信"],
          ["国籍・申請先領事館", "申請先の管理"],
          ["パスポート写真ページ", "DTV申請書類として使用"],
          ["残高証明書", "DTV申請書類として使用"],
          ["顔写真", "DTV申請書類として使用"],
          ["滞在証明書類", "DTV申請書類として使用"],
          ["申請ステータス履歴", "申請進捗の記録・問い合わせ対応"],
        ],
        tableHeaders: ["情報の種類", "収集目的"],
      },
      {
        heading: "3. 個人情報の利用目的",
        list: [
          "タイDTV（Destination Thailand Visa）の申請代行サービスの提供",
          "申請ステータスの管理および申請者への通知",
          "担当者からのフィードバック・連絡",
          "申請完了後のお問い合わせ対応",
        ],
      },
      {
        heading: "4. データ保持期間",
        retentionTable: [
          ["DTV承認済み", "承認日から 5年間"],
          ["申請却下・未完了", "最終更新日から 1年間"],
          ["削除リクエスト受領後", "30日以内に削除"],
        ],
        retentionHeaders: ["ケース", "保持期間"],
        note: "※ DTV（Destination Thailand Visa）は最長5年の有効期限を持つビザです。有効期間中のお問い合わせに対応するため、承認後5年間データを保持します。",
      },
      {
        heading: "5. 第三者提供",
        intro: "収集した個人情報は、以下の場合を除き第三者に提供しません。",
        list: [
          "DTV申請のために必要なタイ大使館・領事館への提出",
          "法令に基づく開示要求がある場合",
          "申請者本人の同意がある場合",
        ],
      },
      {
        heading: "6. 安全管理措置",
        list: [
          "通信はSSL/TLSにより暗号化されています",
          "データはSupabase（AWS ap-southeast-1）に安全に保存されています",
          "書類ファイルへのアクセスは認証済みユーザーのみに制限されています",
        ],
      },
      {
        heading: "7. ご本人の権利",
        intro: "申請者は以下の権利を有します。",
        list: [
          "保有する個人情報の開示請求",
          "個人情報の訂正・削除の請求",
          "個人情報の利用停止の請求",
        ],
        body: "これらの権利行使をご希望の場合は、担当者までメールにてご連絡ください。削除リクエストは受領から30日以内に対応いたします。",
      },
      {
        heading: "8. Cookie・ローカルストレージの使用",
        body: "本サービスは、ログイン状態の維持にCookieおよびセッション情報を使用します。広告目的のトラッキングは行いません。",
      },
      {
        heading: "9. ポリシーの変更",
        body: "本ポリシーは必要に応じて改定することがあります。重要な変更の場合は本サービス上でお知らせします。",
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: May 19, 2026",
    back: "← Back to Login",
    copyright: "© 2026 DTV Portal. All rights reserved.",
    sections: [
      {
        heading: "1. About This Policy",
        body: "This Privacy Policy explains how DTV Portal (the \"Service\") collects, uses, and manages personal information provided by applicants.",
      },
      {
        heading: "2. Information We Collect",
        intro: "We collect the following information to process your DTV application.",
        table: [
          ["Full name (last, first, middle)", "Applicant identification"],
          ["Email address", "Login and email notifications"],
          ["Nationality & consulate", "Application routing"],
          ["Passport photo page", "Required for DTV application"],
          ["Bank statement", "Required for DTV application"],
          ["Portrait photo", "Required for DTV application"],
          ["Proof of stay document", "Required for DTV application"],
          ["Application status history", "Progress tracking & support"],
        ],
        tableHeaders: ["Data", "Purpose"],
      },
      {
        heading: "3. How We Use Your Information",
        list: [
          "Providing DTV (Destination Thailand Visa) application services",
          "Managing application status and sending notifications",
          "Communicating feedback from our staff",
          "Responding to post-submission inquiries",
        ],
      },
      {
        heading: "4. Data Retention",
        retentionTable: [
          ["DTV approved", "5 years from approval date"],
          ["Rejected / incomplete", "1 year from last update"],
          ["Deletion request received", "Deleted within 30 days"],
        ],
        retentionHeaders: ["Case", "Retention Period"],
        note: "※ DTV (Destination Thailand Visa) is a visa with a maximum validity of 5 years. We retain data for 5 years after approval to support any inquiries during that period.",
      },
      {
        heading: "5. Sharing with Third Parties",
        intro: "We do not share your personal information with third parties except in the following cases.",
        list: [
          "Submission to Thai embassies or consulates required for DTV processing",
          "When required by applicable laws or regulations",
          "When you have given your explicit consent",
        ],
      },
      {
        heading: "6. Security",
        list: [
          "All communications are encrypted with SSL/TLS",
          "Data is stored securely on Supabase (AWS ap-southeast-1)",
          "Access to uploaded documents is restricted to authenticated users only",
        ],
      },
      {
        heading: "7. Your Rights",
        intro: "You have the following rights regarding your personal data.",
        list: [
          "Request access to your personal information",
          "Request correction or deletion of your data",
          "Request restriction of processing",
        ],
        body: "To exercise these rights, please contact us by email. Deletion requests will be processed within 30 days of receipt.",
      },
      {
        heading: "8. Cookies & Local Storage",
        body: "The Service uses cookies and session data to maintain your login state. We do not use tracking cookies for advertising purposes.",
      },
      {
        heading: "9. Changes to This Policy",
        body: "We may update this policy from time to time. We will notify you of any significant changes through the Service.",
      },
    ],
  },
};

type Lang = "ja" | "en";

export default function PrivacyPage() {
  const { lang } = useI18n();
  const [displayLang, setDisplayLang] = useState<Lang>(
    lang === "ja" ? "ja" : "en"
  );
  const c = CONTENT[displayLang];

  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{c.title}</h1>
          <p className="text-sm text-gray-400">{c.updated}</p>
        </div>
        {/* Language toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
          {(["ja", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setDisplayLang(l)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                displayLang === l
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {l === "ja" ? "日本語" : "English"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
        {c.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-base font-bold text-gray-800 mb-2 pb-1 border-b border-gray-200">
              {section.heading}
            </h2>

            {"intro" in section && section.intro && (
              <p className="mb-3">{section.intro}</p>
            )}

            {"table" in section && section.table && (
              <table className="w-full border border-gray-200 rounded-lg overflow-hidden text-xs mb-3">
                <thead className="bg-gray-50">
                  <tr>
                    {section.tableHeaders!.map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 w-2/5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {section.table.map(([col1, col2]) => (
                    <tr key={col1}>
                      <td className="px-3 py-2 text-gray-700">{col1}</td>
                      <td className="px-3 py-2 text-gray-500">{col2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {"retentionTable" in section && section.retentionTable && (
              <>
                <table className="w-full border border-gray-200 rounded-lg overflow-hidden text-xs mb-3">
                  <thead className="bg-gray-50">
                    <tr>
                      {section.retentionHeaders!.map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 w-2/5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {section.retentionTable.map(([col1, col2]) => (
                      <tr key={col1}>
                        <td className="px-3 py-2 text-gray-700">{col1}</td>
                        <td className="px-3 py-2 text-gray-500 font-medium">{col2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {"note" in section && section.note && (
                  <p className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    {section.note}
                  </p>
                )}
              </>
            )}

            {"list" in section && section.list && (
              <ul className="list-disc list-inside space-y-1 text-gray-600 mb-2">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}

            {"body" in section && section.body && (
              <p>{section.body}</p>
            )}
          </section>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between">
        <p className="text-xs text-gray-400">{c.copyright}</p>
        <Link href="/login" className="text-xs text-blue-500 hover:underline">
          {c.back}
        </Link>
      </div>
    </div>
  );
}
