import type { Metadata, Viewport } from "next";
import { DaftarServiceWorker } from "@/components/service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Absensi Santri",
  description: "Aplikasi absensi dan penilaian tugas santri",
  applicationName: "Absensi Santri",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Absensi Santri",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#022c22",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {children}
        <DaftarServiceWorker />
      </body>
    </html>
  );
}
