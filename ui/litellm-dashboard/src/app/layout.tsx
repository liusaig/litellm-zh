import type { Metadata } from "next";
import "./globals.css";

import AntdGlobalProvider from "@/contexts/AntdGlobalProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  title: "Silinex Dashboard",
  description: "Silinex Proxy Admin UI",
  icons: { icon: "https://cloud.siliconflow.cn/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AntdGlobalProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </AntdGlobalProvider>
      </body>
    </html>
  );
}
