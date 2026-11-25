import type { MetadataRoute } from "next";

// Makes the site installable as a home-screen app (PWA): opens full-screen
// without the browser's address bar, with its own icon and name. No
// service worker on purpose — the data is live and shared, so an offline
// cache would only risk showing stale lists.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "H.S. & C.H. Wedding Workbook",
    short_name: "婚礼筹备",
    description: "多人协作婚礼筹备工作台",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FBF0F3",
    theme_color: "#FBF0F3",
    lang: "zh-CN",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
