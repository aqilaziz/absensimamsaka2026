import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SantriTabs } from "./santri-tabs";
import { GrafikBulanan } from "./grafik-bulanan";
import { KalenderAbsensi } from "./kalender-absensi";
import { RiwayatTugas, type PengumpulanDenganTugas } from "./riwayat-tugas";
import { RiwayatTahun } from "./riwayat-tahun";
import { NisForm } from "./nis-form";
import { formatTanggal } from "@/lib/periode";
import type {
  Absensi,
  BulananSiswa,
  KelasDetail,
  RiwayatTahunRow,
  Siswa,
  StatusAbsensi,
} from "@/lib/types";

type SiswaDetail = Siswa & { kelas: KelasDetail };

export default async function SantriDetailPage({
  params,
}: {
  params: Promise<{ siswaId: string }>;
}) {
  const { siswaId } = await params;
  const supabase = await createClient();

  const { data: siswaData } = await supabase
    .from("siswa")
    .select("*, kelas(*, tahun_pelajaran(*))")
    .eq("id", siswaId)
    .maybeSingle();

  if (!siswaData) notFound();
  const santri = siswaData as unknown as SiswaDetail;
  const aktif = santri.kelas.tahun_pelajaran.status === "aktif";

  const [
    { data: bulananData },
    { data: absensiData },
    { data: pengumpulanData },
    { data: riwayatData },
  ] = await Promise.all([
    supabase.rpc("rekap_bulanan_siswa", { p_siswa_id: siswaId }),
    supabase
      .from("absensi")
      .select("*")
      .eq("siswa_id", siswaId)
      .order("tanggal", { ascending: false }),
    supabase
      .from("pengumpulan")
      .select("*, tugas(*)")
      .eq("siswa_id", siswaId)
      .order("tgl_diberikan", { referencedTable: "tugas", ascending: false }),
    santri.nis
      ? supabase.rpc("riwayat_santri_by_nis", { p_nis: santri.nis })
      : Promise.resolve({ data: [] }),
  ]);

  const bulanan = (bulananData ?? []) as BulananSiswa[];
  const absensiList = (absensiData ?? []) as Absensi[];
  const pengumpulanList = (pengumpulanData ?? []) as unknown as PengumpulanDenganTugas[];
  const riwayat = (riwayatData ?? []) as RiwayatTahunRow[];

  const hitung = (s: StatusAbsensi) =>
    absensiList.filter((a) => a.status === s).length;
  const totalHari = absensiList.length;
  const persenHadir =
    totalHari > 0
      ? Math.round((hitung("hadir") / totalHari) * 1000) / 10
      : 0;

  const statusBadge: Record<StatusAbsensi, string> = {
    hadir: "bg-emerald-100 text-emerald-700",
    sakit: "bg-amber-100 text-amber-700",
    izin: "bg-sky-100 text-sky-700",
    alpha: "bg-red-100 text-red-700",
  };

  const absensiKonten = (
    <div className="space-y-4">
      <GrafikBulanan data={bulanan} />
      <KalenderAbsensi records={absensiList} />
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[480px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th">Tanggal</th>
              <th className="th w-28 text-center">Status</th>
              <th className="th">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {absensiList.slice(0, 60).map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/60">
                <td className="td text-slate-600">{formatTanggal(a.tanggal)}</td>
                <td className="td text-center">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[a.status]}`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="td text-slate-500">{a.keterangan ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {absensiList.length > 60 && (
          <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400">
            Menampilkan 60 catatan terbaru dari {absensiList.length}.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header profil */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              href={`/kelas/${santri.kelas_id}`}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              ← {santri.kelas.nama}
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {santri.nama}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {santri.kelas.nama} · {santri.kelas.tahun_pelajaran.nama}
              {aktif ? " (aktif)" : " (arsip)"}
              {santri.nis && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  NIS {santri.nis}
                </span>
              )}
            </p>
          </div>
          {aktif && <NisForm siswaId={santri.id} nis={santri.nis} />}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="% Hadir" value={`${persenHadir}%`} tone="emerald" />
          <StatCard label="Sakit" value={String(hitung("sakit"))} tone="amber" />
          <StatCard label="Izin" value={String(hitung("izin"))} tone="sky" />
          <StatCard label="Alpha" value={String(hitung("alpha"))} tone="red" />
        </div>
      </div>

      <SantriTabs
        absensi={absensiKonten}
        tugas={<RiwayatTugas rows={pengumpulanList} />}
        lintas={
          <RiwayatTahun
            rows={riwayat}
            nis={santri.nis}
            siswaId={santri.id}
            aktif={aktif}
          />
        }
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "amber" | "sky" | "red";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    sky: "bg-sky-50 text-sky-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <div className={`rounded-xl px-4 py-3 ${tones[tone]}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
}
