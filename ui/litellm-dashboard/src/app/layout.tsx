import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import AntdGlobalProvider from "@/contexts/AntdGlobalProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Silinex Dashboard",
  description: "Silinex Proxy Admin UI",
  icons: { icon: "./favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdGlobalProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </AntdGlobalProvider>
      </body>
    </html>
  );
}
