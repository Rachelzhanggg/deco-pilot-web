import type { Metadata } from "next";
import "./globals.css";

// 1. 设置浏览器标签栏显示的标题和图标信息
export const metadata: Metadata = {
  title: "SPECURO | Professional Sourcing Archive",
  description: "AI-powered furniture specification library for interior designers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* 强制网页在不同设备上缩放正常 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="antialiased bg-white">
        {/* children 就是 page.tsx 里的内容 */}
        {children}
      </body>
    </html>
  );
}
