"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";

export type ApplicationStatus =
  | "レビュー中"
  | "書類不足"
  | "提出準備完了"
  | "大使館提出済み"
  | "大使館修正依頼"
  | "DTV承認";

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  timestamp: string;
}

export type DocumentKey =
  | "passport"
  | "bankStatement"
  | "photo"
  | "driverLicense"
  | "flightTicket"
  | "pgaLicense"
  | "acceptanceLetter"
  | "invoice"
  | "existingPdfBundle";

export interface Applicant {
  id: string;
  userId?: string;
  applicationNumber: string;
  name: string;
  email: string;
  status: ApplicationStatus;
  documents: Record<DocumentKey, boolean>;
  documentWarnings?: Partial<Record<DocumentKey, string>>;
  documentAutoWarnings?: Partial<Record<DocumentKey, string>>;
  documentApprovals?: Partial<Record<DocumentKey, boolean>>;
  documentPaths?: Partial<Record<DocumentKey, string>>;
  notes?: string;
  nationality?: string;
  consulateId?: string;
  submittedAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryEntry[];
}

interface StoreContextType {
  applicants: Applicant[];
  myApplication: Applicant | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  updateStatus: (id: string, status: ApplicationStatus) => void;
  updateDocument: (id: string, key: DocumentKey, value: boolean, storagePath?: string) => void;
  updateDocumentWarning: (id: string, key: DocumentKey, warning: string | null) => void;
  approveDocument: (id: string, key: DocumentKey) => void;
  unapproveDocument: (id: string, key: DocumentKey) => void;
  setAutoWarning: (id: string, key: DocumentKey, warning: string | null) => void;
}

