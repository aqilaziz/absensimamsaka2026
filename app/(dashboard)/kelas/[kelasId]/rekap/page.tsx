import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KelasHeader } from "@/components/kelas-header";
import { PeriodeSelector } from "@/components/periode-selector";
import { ExportExcelButton } from "@/components/export-excel-button";
import { ExportPdfButton } from "@/components/export-pdf-button";
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

  // Konfigurasi Export PDF
  const pdfHeaders =
    tab === "absensi"
      ? ["No", "Nama Santri", "NIS", "Hadir", "Sakit", "Izin", "Alpha", "Total", "% Hadir"]
      : ["No", "Nama Santri", "NIS", "Total", "Sudah", "Belum", "Terlambat", "% Kumpul", "Rata-rata"];

  const pdfBody =
    tab === "absensi"
      ? absensiRows.map((r, i) => [
          i + 1,
          r.nama,
          r.nis ?? "-",
          r.hadir,
          r.sakit,
          r.izin,
          r.alpha,
          r.total_hari,
          `${r.persen_hadir}%`,
        ])
      : tugasRows.map((r, i) => [
          i + 1,
          r.nama,
          r.nis ?? "-",
          r.total_tugas,
          r.sudah,
          r.belum,
          r.terlambat,
          `${r.persen_kumpul}%`,
          r.rata_nilai != null ? String(r.rata_nilai) : "—",
        ]);

  // Rata-rata kelas untuk baris footer PDF
  let pdfFooters: (string | number)[] | undefined = undefined;
  if (tab === "absensi" && absensiRows.length > 0) {
    const avgHadir =
      Math.round(
        (absensiRows.reduce((a, r) => a + Number(r.persen_hadir), 0) / absensiRows.length) * 10,
      ) / 10;
    pdfFooters = ["", "Rata-rata Kelas", "", "", "", "", "", "", `${avgHadir}%`];
  } else if (tab === "tugas" && tugasRows.length > 0) {
    const avgKumpul =
      Math.round(
        (tugasRows.reduce((a, r) => a + Number(r.persen_kumpul), 0) / tugasRows.length) * 10,
      ) / 10;
    const dgnNilai = tugasRows.filter((r) => r.rata_nilai != null);
    const avgNilai =
      dgnNilai.length > 0
        ? Math.round(
            (dgnNilai.reduce((a, r) => a + Number(r.rata_nilai), 0) / dgnNilai.length) * 10,
          ) / 10
        : "—";
    pdfFooters = ["", "Rata-rata Kelas", "", "", "", "", "", `${avgKumpul}%`, String(avgNilai)];
  }

  const pdfColumnStyles =
    tab === "absensi"
      ? {
          0: { halign: "center" as const, cellWidth: 10 },
          2: { halign: "center" as const, cellWidth: 22 },
          3: { halign: "center" as const, cellWidth: 16 },
          4: { halign: "center" as const, cellWidth: 16 },
          5: { halign: "center" as const, cellWidth: 16 },
          6: { halign: "center" as const, cellWidth: 16 },
          7: { halign: "center" as const, cellWidth: 18 },
          8: { halign: "center" as const, cellWidth: 20 },
        }
      : {
          0: { halign: "center" as const, cellWidth: 10 },
          2: { halign: "center" as const, cellWidth: 22 },
          3: { halign: "center" as const, cellWidth: 16 },
          4: { halign: "center" as const, cellWidth: 16 },
          5: { halign: "center" as const, cellWidth: 16 },
          6: { halign: "center" as const, cellWidth: 20 },
          7: { halign: "center" as const, cellWidth: 20 },
          8: { halign: "center" as const, cellWidth: 22 },
        };

  return (
    <div className="space-y-6">
      <KelasHeader kelas={kelas} active="rekap" />

      <PeriodeSelector
        kelasId={kelasId}
        tab={tab}
        periode={periode}
        nilai={nilai}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{rentang.label}</span>{" "}
          <span className="text-slate-400">
            ({rentang.dari} s.d. {rentang.sampai})
          </span>
        </p>
        <div className="flex items-center gap-2">
          <ExportExcelButton
            rows={exportRows}
            filename={`rekap-${tab}-${kelas.nama.replace(/\s+/g, "-")}-${rentang.dari}_${rentang.sampai}.xlsx`}
            sheetName={tab === "absensi" ? "Absensi" : "Tugas"}
          />
          <ExportPdfButton
            title={`Rekap ${tab === "absensi" ? "Absensi" : "Tugas"} - Kelas ${kelas.nama}`}
            subtitle={kelas.tahun_pelajaran?.nama ? `Tahun Pelajaran: ${kelas.tahun_pelajaran.nama}` : undefined}
            info={[
              { label: "Kelas", value: kelas.nama },
              { label: "Periode", value: rentang.label },
              { label: "Rentang", value: `${rentang.dari} s.d. ${rentang.sampai}` },
            ]}
            headers={pdfHeaders}
            rows={pdfBody}
            footers={pdfFooters}
            filename={`rekap-${tab}-${kelas.nama.replace(/\s+/g, "-")}-${rentang.dari}_${rentang.sampai}.pdf`}
            columnStyles={pdfColumnStyles}
          />
        </div>
      </div>

      {tab === "absensi" ? (
        <RekapAbsensiTable rows={absensiRows} />
      ) : (
        <RekapTugasTable rows={tugasRows} />
      )}
    </div>
  );
}
