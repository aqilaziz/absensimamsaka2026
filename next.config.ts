import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },

  experimental: {
    /**
     * Router Cache (cache sisi klien).
     *
     * Semua halaman dashboard bersifat dinamis (memakai cookie sesi Supabase),
     * sehingga tanpa setelan ini Next.js TIDAK menyimpan hasil render di memori
     * klien dan memuat ulang data setiap kali menu diklik.
     *
     * `dynamic: 30` → halaman dinamis boleh dipakai ulang 30 detik sebelum
     * diambil ulang di latar belakang (navigasi klik jadi terasa instan).
     */
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
    // Impor per-ikon/per-fungsi agar bundle lebih kecil.
    optimizePackageImports: ["lucide-react", "date-fns"],
  },

  // Paket berat cukup di-require saat dipakai, tidak dibundel ke server.
  serverExternalPackages: ["xlsx"],
};

export default nextConfig;
