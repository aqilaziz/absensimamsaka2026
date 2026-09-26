import Link from "next/link";
import { notFound } from "next/navigation";
import { addDays, format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { KelasHeader } from "@/components/kelas-header";
import { AbsensiGrid } from "./absensi-grid";
import { RiwayatAbsensi, type HariAbsensi } from "./riwayat-absensi";
import { formatTanggalPanjang } from "@/lib/periode";
import type { Absensi, KelasDetail, Siswa, StatusAbsensi } from "@/lib/types";
import { ChevronLeft, ChevronRight, History } from "lucide-react";

export default async function AbsensiPage({
  params,
  searchParams,
}: {
  params: Promise<{ kelasId: string }>;
  searchParams: Promise<{ tanggal?: string }>;
}) {
  const { kelasId } = await params;
  const { tanggal: tanggalParam } = await searchParams;
  const tanggal =
    tanggalParam && /^\d{4}-\d{2}-\d{2}$/.test(tanggalParam)
      ? tanggalParam
      : format(new Date(), "yyyy-MM-dd");

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
  const aktif = kelas.tahun_pelajaran.status === "aktif";

  const [{ data: siswaData }, { data: absensiData }, { data: riwayatData }] =
    await Promise.all([
      supabase
        .from("siswa")
        .select("*")
        .eq("kelas_id", kelasId)
        .order("urutan"),
      supabase
        .from("absensi")
        .select("*")
        .eq("kelas_id", kelasId)
        .eq("tanggal", tanggal),
      // Riwayat: semua absensi kelas ini (untuk daftar tanggal + rekap singkat).
      supabase
        .from("absensi")
        .select("tanggal, status")
        .eq("kelas_id", kelasId)
        .order("tanggal", { ascending: false }),
    ]);

  const siswaList = (siswaData ?? []) as Siswa[];
  const absensiList = (absensiData ?? []) as Absensi[];

  // Kelompokkan riwayat per tanggal.
  const petaHari = new Map<string, HariAbsensi>();
  for (const a of (riwayatData ?? []) as Pick<
    Absensi,
    "tanggal" | "status"
  >[]) {
    const hari = petaHari.get(a.tanggal) ?? {
      tanggal: a.tanggal,
      hadir: 0,
      sakit: 0,
      izin: 0,
      alpha: 0,
      total: 0,
    };
    hari[a.status as StatusAbsensi]++;
    hari.total++;
    petaHari.set(a.tanggal, hari);
  }
  const hariList = [...petaHari.values()].sort((a, b) =>
    a.tanggal < b.tanggal ? 1 : -1,
  );

  const kemarin = format(addDays(new Date(tanggal), -1), "yyyy-MM-dd");
  const besok = format(addDays(new Date(tanggal), 1), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <KelasHeader kelas={kelas} active="absensi" />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/kelas/${kelasId}/absensi?tanggal=${kemarin}`}
            className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-50"
            aria-label="Hari sebelumnya"
          >
            <ChevronLeft size={16} />
          </Link>
          <form className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              name="tanggal"
              defaultValue={tanggal}
              min={kelas.semester?.tgl_mulai ?? kelas.tahun_pelajaran.tgl_mulai}
              max={
                kelas.semester?.tgl_selesai ?? kelas.tahun_pelajaran.tgl_selesai
              }
              className="input w-auto max-w-full py-1.5"
            />
            <button type="submit" className="btn-secondary shrink-0 py-1.5">
              Buka
            </button>
          </form>
          <Link
            href={`/kelas/${kelasId}/absensi?tanggal=${besok}`}
            className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-50"
            aria-label="Hari berikutnya"
          >
            <ChevronRight size={16} />
          </Link>
        </div>
        <p className="text-xs font-medium text-slate-600 sm:text-sm">
          {formatTanggalPanjang(tanggal)}
        </p>
      </div>

      {tanggal !== format(new Date(), "yyyy-MM-dd") && (
        <p className="flex flex-wrap items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-800 ring-1 ring-amber-100">
          <History className="shrink-0" size={14} />
          Anda sedang membuka tanggal lampau. Menyimpan akan memperbarui data
          absensi hari tersebut — berguna untuk memperbaiki kesalahan.
        </p>
      )}

      {siswaList.length === 0 ? (
        <p className="card text-sm text-slate-500">
          Belum ada santri di kelas ini.{" "}
          {aktif && (
            <Link
              href={`/kelas/${kelasId}/siswa/import`}
              className="font-semibold text-emerald-700 hover:underline"
            >
              Impor dulu dari Excel
            </Link>
          )}
        </p>
      ) : (
        <AbsensiGrid
          kelasId={kelasId}
          tanggal={tanggal}
          siswaList={siswaList}
          existing={absensiList}
          aktif={aktif}
        />
      )}

      <RiwayatAbsensi
        kelasId={kelasId}
        hariList={hariList}
        tanggalAktif={tanggal}
      />
    </div>
  );
}
