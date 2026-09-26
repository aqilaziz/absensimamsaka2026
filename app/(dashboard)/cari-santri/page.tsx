import { SearchSantri } from "./search-santri";
import { Keyboard } from "lucide-react";

/**
 * Halaman cari santri (server shell).
 *
 * Daftar hasil TIDAK lagi dirender di server saat tombol ditekan; komponen
 * `SearchSantri` (client) memanggil `/api/santri` dan menampilkan hasil begitu
 * huruf diketik. Karena itu halaman ini tidak menjalankan query apa pun —
 * halaman terbuka seketika.
 */
export default function CariSantriPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Cari Santri
        </h1>
        <p className="text-sm text-slate-500">
          Berdasarkan nama atau Nomor Induk Santri (NIS).
        </p>
      </div>

      <SearchSantri />

      <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-800 ring-1 ring-emerald-100">
        <Keyboard className="mt-0.5 shrink-0" size={14} />
        <p>
          Hasil muncul otomatis mulai 2 karakter pertama. Gunakan opsi{" "}
          <strong>Termasuk arsip</strong> untuk mencari santri pada tahun
          pelajaran yang sudah diarsipkan.
        </p>
      </div>
    </div>
  );
}
