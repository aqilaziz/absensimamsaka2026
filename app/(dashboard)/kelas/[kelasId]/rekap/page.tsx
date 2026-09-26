import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KelasHeader } from "@/components/kelas-header";
import { PeriodeSelector } from "@/components/periode-selector";
import { ExportExcelButton } from "@/components/export-excel-button";
import { RekapAbsensiTable } from "./rekap-absensi-table";
import { RekapTugasTable } from "./rekap-tugas-table";
import { hitungRentang, type Periode } from "@/lib/periode";
import type { KelasDetail, RekapAbsensiRow, RekapTugasRow } from "@/lib/types";

export default async function RekapPage({
  params,
  searchParams,
}: {
  params: Promise<{ kelasId: string }>;
  searchParams: Promise<{ tab?: string; periode?: string; nilai?: string }>;
}) {
  const { kelasId } = await params;
  const sp = await searchParams;

  const tab = sp.tab === "tugas" ? "tugas" : "absensi";
  const periode: Periode =
    sp.periode === "semester" || sp.periode === "tahun" ? sp.periode : "bulan";
  const nilai = sp.nilai;

  const supabase = await createClient();

  const { data: kelasData } = await supabase
    .from("kelas")
    .select(
      "*, tahun_pelajaran(*), semester:semester!kelas_semester_id_fkey(*)",
    )
    .eq("id", kelasId)
    .maybeSingle();

  if (!kelasData) notFound();
  const kelas = kelasData as unknown as KelasDetail;

  const rentang = hitungRentang(periode, nilai, kelas.tahun_pelajaran);

  let absensiRows: RekapAbsensiRow[] = [];
  let tugasRows: RekapTugasRow[] = [];

  if (tab === "absensi") {
    const { data } = await supabase.rpc("rekap_absensi", {
      p_kelas_id: kelasId,
      p_dari: rentang.dari,
      p_sampai: rentang.sampai,
    });
    absensiRows = (data ?? []) as RekapAbsensiRow[];
  } else {
    const { data } = await supabase.rpc("rekap_tugas_siswa", {
      p_kelas_id: kelasId,
      p_dari: rentang.dari,
      p_sampai: rentang.sampai,
    });
    tugasRows = (data ?? []) as RekapTugasRow[];
  }

  const exportRows =
    tab === "absensi"
      ? absensiRows.map((r, i) => ({
          No: i + 1,
          Nama: r.nama,
          NIS: r.nis ?? "",
          Hadir: r.hadir,
          Sakit: r.sakit,
          Izin: r.izin,
          Alpha: r.alpha,
          "Total Hari": r.total_hari,
          "% Hadir": r.persen_hadir,
        }))
      : tugasRows.map((r, i) => ({
          No: i + 1,
          Nama: r.nama,
          NIS: r.nis ?? "",
          "Total Tugas": r.total_tugas,
          Sudah: r.sudah,
          Belum: r.belum,
          Terlambat: r.terlambat,
          "% Kumpul": r.persen_kumpul,
          "Rata-rata Nilai": r.rata_nilai,
        }));

  return (
    <div className="space-y-6">
      <KelasHeader kelas={kelas} active="rekap" />

      <PeriodeSelector
        kelasId={kelasId}
        tab={tab}
        periode={periode}
        nilai={nilai}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{rentang.label}</span>{" "}
          <span className="text-slate-400">
            ({rentang.dari} s.d. {rentang.sampai})
          </span>
        </p>
        <ExportExcelButton
          rows={exportRows}
          filename={`rekap-${tab}-${kelas.nama.replace(/\s+/g, "-")}-${rentang.dari}_${rentang.sampai}.xlsx`}
          sheetName={tab === "absensi" ? "Absensi" : "Tugas"}
        />
      </div>

      {tab === "absensi" ? (
        <RekapAbsensiTable rows={absensiRows} />
      ) : (
        <RekapTugasTable rows={tugasRows} />
      )}
    </div>
  );
}
