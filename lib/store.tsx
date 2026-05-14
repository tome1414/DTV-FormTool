"use client";

import React, { createContext, useContext, useState } from "react";

export type ApplicationStatus =
  | "確認待ち"
  | "レビュー中"
  | "書類不足"
  | "提出準備完了"
  | "大使館提出済み";

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
  applicationNumber: string;
  name: string;
  email: string;
  status: ApplicationStatus;
  documents: Record<DocumentKey, boolean>;
  documentWarnings?: Partial<Record<DocumentKey, string>>;
  notes?: string;
  submittedAt: string;
  updatedAt: string;
}

const mockApplicants: Applicant[] = [
  {
    id: "1",
    applicationNumber: "DTV-2024-0001",
    name: "田中 太郎",
    email: "tanaka@example.com",
    status: "提出準備完了",
    documents: {
      passport: true, bankStatement: true, photo: true,
      driverLicense: true, flightTicket: true, pgaLicense: false,
      acceptanceLetter: true, invoice: true, existingPdfBundle: true,
    },
    documentWarnings: {
      passport: "余白が多いです。申請サイトで読み込みエラーになる可能性があります。トリミングして再提出をお願いします。",
    },
    submittedAt: "2024-03-01",
    updatedAt: "2024-03-12",
  },
  {
    id: "2",
    applicationNumber: "DTV-2024-0002",
    name: "鈴木 花子",
    email: "suzuki@example.com",
    status: "レビュー中",
    documents: {
      passport: true, bankStatement: true, photo: true,
      driverLicense: false, flightTicket: true, pgaLicense: true,
      acceptanceLetter: true, invoice: true, existingPdfBundle: true,
    },
    submittedAt: "2024-03-03",
    updatedAt: "2024-03-14",
  },
  {
    id: "3",
    applicationNumber: "DTV-2024-0003",
    name: "佐藤 次郎",
    email: "sato@example.com",
    status: "書類不足",
    documents: {
      passport: true, bankStatement: false, photo: true,
      driverLicense: false, flightTicket: false, pgaLicense: false,
      acceptanceLetter: false, invoice: false, existingPdfBundle: false,
    },
    notes: "残高証明書が不足しています。再提出をお願いします。",
    submittedAt: "2024-03-05",
    updatedAt: "2024-03-11",
  },
  {
    id: "4",
    applicationNumber: "DTV-2024-0004",
    name: "山田 美咲",
    email: "yamada@example.com",
    status: "確認待ち",
    documents: {
      passport: true, bankStatement: true, photo: true,
      driverLicense: true, flightTicket: false, pgaLicense: false,
      acceptanceLetter: false, invoice: false, existingPdfBundle: false,
    },
    submittedAt: "2024-03-07",
    updatedAt: "2024-03-07",
  },
  {
    id: "5",
    applicationNumber: "DTV-2024-0005",
    name: "伊藤 健一",
    email: "ito@example.com",
    status: "大使館提出済み",
    documents: {
      passport: true, bankStatement: true, photo: true,
      driverLicense: true, flightTicket: true, pgaLicense: true,
      acceptanceLetter: true, invoice: true, existingPdfBundle: true,
    },
    submittedAt: "2024-02-20",
    updatedAt: "2024-03-01",
  },
  {
    id: "6",
    applicationNumber: "DTV-2024-0006",
    name: "渡辺 良子",
    email: "watanabe@example.com",
    status: "確認待ち",
    documents: {
      passport: true, bankStatement: true, photo: true,
      driverLicense: false, flightTicket: true, pgaLicense: false,
      acceptanceLetter: false, invoice: false, existingPdfBundle: false,
    },
    submittedAt: "2024-03-08",
    updatedAt: "2024-03-08",
  },
  {
    id: "7",
    applicationNumber: "DTV-2024-0007",
    name: "中村 勇気",
    email: "nakamura@example.com",
    status: "書類不足",
    documents: {
      passport: false, bankStatement: false, photo: true,
      driverLicense: false, flightTicket: false, pgaLicense: false,
      acceptanceLetter: false, invoice: false, existingPdfBundle: false,
    },
    notes: "パスポートコピーおよび残高証明書が未提出です。",
    submittedAt: "2024-03-09",
    updatedAt: "2024-03-13",
  },
  {
    id: "8",
    applicationNumber: "DTV-2024-0008",
    name: "小林 恵",
    email: "kobayashi@example.com",
    status: "レビュー中",
    documents: {
      passport: true, bankStatement: true, photo: true,
      driverLicense: true, flightTicket: true, pgaLicense: true,
      acceptanceLetter: false, invoice: true, existingPdfBundle: true,
    },
    submittedAt: "2024-03-10",
    updatedAt: "2024-03-15",
  },
];

interface StoreContextType {
  applicants: Applicant[];
  updateStatus: (id: string, status: ApplicationStatus) => void;
  updateDocument: (id: string, key: DocumentKey, value: boolean) => void;
  updateDocumentWarning: (id: string, key: DocumentKey, warning: string | null) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [applicants, setApplicants] = useState<Applicant[]>(mockApplicants);

  const today = () => new Date().toISOString().split("T")[0];

  const updateStatus = (id: string, status: ApplicationStatus) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status, updatedAt: today() } : a))
    );
  };

  const updateDocument = (id: string, key: DocumentKey, value: boolean) => {
    setApplicants((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, documents: { ...a.documents, [key]: value }, updatedAt: today() }
          : a
      )
    );
  };

  const updateDocumentWarning = (id: string, key: DocumentKey, warning: string | null) => {
    setApplicants((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const warnings = { ...(a.documentWarnings ?? {}) };
        if (warning) warnings[key] = warning;
        else delete warnings[key];
        return { ...a, documentWarnings: warnings, updatedAt: today() };
      })
    );
  };

  return (
    <StoreContext.Provider value={{ applicants, updateStatus, updateDocument, updateDocumentWarning }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
