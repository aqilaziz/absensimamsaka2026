import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export interface NilaiSantriRow {
  id: string;
  tanggal: string;
  jenis: string;
  nilai: number;
  catatan: string | null;
  mapel: string;
}

function tanggalRingkas(iso: string) {
  return format(new Date(iso + "T00:00:00"), "d MMM yyyy", { locale: localeId });
}

export function RiwayatNilaiSantri({ rows }: { rows: NilaiSantriRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="card text-sm text-slate-500">
        Belum ada nilai harian untuk santri ini.
      </p>
    );
  }

  const nilaiArr = rows.map((r) => Number(r.nilai));
  const rata = Math.round((nilaiArr.reduce((a, b) => a + b, 0) / nilaiArr.length) * 10) / 10;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Penilaian
          </p>
          <p className="text-lg font-bold text-slate-900">{rows.length}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Rata-rata
          </p>
          <p className="text-lg font-bold text-emerald-700">{rata}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Tertinggi
          </p>
          <p className="text-lg font-bold text-slate-900">
            {Math.max(...nilaiArr)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Terendah
          </p>
          <p className="text-lg font-bold text-slate-900">
            {Math.min(...nilaiArr)}
          </p>
        </div>
      </div>

      {/* HP: kartu */}
      <ul className="space-y-2 sm:hidden">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{r.mapel}</p>
                <p className="text-[11px] text-slate-500">
                  {tanggalRingkas(r.tanggal)} · {r.jenis}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700">
                {r.nilai}
              </span>
            </div>
            {r.catatan && (
              <p className="mt-1 text-xs text-slate-500">{r.catatan}</p>
            )}
          </li>
        ))}
      </ul>

      {/* Desktop: tabel */}
      <div className="hidden overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200 sm:block">
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th w-40">Tanggal</th>
              <th className="th">Mata Pelajaran</th>
              <th className="th w-24">Jenis</th>
              <th className="th w-20 text-center">Nilai</th>
              <th className="th">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60">
                <td className="td whitespace-nowrap text-slate-600">
                  {tanggalRingkas(r.tanggal)}
                </td>
                <td className="td font-medium text-slate-900">{r.mapel}</td>
                <td className="td text-slate-600">{r.jenis}</td>
                <td className="td text-center font-semibold text-slate-900">
                  {r.nilai}
                </td>
                <td className="td text-slate-500">{r.catatan ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
