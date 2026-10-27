import { formatTanggalPanjang } from "@/lib/periode";

export interface JurnalRekapRow {
  id: string;
  tanggal: string;
  judul: string | null;
  jam_mulai: number | null;
  jam_selesai: number | null;
  topik: string | null;
  materi: string | null;
  kegiatan: string | null;
  catatan: string | null;
}

/** "Jam ke-3 – 4" atau "—" bila belum diisi. */
export function labelJam(r: {
  jam_mulai: number | null;
  jam_selesai: number | null;
}): string {
  if (r.jam_mulai == null && r.jam_selesai == null) return "—";
  if (r.jam_mulai != null && r.jam_selesai != null)
    return `${r.jam_mulai}–${r.jam_selesai}`;
  return String(r.jam_mulai ?? r.jam_selesai);
}

export function RekapJurnalTable({ rows }: { rows: JurnalRekapRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="card text-sm text-slate-500">
        Belum ada jurnal pada periode ini.
      </p>
    );
  }

  return (
    <>
      {/* ===== HP: kartu per pertemuan ===== */}
      <ul className="space-y-2 sm:hidden">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-snug text-slate-900">
                {r.judul?.trim() || `Pertemuan ${formatTanggalPanjang(r.tanggal)}`}
              </p>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                Jam {labelJam(r)}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {formatTanggalPanjang(r.tanggal)}
            </p>
            <dl className="mt-2 space-y-1 text-xs text-slate-600">
              {r.topik && (
                <div className="flex gap-1">
                  <dt className="shrink-0 text-slate-400">Topik:</dt>
                  <dd className="min-w-0">{r.topik}</dd>
                </div>
              )}
              {r.materi && (
                <div className="flex gap-1">
                  <dt className="shrink-0 text-slate-400">Materi:</dt>
                  <dd className="min-w-0">{r.materi}</dd>
                </div>
              )}
              {r.kegiatan && (
                <div className="flex gap-1">
                  <dt className="shrink-0 text-slate-400">Metode:</dt>
                  <dd className="min-w-0">{r.kegiatan}</dd>
                </div>
              )}
              {r.catatan && (
                <div className="flex gap-1">
                  <dt className="shrink-0 text-slate-400">Catatan:</dt>
                  <dd className="min-w-0">{r.catatan}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>

      {/* ===== Tablet/desktop: tabel ===== */}
      <div className="hidden overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200 sm:block">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th w-12">No</th>
              <th className="th w-40">Tanggal</th>
              <th className="th w-20 text-center">Jam</th>
              <th className="th">Judul Pertemuan</th>
              <th className="th">Topik</th>
              <th className="th">Materi / Sub-topik</th>
              <th className="th w-32">Metode</th>
              <th className="th">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr key={r.id} className="hover:bg-slate-50/60">
                <td className="td text-slate-400">{i + 1}</td>
                <td className="td whitespace-nowrap text-slate-600">
                  {formatTanggalPanjang(r.tanggal)}
                </td>
                <td className="td text-center text-slate-600">
                  {labelJam(r)}
                </td>
                <td className="td font-medium text-slate-900">
                  {r.judul?.trim() || "—"}
                </td>
                <td className="td text-slate-600">{r.topik ?? "—"}</td>
                <td className="td text-slate-600">{r.materi ?? "—"}</td>
                <td className="td text-slate-600">{r.kegiatan ?? "—"}</td>
                <td className="td text-slate-600">{r.catatan ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
