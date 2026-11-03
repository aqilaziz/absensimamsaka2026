import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export interface RiwayatNilaiItem {
  tanggal: string;
  mapel_id: string;
  mapel: string;
  jenis: string;
  jumlah: number;
  rata: number;
}

/**
 * Daftar penilaian yang pernah disimpan pada kelas ini. Klik salah satu
 * untuk membuka tanggal & jenis itu di formulir nilai (untuk diedit).
 */
export function RiwayatNilai({
  kelasId,
  items,
  aktifTanggal,
  aktifMapel,
  aktifJenis,
}: {
  kelasId: string;
  items: RiwayatNilaiItem[];
  aktifTanggal: string;
  aktifMapel: string;
  aktifJenis: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
        Belum ada nilai tersimpan. Isi nilai di atas lalu tekan{" "}
        <b className="text-slate-700">Simpan Nilai</b> — riwayatnya akan muncul
        di sini.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">
          Riwayat Penilaian
        </p>
        <p className="text-[11px] text-slate-400">
          Klik salah satu untuk membuka &amp; mengedit
        </p>
      </div>

      <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
        {items.map((it) => {
          const aktif =
            it.tanggal === aktifTanggal &&
            it.mapel_id === aktifMapel &&
            it.jenis === aktifJenis;
          return (
            <li key={`${it.tanggal}-${it.mapel_id}-${it.jenis}`}>
              <Link
                href={`/kelas/${kelasId}/nilai?tanggal=${it.tanggal}&mapel=${it.mapel_id}&jenis=${encodeURIComponent(it.jenis)}`}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 transition ${
                  aktif ? "bg-emerald-50" : "hover:bg-slate-50"
                }`}
              >
                <span className="w-full text-xs font-medium text-slate-500 sm:w-32 sm:text-sm sm:text-slate-700">
                  {format(new Date(it.tanggal + "T00:00:00"), "d MMM yyyy", {
                    locale: localeId,
                  })}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                  {it.mapel}
                </span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {it.jenis}
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  {it.jumlah} santri
                </span>
                <span className="w-10 shrink-0 text-right text-sm font-semibold text-slate-900">
                  {it.rata}
                </span>
                {aktif && (
                  <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    dibuka
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
