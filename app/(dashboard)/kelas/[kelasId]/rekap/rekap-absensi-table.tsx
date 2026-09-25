import { NamaSantriLink } from "@/components/nama-santri-link";
import { PersenBadge } from "@/components/persen-badge";
import type { RekapAbsensiRow } from "@/lib/types";

export function RekapAbsensiTable({ rows }: { rows: RekapAbsensiRow[] }) {
  const avg =
    rows.length > 0
      ? Math.round(
          (rows.reduce((a, r) => a + Number(r.persen_hadir), 0) / rows.length) * 10,
        ) / 10
      : 0;

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full min-w-[720px]">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="th w-12">No</th>
            <th className="th">Nama Santri</th>
            <th className="th w-20 text-center">Hadir</th>
            <th className="th w-20 text-center">Sakit</th>
            <th className="th w-20 text-center">Izin</th>
            <th className="th w-20 text-center">Alpha</th>
            <th className="th w-24 text-center">Total Hari</th>
            <th className="th w-24 text-center">% Hadir</th>
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
              <td className="td text-center">{r.hadir}</td>
              <td className="td text-center">{r.sakit}</td>
              <td className="td text-center">{r.izin}</td>
              <td className="td text-center">{r.alpha}</td>
              <td className="td text-center">{r.total_hari}</td>
              <td className="td text-center">
                <PersenBadge value={Number(r.persen_hadir)} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-slate-200 bg-slate-50">
          <tr>
            <td className="td" colSpan={7}>
              <span className="font-semibold">Rata-rata kelas</span>
            </td>
            <td className="td text-center">
              <PersenBadge value={avg} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
