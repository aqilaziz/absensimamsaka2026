import { NamaSantriLink } from "@/components/nama-santri-link";

export interface RekapNilaiRow {
  siswa_id: string;
  nama: string;
  nis: string | null;
  jumlah: number;
  rata: number | null;
  tertinggi: number | null;
  terendah: number | null;
}

export function RekapNilaiTable({ rows }: { rows: RekapNilaiRow[] }) {
  const dinilai = rows.filter((r) => r.rata != null);
  const rataKelas =
    dinilai.length > 0
      ? Math.round(
          (dinilai.reduce((a, r) => a + (r.rata ?? 0), 0) / dinilai.length) * 10,
        ) / 10
      : null;

  if (rows.length === 0) {
    return (
      <p className="card text-sm text-slate-500">
        Belum ada santri di kelas ini.
      </p>
    );
  }

  return (
    <>
      {/* HP: kartu per santri */}
      <ul className="space-y-2 sm:hidden">
        {rows.map((r, i) => (
          <li
            key={r.siswa_id}
            className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="flex min-w-0 items-baseline gap-1.5 text-sm font-medium leading-snug">
                <span className="shrink-0 text-[11px] font-normal text-slate-400">
                  {i + 1}
                </span>
                <NamaSantriLink id={r.siswa_id} nama={r.nama} />
              </p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-bold ${
                  r.rata == null
                    ? "bg-slate-100 text-slate-400"
                    : r.rata >= 80
                      ? "bg-emerald-50 text-emerald-700"
                      : r.rata >= 70
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                }`}
              >
                {r.rata ?? "—"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {r.jumlah} penilaian
              {r.tertinggi != null && ` · tertinggi ${r.tertinggi}`}
              {r.terendah != null && ` · terendah ${r.terendah}`}
            </p>
          </li>
        ))}
      </ul>

      {/* Tablet/desktop: tabel */}
      <div className="hidden overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200 sm:block">
        <table className="w-full min-w-[620px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th w-12">No</th>
              <th className="th">Nama Santri</th>
              <th className="th w-24 text-center">NIS</th>
              <th className="th w-28 text-center">Jumlah Nilai</th>
              <th className="th w-28 text-center">Rata-rata</th>
              <th className="th w-28 text-center">Tertinggi</th>
              <th className="th w-28 text-center">Terendah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr key={r.siswa_id} className="hover:bg-slate-50/60">
                <td className="td text-slate-400">{i + 1}</td>
                <td className="td">
                  <NamaSantriLink id={r.siswa_id} nama={r.nama} />
                </td>
                <td className="td text-center text-slate-500">
                  {r.nis ?? "—"}
                </td>
                <td className="td text-center">{r.jumlah}</td>
                <td className="td text-center font-semibold text-slate-900">
                  {r.rata ?? "—"}
                </td>
                <td className="td text-center text-slate-600">
                  {r.tertinggi ?? "—"}
                </td>
                <td className="td text-center text-slate-600">
                  {r.terendah ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
          {rataKelas != null && (
            <tfoot className="border-t border-slate-200 bg-slate-50">
              <tr>
                <td className="td" />
                <td className="td font-semibold text-slate-900">
                  Rata-rata Kelas
                </td>
                <td className="td" />
                <td className="td" />
                <td className="td text-center font-bold text-emerald-700">
                  {rataKelas}
                </td>
                <td className="td" />
                <td className="td" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </>
  );
}