const DOCUMENT_KEYS: DocumentKey[] = [
  "passport", "bankStatement", "photo", "driverLicense",
  "flightTicket", "pgaLicense", "acceptanceLetter", "invoice", "existingPdfBundle",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbToApplicant(app: Record<string, any>): Applicant {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docs: Record<string, any>[] = app.documents ?? [];

  const documents = Object.fromEntries(
    DOCUMENT_KEYS.map((k) => [k, false])
  ) as Record<DocumentKey, boolean>;

  const documentWarnings: Partial<Record<DocumentKey, string>> = {};
  const documentAutoWarnings: Partial<Record<DocumentKey, string>> = {};
  const documentApprovals: Partial<Record<DocumentKey, boolean>> = {};
  const documentPaths: Partial<Record<DocumentKey, string>> = {};

  for (const doc of docs) {
    const key = doc.document_key as DocumentKey;
    documents[key] = doc.is_uploaded ?? false;
    if (doc.warning)       documentWarnings[key]     = doc.warning;
    if (doc.auto_warning)  documentAutoWarnings[key]  = doc.auto_warning;
    if (doc.is_approved)   documentApprovals[key]     = true;
    if (doc.storage_path)  documentPaths[key]         = doc.storage_path;
  }

  const statusHistory: StatusHistoryEntry[] = ((app.status_history ?? []) as Record<string, string>[])
    .map((h) => ({ status: h.status as ApplicationStatus, timestamp: h.timestamp.split("T")[0] }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return {
    id: app.id,
    userId: app.user_id ?? undefined,
    applicationNumber: app.application_number,
    name: [app.last_name, app.first_name].filter(Boolean).join(" "),
    email: app.email,
    status: app.status as ApplicationStatus,
    documents,
    documentWarnings:     Object.keys(documentWarnings).length     > 0 ? documentWarnings     : undefined,
    documentAutoWarnings: Object.keys(documentAutoWarnings).length > 0 ? documentAutoWarnings : undefined,
    documentApprovals:    Object.keys(documentApprovals).length    > 0 ? documentApprovals    : undefined,
    documentPaths:        Object.keys(documentPaths).length        > 0 ? documentPaths        : undefined,
    notes:       app.notes       ?? undefined,
    nationality: app.nationality ?? undefined,
    consulateId: app.consulate_id ?? undefined,
    submittedAt: (app.submitted_at ?? "").split("T")[0],
    updatedAt:   (app.updated_at  ?? "").split("T")[0],
    statusHistory,
  };
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApplicants = useCallback(async () => {
    if (!user) { setApplicants([]); return; }
    setIsLoading(true);
    setError(null);
    try {
      const url =
        user.role === "applicant"
          ? `/api/applications?userId=${encodeURIComponent(user.userId)}`
          : "/api/applications";
      const res = await fetch(url);
      if (!res.ok) throw new Error("申請データの取得に失敗しました。");
      const { data } = await res.json();
      setApplicants((data ?? []).map(mapDbToApplicant));
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const myApplication: Applicant | null =
    user?.role === "applicant"
      ? (applicants.find((a) => a.userId === user.userId) ?? null)
      : null;

  // ── 楽観的更新ヘルパー ────────────────────────────────────────

  const patchDoc = useCallback(
    (applicationId: string, documentKey: DocumentKey, updates: Record<string, unknown>) => {
      fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, documentKey, ...updates }),
      }).catch(console.error);
    },
    []
  );

  // ── ステータス変更 ────────────────────────────────────────────

  const updateStatus = useCallback(
    (id: string, status: ApplicationStatus) => {
      const today = new Date().toISOString().split("T")[0];
      setApplicants((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const history = [...(a.statusHistory ?? [])];
          if (history[history.length - 1]?.status !== status) {
            history.push({ status, timestamp: today });
          }
          return { ...a, status, statusHistory: history, updatedAt: today };
        })
      );
      fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, changedBy: user?.userId }),
      }).catch(console.error);
    },
    [user]
  );

  // ── 書類アップロード状態 ──────────────────────────────────────

  const updateDocument = useCallback(
    (id: string, key: DocumentKey, value: boolean, storagePath?: string) => {
      setApplicants((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const documentPaths = { ...(a.documentPaths ?? {}) };
          if (storagePath) documentPaths[key] = storagePath;
          else delete documentPaths[key];
          return { ...a, documents: { ...a.documents, [key]: value }, documentPaths };
        })
      );
      patchDoc(id, key, { isUploaded: value });
    },
    [patchDoc]
  );

  // ── 管理者手動警告メモ ────────────────────────────────────────

  const updateDocumentWarning = useCallback(
    (id: string, key: DocumentKey, warning: string | null) => {
      setApplicants((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const warnings  = { ...(a.documentWarnings  ?? {}) };
          const approvals = { ...(a.documentApprovals ?? {}) };
          if (warning) { warnings[key] = warning; delete approvals[key]; }
          else         { delete warnings[key]; }
          return { ...a, documentWarnings: warnings, documentApprovals: approvals };
        })
      );
      patchDoc(id, key, { warning, ...(warning ? { isApproved: false } : {}) });
    },
    [patchDoc]
  );

  // ── 書類承認 ──────────────────────────────────────────────────

  const approveDocument = useCallback(
    (id: string, key: DocumentKey) => {
      setApplicants((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const approvals = { ...(a.documentApprovals ?? {}), [key]: true };
          const warnings  = { ...(a.documentWarnings  ?? {}) };
          delete warnings[key];
          return { ...a, documentApprovals: approvals, documentWarnings: warnings };
        })
      );
      patchDoc(id, key, { isApproved: true, warning: null });
    },
    [patchDoc]
  );

  const unapproveDocument = useCallback(
    (id: string, key: DocumentKey) => {
      setApplicants((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const approvals = { ...(a.documentApprovals ?? {}) };
          delete approvals[key];
          return { ...a, documentApprovals: approvals };
        })
      );
      patchDoc(id, key, { isApproved: false });
    },
    [patchDoc]
  );

  // ── Canvas API 自動検出警告 ───────────────────────────────────

  const setAutoWarning = useCallback(
    (id: string, key: DocumentKey, warning: string | null) => {
      setApplicants((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const autoWarnings = { ...(a.documentAutoWarnings ?? {}) };
          if (warning) { autoWarnings[key] = warning; }
          else         { delete autoWarnings[key]; }
          return { ...a, documentAutoWarnings: autoWarnings };
        })
      );
      patchDoc(id, key, { autoWarning: warning });
    },
    [patchDoc]
  );

  return (
    <StoreContext.Provider
      value={{
        applicants,
        myApplication,
        isLoading,
        error,
        refresh: fetchApplicants,
        updateStatus,
        updateDocument,
        updateDocumentWarning,
        approveDocument,
        unapproveDocument,
        setAutoWarning,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
