import type { MetadataRoute } from "next";

/**
 * Manifest PWA (Progressive Web App).
 * Dibuat lewat app/manifest.ts sehingga otomatis tersaji di /manifest.webmanifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Absensi Santri",
    short_name: "Absensi",
    description:
      "Aplikasi absensi, tugas, dan rekap santri untuk madrasah/pondok.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#022c22",
    lang: "id",
    dir: "ltr",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
