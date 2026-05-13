import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import Navbar from "@/components/Navbar";

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
              <main className="p-6">{children}</main>
            </StoreProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
