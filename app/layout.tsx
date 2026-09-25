import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Absensi Santri",
  description: "Aplikasi absensi dan penilaian tugas santri",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
