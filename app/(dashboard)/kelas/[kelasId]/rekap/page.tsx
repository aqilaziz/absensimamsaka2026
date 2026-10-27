import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mapelSaya } from "@/lib/kelas";
import { KelasHeader } from "@/components/kelas-header";
import { PeriodeSelector } from "@/components/periode-selector";
import { ExportExcelButton } from "@/components/export-excel-button";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { HintGeser } from "@/components/hint-geser";
import { RekapAbsensiTable } from "./rekap-absensi-table";
import { RekapTugasTable } from "./rekap-tugas-table";
import {
  RekapJurnalTable,
  labelJam,
  type JurnalRekapRow,
} from "./rekap-jurnal-table";
import { formatTanggalPanjang, hitungRentang, type Periode } from "@/lib/periode";
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

  const tab =
    sp.tab === "tugas" ? "tugas" : sp.tab === "jurnal" ? "jurnal" : "absensi";
  const periode: Periode =
    sp.periode === "semester" || sp.periode === "tahun" ? sp.periode : "bulan";
  const nilai = sp.nilai;

  const supabase = await createClient();

  // Kelas & mapel diambil bersamaan (satu gelombang), bukan berurutan.
  const [{ data: kelasData }, mapel] = await Promise.all([
    supabase
      .from("kelas")
      .select(
        "*, tahun_pelajaran(*), semester:semester!kelas_semester_id_fkey(*)",
      )
      .eq("id", kelasId)
      .maybeSingle(),
    mapelSaya(supabase, kelasId),
  ]);

  if (!kelasData) notFound();
  const kelas = kelasData as unknown as KelasDetail;
  kelas.mapel = mapel;

  const rentang = hitungRentang(periode, nilai, kelas.tahun_pelajaran);

  let absensiRows: RekapAbsensiRow[] = [];
  let tugasRows: RekapTugasRow[] = [];
  let jurnalRows: JurnalRekapRow[] = [];

  if (tab === "absensi") {
    const { data } = await supabase.rpc("rekap_absensi", {
      p_kelas_id: kelasId,
      p_dari: rentang.dari,
      p_sampai: rentang.sampai,
    });
    absensiRows = (data ?? []) as RekapAbsensiRow[];
  } else if (tab === "tugas") {
    const { data } = await supabase.rpc("rekap_tugas_siswa", {
      p_kelas_id: kelasId,
      p_dari: rentang.dari,
      p_sampai: rentang.sampai,
    });
    tugasRows = (data ?? []) as RekapTugasRow[];
  } else {
    // Jurnal mengajar pada rentang periode (guru: miliknya sendiri, admin: semua).
    const { data } = await supabase
      .from("jurnal")
      .select(
        "id, tanggal, judul, jam_mulai, jam_selesai, topik, materi, kegiatan, catatan",
      )
      .eq("kelas_id", kelasId)
      .gte("tanggal", rentang.dari)
      .lte("tanggal", rentang.sampai)
      .order("tanggal", { ascending: true });
    jurnalRows = (data ?? []) as JurnalRekapRow[];
  }

  const labelTab =
    tab === "absensi" ? "Absensi" : tab === "tugas" ? "Tugas" : "Jurnal";

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
      : tab === "tugas"
        ? tugasRows.map((r, i) => ({
            No: i + 1,
            Nama: r.nama,
            NIS: r.nis ?? "",
            "Total Tugas": r.total_tugas,
            Sudah: r.sudah,
            Belum: r.belum,
            Terlambat: r.terlambat,
            "% Kumpul": r.persen_kumpul,
            "Rata-rata Nilai": r.rata_nilai,
          }))
        : jurnalRows.map((r, i) => ({
            No: i + 1,
            Tanggal: formatTanggalPanjang(r.tanggal),
            "Jam ke": labelJam(r),
            "Judul Pertemuan": r.judul ?? "",
            Topik: r.topik ?? "",
            "Materi / Sub-topik": r.materi ?? "",
            Metode: r.kegiatan ?? "",
            Catatan: r.catatan ?? "",
          }));

  // Konfigurasi Export PDF
  const pdfHeaders =
    tab === "absensi"
      ? ["No", "Nama Santri", "NIS", "Hadir", "Sakit", "Izin", "Alpha", "Total", "% Hadir"]
      : tab === "tugas"
        ? ["No", "Nama Santri", "NIS", "Total", "Sudah", "Belum", "Terlambat", "% Kumpul", "Rata-rata"]
        : ["No", "Tanggal", "Jam", "Judul Pertemuan", "Topik", "Materi / Sub-topik", "Metode", "Catatan"];

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
      : tab === "tugas"
        ? tugasRows.map((r, i) => [
            i + 1,
            r.nama,
            r.nis ?? "-",
            r.total_tugas,
            r.sudah,
            r.belum,
            r.terlambat,
            `${r.persen_kumpul}%`,
            r.rata_nilai != null ? String(r.rata_nilai) : "—",
          ])
        : jurnalRows.map((r, i) => [
            i + 1,
            formatTanggalPanjang(r.tanggal),
            labelJam(r),
            r.judul ?? "-",
            r.topik ?? "-",
            r.materi ?? "-",
            r.kegiatan ?? "-",
            r.catatan ?? "-",
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

  const pdfColumnStyles: Record<
    number,
    { halign?: "left" | "center" | "right"; cellWidth?: number }
  > =
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
      : tab === "tugas"
        ? {
            0: { halign: "center" as const, cellWidth: 10 },
            2: { halign: "center" as const, cellWidth: 22 },
            3: { halign: "center" as const, cellWidth: 16 },
            4: { halign: "center" as const, cellWidth: 16 },
            5: { halign: "center" as const, cellWidth: 16 },
            6: { halign: "center" as const, cellWidth: 20 },
            7: { halign: "center" as const, cellWidth: 20 },
            8: { halign: "center" as const, cellWidth: 22 },
          }
        : {
            0: { halign: "center" as const, cellWidth: 10 },
            1: { cellWidth: 34 },
            2: { halign: "center" as const, cellWidth: 12 },
            3: { cellWidth: 40 },
            4: { cellWidth: 34 },
            5: { cellWidth: 40 },
            6: { cellWidth: 24 },
            7: { cellWidth: 34 },
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
            sheetName={labelTab}
          />
          <ExportPdfButton
            title={`Rekap ${labelTab} - Kelas ${kelas.nama}`}
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
            orientation={tab === "jurnal" ? "landscape" : "portrait"}
          />
        </div>
      </div>

      <HintGeser />

      {tab === "absensi" ? (
        <RekapAbsensiTable rows={absensiRows} />
      ) : tab === "tugas" ? (
        <RekapTugasTable rows={tugasRows} />
      ) : (
        <RekapJurnalTable rows={jurnalRows} />
      )}
    </div>
  );
}
