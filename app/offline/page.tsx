import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Tidak Ada Koneksi · Absensi Santri",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <WifiOff size={30} />
      </span>
      <h1 className="text-lg font-semibold text-slate-800">
        Tidak ada koneksi internet
      </h1>
      <p className="max-w-sm text-sm text-slate-500">
        Halaman ini belum tersimpan di perangkat. Sambungkan internet lalu coba
        buka kembali.
      </p>
      <Link href="/" className="btn-primary">
        Coba lagi
      </Link>
    </main>
  );
}
