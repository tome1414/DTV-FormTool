import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "DTV申請管理システム",
  description: "タイランドDTV申請書類管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        <StoreProvider>
          <Navbar />
          <main className="p-6">{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
