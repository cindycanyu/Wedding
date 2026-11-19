import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "H.S. & C.H. Wedding Workbook",
  description: "多人协作婚礼筹备工作台",
};

// Without this, iOS Safari keeps fixed-position elements (the 留言/所有抽屉)
// sized to the layout viewport when the on-screen keyboard opens, so the
// bottom of the panel — the chat input, here — ends up hidden behind the
// keyboard instead of the layout actually shrinking to fit above it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
