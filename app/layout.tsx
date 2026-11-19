import type { Metadata, Viewport } from "next";
import { Playfair_Display, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font instead of a <link> to fonts.googleapis.com —
// Next fetches these once at build time and serves them from our own
// deployment, so visitors don't need to reach Google's font CDN at all
// (which is blocked in mainland China, among other places). Same families,
// same weights/styles as before; look is unchanged for everyone who could
// already load Google Fonts.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "H.S. & C.H. Wedding Workbook",
  description: "多人协作婚礼筹备工作台",
  // The site is readable by anyone with the link, but it's not meant to be
  // discoverable — tell every search engine not to index or crawl it.
  robots: { index: false, follow: false },
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
    <html lang="zh-CN" className={`${playfair.variable} ${cormorant.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
