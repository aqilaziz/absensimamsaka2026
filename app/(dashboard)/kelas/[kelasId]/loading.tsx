/**
 * Kerangka pemuatan untuk halaman kelas (absensi, tugas, rekap, santri).
 * Tanpa ini, klik tab terasa "menggantung" karena Next menahan tampilan lama
 * sampai seluruh query selesai.
 */
export default function KelasLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Baris judul kelas + badge */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-4 w-10 rounded bg-slate-100" />
        <div className="h-6 w-28 rounded-lg bg-slate-200" />
        <div className="h-4 w-20 rounded-full bg-slate-100" />
        <div className="h-4 w-16 rounded-full bg-slate-100" />
        <div className="h-4 w-24 rounded-full bg-slate-100" />
      </div>

      {/* Tab */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-slate-100" />
        ))}
      </div>

      {/* Pemilih tanggal */}
      <div className="h-10 w-72 max-w-full rounded-lg bg-white ring-1 ring-slate-200" />

      {/* Kartu sesi */}
      <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="h-3 w-28 rounded bg-slate-100" />
        <div className="h-9 w-full rounded-lg bg-slate-100" />
        <div className="flex gap-3">
          <div className="h-9 flex-1 rounded-lg bg-slate-100" />
          <div className="h-9 flex-1 rounded-lg bg-slate-100" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-slate-200" />
      </div>

      {/* Tabel santri */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="space-y-3 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-6 rounded bg-slate-100" />
              <div className="h-4 flex-1 rounded bg-slate-100" />
              <div className="h-6 w-40 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
