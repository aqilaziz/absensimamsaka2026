import Link from "next/link";
import { Lock } from "lucide-react";
import { PersenBadge } from "@/components/persen-badge";
import { NisForm } from "./nis-form";
import type { RiwayatTahunRow } from "@/lib/types";

export function RiwayatTahun({
  rows,
  nis,
  siswaId,
  aktif,
}: {
  rows: RiwayatTahunRow[];
  nis: string | null;
  siswaId: string;
  aktif: boolean;
}) {
  if (!nis) {
    return (
      <div className="card max-w-xl space-y-3">
        <p className="text-sm font-semibold text-amber-700">
          NIS belum diisi
        </p>
        <p className="text-sm text-slate-600">
          Isi Nomor Induk Santri agar riwayat santri ini tersambung lintas tahun
          pelajaran (mis. dari kelas X ke XI ke XII).
        </p>
        {aktif && <NisForm siswaId={siswaId} nis={nis} />}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="card text-sm text-slate-500">
        Belum ada riwayat dengan NIS {nis}.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full min-w-[760px]">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="th">Tahun</th>
            <th className="th">Kelas</th>
            <th className="th w-24 text-center">% Hadir</th>
            <th className="th w-16 text-center">S</th>
            <th className="th w-16 text-center">I</th>
            <th className="th w-16 text-center">A</th>
            <th className="th w-24 text-center">Tugas</th>
            <th className="th w-28 text-center">Rata-rata Nilai</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.siswa_id} className="hover:bg-slate-50/60">
              <td className="td">
                <Link
                  href={`/santri/${r.siswa_id}`}
                  className="font-medium text-slate-900 hover:text-emerald-700"
                >
                  {r.tahun}
                </Link>
                {r.status_tahun === "arsip" && (
                  <Lock size={12} className="ml-1.5 inline text-slate-400" />
                )}
              </td>
              <td className="td">{r.kelas}</td>
              <td className="td text-center">
                <PersenBadge value={Number(r.persen_hadir)} />
              </td>
              <td className="td text-center">{r.sakit}</td>
              <td className="td text-center">{r.izin}</td>
              <td className="td text-center">{r.alpha}</td>
              <td className="td text-center">
                {r.tugas_sudah}/{r.total_tugas}
              </td>
              <td className="td text-center">
                {r.rata_nilai != null ? r.rata_nilai : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
