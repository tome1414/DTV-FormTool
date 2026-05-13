"use client";

import { useState } from "react";
import { useStore, Applicant, ApplicationStatus, DocumentKey } from "@/lib/store";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  確認待ち: "bg-yellow-100 text-yellow-800",
  レビュー中: "bg-blue-100 text-blue-800",
  書類不足: "bg-red-100 text-red-800",
  提出準備完了: "bg-green-100 text-green-800",
  大使館提出済み: "bg-purple-100 text-purple-800",
};

const ALL_STATUSES: ApplicationStatus[] = [
  "確認待ち",
  "レビュー中",
  "書類不足",
  "提出準備完了",
  "大使館提出済み",
];

const DOC_DOTS: { key: DocumentKey; label: string }[] = [
  { key: "passport", label: "パスポート" },
  { key: "bankStatement", label: "残高証明" },
  { key: "photo", label: "顔写真" },
  { key: "driverLicense", label: "免許証" },
  { key: "flightTicket", label: "Eチケット" },
  { key: "pgaLicense", label: "PGAライセンス" },
  { key: "acceptanceLetter", label: "受け入れレター" },
];

const DOC_LABELS: Record<DocumentKey, string> = {
  passport: "パスポート写真ページ",
  bankStatement: "残高証明書",
  photo: "顔写真",
  driverLicense: "運転免許証",
  flightTicket: "フライトEチケット",
  pgaLicense: "PGAライセンス",
  acceptanceLetter: "受け入れレター",
};

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50 animate-fade-in">
      <span className="text-green-400">✓</span>
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white">✕</button>
    </div>
  );
}

function DetailPanel({ applicant, onClose }: { applicant: Applicant; onClose: () => void }) {
  const { updateStatus } = useStore();
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(applicant.status);
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = () => {
    updateStatus(applicant.id, selectedStatus);
    setToast(`${applicant.name} のステータスを「${selectedStatus}」に変更しました`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h2 className="font-bold text-gray-800">申請詳細</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Applicant Info */}
        <div>
          <p className="text-xs text-gray-400 mb-1">申請番号</p>
          <p className="font-bold text-gray-800">{applicant.applicationNumber}</p>
          <p className="text-sm text-gray-600 mt-1">{applicant.name}</p>
          <p className="text-xs text-gray-400">{applicant.email}</p>
        </div>

        {/* Status Change */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ステータス変更</p>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ApplicationStatus)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition-colors font-medium"
          >
            保存する
          </button>
        </div>

        {/* Document List */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">書類状況</p>
          <div className="space-y-1.5">
            {(Object.entries(DOC_LABELS) as [DocumentKey, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{label}</span>
                <span className={`text-sm font-bold ${applicant.documents[key] ? "text-green-600" : "text-red-400"}`}>
                  {applicant.documents[key] ? "○" : "✕"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button className="w-full border border-orange-300 text-orange-600 text-sm py-2 rounded-lg hover:bg-orange-50 transition-colors">
            不備通知を送る
          </button>
          <button className="w-full border border-gray-300 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors">
            PDFをダウンロード
          </button>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function AdminPage() {
  const { applicants } = useStore();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "すべて">("すべて");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = applicants.filter((a) => {
    const matchSearch =
      a.name.includes(search) ||
      a.applicationNumber.includes(search) ||
      a.email.includes(search);
    const matchStatus = filterStatus === "すべて" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const selectedApplicant = applicants.find((a) => a.id === selectedId) || null;

  const counts = {
    total: applicants.length,
    waiting: applicants.filter((a) => a.status === "確認待ち").length,
    ready: applicants.filter((a) => a.status === "提出準備完了").length,
    insufficient: applicants.filter((a) => a.status === "書類不足").length,
  };

  return (
    <div className="flex gap-0 h-[calc(100vh-80px)]">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pr-0">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">管理者ダッシュボード</h1>
        <p className="text-gray-500 text-sm mb-6">申請者の書類確認とステータス管理</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "申請者総数", value: counts.total, color: "border-blue-400 bg-blue-50", text: "text-blue-700" },
            { label: "確認待ち", value: counts.waiting, color: "border-yellow-400 bg-yellow-50", text: "text-yellow-700" },
            { label: "提出準備完了", value: counts.ready, color: "border-green-400 bg-green-50", text: "text-green-700" },
            { label: "書類不足", value: counts.insufficient, color: "border-red-400 bg-red-50", text: "text-red-700" },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border-l-4 ${card.color} p-4 shadow-sm`}>
              <p className={`text-3xl font-bold ${card.text}`}>{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="名前・申請番号・メールで検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ApplicationStatus | "すべて")}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="すべて">すべてのステータス</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">申請番号</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">名前</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">ステータス</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">書類状況</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">申請日</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${
                    selectedId === a.id ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedId(selectedId === a.id ? null : a.id)}
                >
                  <td className="px-5 py-3 font-mono text-gray-600">{a.applicationNumber}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{a.name}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {DOC_DOTS.map((d) => (
                        <span
                          key={d.key}
                          title={d.label}
                          className={`w-2.5 h-2.5 rounded-full ${a.documents[d.key] ? "bg-green-500" : "bg-gray-200"}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{a.submittedAt}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    該当する申請者が見つかりません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedApplicant && (
        <DetailPanel
          applicant={selectedApplicant}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
