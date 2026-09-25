import { NamaSantriLink } from "@/components/nama-santri-link";
import { PersenBadge } from "@/components/persen-badge";
import type { RekapTugasRow } from "@/lib/types";

export function RekapTugasTable({ rows }: { rows: RekapTugasRow[] }) {
  const avgKumpul =
    rows.length > 0
      ? Math.round(
          (rows.reduce((a, r) => a + Number(r.persen_kumpul), 0) / rows.length) * 10,
        ) / 10
      : 0;
  const denganNilai = rows.filter((r) => r.rata_nilai != null);
  const avgNilai =
    denganNilai.length > 0
      ? Math.round(
          (denganNilai.reduce((a, r) => a + Number(r.rata_nilai), 0) /
            denganNilai.length) *
            10,
        ) / 10
      : null;

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full min-w-[720px]">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="th w-12">No</th>
            <th className="th">Nama Santri</th>
            <th className="th w-20 text-center">Total</th>
            <th className="th w-20 text-center">Sudah</th>
            <th className="th w-20 text-center">Belum</th>
            <th className="th w-24 text-center">Terlambat</th>
            <th className="th w-24 text-center">% Kumpul</th>
            <th className="th w-28 text-center">Rata-rata Nilai</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={r.siswa_id} className="hover:bg-slate-50/60">
              <td className="td text-slate-400">{i + 1}</td>
              <td className="td">
                <NamaSantriLink id={r.siswa_id} nama={r.nama} />
                {r.nis && (
                  <span className="ml-2 text-xs text-slate-400">{r.nis}</span>
                )}
              </td>
              <td className="td text-center">{r.total_tugas}</td>
              <td className="td text-center">{r.sudah}</td>
              <td className="td text-center">{r.belum}</td>
              <td className="td text-center">{r.terlambat}</td>
              <td className="td text-center">
                <PersenBadge value={Number(r.persen_kumpul)} />
              </td>
              <td className="td text-center">
                {r.rata_nilai != null ? r.rata_nilai : "—"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-slate-200 bg-slate-50">
          <tr>
            <td className="td" colSpan={6}>
              <span className="font-semibold">Rata-rata kelas</span>
            </td>
            <td className="td text-center">
              <PersenBadge value={avgKumpul} />
            </td>
            <td className="td text-center font-semibold">
              {avgNilai != null ? avgNilai : "—"}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
