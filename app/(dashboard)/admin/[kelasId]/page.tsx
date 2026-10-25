import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { RekapAbsensiTable } from "@/app/(dashboard)/kelas/[kelasId]/rekap/rekap-absensi-table";
import { RekapTugasTable } from "@/app/(dashboard)/kelas/[kelasId]/rekap/rekap-tugas-table";
import { ExportExcelButton } from "@/components/export-excel-button";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { labelSemester, hitungRentang, type Periode } from "@/lib/periode";
import { temaMapel } from "@/lib/mapel";
import type { KelasDetail, RekapAbsensiRow, RekapTugasRow } from "@/lib/types";

export default async function AdminKelasDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ kelasId: string }>;
  searchParams: Promise<{ tab?: string; periode?: string; nilai?: string }>;
}) {
  await requireAdmin();
  const { kelasId } = await params;
  const sp = await searchParams;

  const tab = sp.tab === "tugas" ? "tugas" : "absensi";
  const periode: Periode =
    sp.periode === "semester" || sp.periode === "tahun"
      ? sp.periode
      : "semester";
  const nilai = sp.nilai;

  const supabase = await createClient();

  const { data: kelasData } = await supabase
    .from("kelas")
    .select(
      "*, tahun_pelajaran(*), mapel:mapel!kelas_mapel_id_fkey(*), semester:semester!kelas_semester_id_fkey(*)",
    )
    .eq("id", kelasId)
    .maybeSingle();

  if (!kelasData) notFound();
  const kelas = kelasData as unknown as KelasDetail;

  const { data: guruData } = await supabase
    .from("profiles")
    .select("nama")
    .eq("id", kelas.guru_id)
    .maybeSingle();
  const guruNama = guruData?.nama ?? "-";

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

  const pdfHeaders =
    tab === "absensi"
      ? [
          "No",
          "Nama Santri",
          "NIS",
          "Hadir",
          "Sakit",
          "Izin",
          "Alpha",
          "Total",
          "% Hadir",
        ]
      : [
          "No",
          "Nama Santri",
          "NIS",
          "Total",
          "Sudah",
          "Belum",
          "Terlambat",
          "% Kumpul",
          "Rata-rata",
        ];

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

  let pdfFooters: (string | number)[] | undefined = undefined;
  if (tab === "absensi" && absensiRows.length > 0) {
    const avgHadir =
      Math.round(
        (absensiRows.reduce((a, r) => a + Number(r.persen_hadir), 0) /
          absensiRows.length) *
          10,
      ) / 10;
    pdfFooters = [
      "",
      "Rata-rata Kelas",
      "",
      "",
      "",
      "",
      "",
      "",
      `${avgHadir}%`,
    ];
  } else if (tab === "tugas" && tugasRows.length > 0) {
    const avgKumpul =
      Math.round(
        (tugasRows.reduce((a, r) => a + Number(r.persen_kumpul), 0) /
          tugasRows.length) *
          10,
      ) / 10;
    const dgnNilai = tugasRows.filter((r) => r.rata_nilai != null);
    const avgNilai =
      dgnNilai.length > 0
        ? Math.round(
            (dgnNilai.reduce((a, r) => a + Number(r.rata_nilai), 0) /
              dgnNilai.length) *
              10,
          ) / 10
        : "—";
    pdfFooters = [
      "",
      "Rata-rata Kelas",
      "",
      "",
      "",
      "",
      "",
      `${avgKumpul}%`,
      String(avgNilai),
    ];
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

  const t = temaMapel(kelas.mapel?.warna);

  const buatHref = (
    p: Partial<{ tab: string; periode: string; nilai: string }>,
  ) => {
    const q = new URLSearchParams();
    q.set("tab", p.tab ?? tab);
    q.set("periode", p.periode ?? periode);
    if (p.nilai) q.set("nilai", p.nilai);
    return `/admin/${kelasId}?${q.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          ← Kembali ke Dashboard Admin
        </Link>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
          <span className={`h-3 w-3 rounded-full ${t.dot}`} />
          {kelas.nama}
        </h1>
        <p className="text-sm text-slate-500">
          Guru: <b>{guruNama}</b> · Tahun {kelas.tahun_pelajaran.nama} ·{" "}
          {kelas.semester ? labelSemester(kelas.semester.nama) : "Semester"}{" "}
          {kelas.mapel ? `· ${kelas.mapel.nama}` : ""}
        </p>
      </div>

      {/* Tab absensi / tugas */}
      <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-slate-200">
        <Link
          href={buatHref({ tab: "absensi" })}
          className={
            tab === "absensi"
              ? "shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white"
              : "shrink-0 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          }
        >
          Absensi
        </Link>
        <Link
          href={buatHref({ tab: "tugas" })}
          className={
            tab === "tugas"
              ? "shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white"
              : "shrink-0 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          }
        >
          Tugas
        </Link>
      </div>

      {/* Pilih periode */}
      <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-slate-200">
        <Link
          href={buatHref({ periode: "semester", nilai: "ganjil" })}
          className={
            periode === "semester" && nilai !== "genap"
              ? "shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
              : "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
          }
        >
          Semester Ganjil
        </Link>
        <Link
          href={buatHref({ periode: "semester", nilai: "genap" })}
          className={
            periode === "semester" && nilai === "genap"
              ? "shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
              : "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
          }
        >
          Semester Genap
        </Link>
        <Link
          href={buatHref({ periode: "tahun" })}
          className={
            periode === "tahun"
              ? "shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
              : "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
          }
        >
          Tahun {kelas.tahun_pelajaran.nama}
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{rentang.label}</span>{" "}
          <span className="text-slate-400">
            ({rentang.dari} s.d. {rentang.sampai})
          </span>
        </p>
        <div className="flex items-center gap-2 no-print">
          <ExportExcelButton
            rows={exportRows}
            filename={`admin-rekap-${tab}-${kelas.nama.replace(/\s+/g, "-")}-${rentang.dari}_${rentang.sampai}.xlsx`}
            sheetName={tab === "absensi" ? "Absensi" : "Tugas"}
          />
          <ExportPdfButton
            title={`Rekap ${tab === "absensi" ? "Absensi" : "Tugas"} - Kelas ${kelas.nama}`}
            subtitle={`Tahun Pelajaran: ${kelas.tahun_pelajaran.nama} · Guru: ${guruNama}`}
            info={[
              { label: "Kelas", value: kelas.nama },
              { label: "Guru", value: guruNama },
              { label: "Periode", value: rentang.label },
              {
                label: "Rentang",
                value: `${rentang.dari} s.d. ${rentang.sampai}`,
              },
            ]}
            headers={pdfHeaders}
            rows={pdfBody}
            footers={pdfFooters}
            filename={`admin-rekap-${tab}-${kelas.nama.replace(/\s+/g, "-")}-${rentang.dari}_${rentang.sampai}.pdf`}
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
