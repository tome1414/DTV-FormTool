import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DTV Application Management",
  description: "Thailand DTV Application Document Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <I18nProvider>
          <AuthProvider>
            <StoreProvider>
              <Navbar />
              <main className="px-4 py-4 sm:p-6">{children}</main>
              <footer className="mt-8 border-t border-gray-200 py-4 px-4 sm:px-6 text-center">
                <Link href="/privacy" className="text-xs text-gray-400 hover:text-blue-500 hover:underline transition-colors">
                  プライバシーポリシー
                </Link>
              </footer>
            </StoreProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
