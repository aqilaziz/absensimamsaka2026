import { formatTanggal } from "@/lib/periode";
import type { Pengumpulan, StatusKumpul, Tugas } from "@/lib/types";

export type PengumpulanDenganTugas = Pengumpulan & { tugas: Tugas };

const STATUS_BADGE: Record<StatusKumpul, { cls: string; label: string }> = {
  sudah: { cls: "bg-emerald-100 text-emerald-700", label: "Sudah" },
  terlambat: { cls: "bg-amber-100 text-amber-700", label: "Terlambat" },
  belum: { cls: "bg-slate-100 text-slate-500", label: "Belum" },
};

export function RiwayatTugas({ rows }: { rows: PengumpulanDenganTugas[] }) {
  const sudah = rows.filter((r) => r.status !== "belum").length;
  const terlambat = rows.filter((r) => r.status === "terlambat").length;
  const berNilai = rows.filter((r) => r.nilai != null);
  const rata =
    berNilai.length > 0
      ? Math.round(
          (berNilai.reduce((a, r) => a + Number(r.nilai), 0) / berNilai.length) * 10,
        ) / 10
      : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Total <b>{rows.length}</b> · Sudah <b>{sudah}</b> · Terlambat{" "}
        <b>{terlambat}</b>
        {rata != null && (
          <>
            {" "}
            · Rata-rata nilai <b>{rata}</b>
          </>
        )}
      </p>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th">Tugas</th>
              <th className="th w-32">Tgl Diberikan</th>
              <th className="th w-28 text-center">Status</th>
              <th className="th w-24 text-center">Nilai</th>
              <th className="th">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const badge = STATUS_BADGE[r.status];
              return (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="td font-medium text-slate-900">
                    {r.tugas.judul}
                  </td>
                  <td className="td text-slate-500">
                    {formatTanggal(r.tugas.tgl_diberikan)}
                  </td>
                  <td className="td text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="td text-center">
                    {r.nilai != null
                      ? `${r.nilai}${r.tugas.nilai_maks ? ` / ${r.tugas.nilai_maks}` : ""}`
                      : "—"}
                  </td>
                  <td className="td text-slate-500">{r.catatan ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
