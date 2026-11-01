import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mirror-Ting · 현재 버전",
  description: "개발 중인 원본 화면으로 시나리오 설계까지 체험해보세요.",
  icons: {
    icon: [{ url: "/icons/favicon.ico", sizes: "any" }, { url: "/icons/app-icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: "/icons/favicon.ico",
    apple: "/icons/app-icon-180.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
