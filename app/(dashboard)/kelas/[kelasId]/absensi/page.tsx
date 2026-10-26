import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { mapelSaya } from "@/lib/kelas";
import { KelasHeader } from "@/components/kelas-header";
import { AbsensiGrid } from "./absensi-grid";
import { RiwayatAbsensi, type HariAbsensi } from "./riwayat-absensi";
import { JurnalForm } from "./jurnal-form";
import { PemilihTanggal } from "./pemilih-tanggal";
import type {
  Absensi,
  Jurnal,
  KelasDetail,
  Siswa,
  StatusAbsensi,
} from "@/lib/types";
import { History } from "lucide-react";

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

  // Semua query dijalankan bersamaan (kelas ikut Promise.all) agar satu round-trip saja.
  const [
    { data: kelasData },
    { data: siswaData },
    { data: absensiData },
    { data: riwayatData },
    { data: jurnalData },
  ] = await Promise.all([
    supabase
      .from("kelas")
      .select(
        "*, tahun_pelajaran(*), semester:semester!kelas_semester_id_fkey(*)",
      )
      .eq("id", kelasId)
      .maybeSingle(),
    supabase.from("siswa").select("*").eq("kelas_id", kelasId).order("urutan"),
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
    // Jurnal mengajar untuk tanggal ini (opsional).
    supabase
      .from("jurnal")
      .select("*")
      .eq("kelas_id", kelasId)
      .eq("tanggal", tanggal)
      .maybeSingle(),
  ]);
  if (!kelasData) notFound();
  const kelas = kelasData as unknown as KelasDetail;
  kelas.mapel = await mapelSaya(supabase, kelasId);
  const aktif = kelas.tahun_pelajaran.status === "aktif";

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

  return (
    <div className="space-y-6">
      <KelasHeader kelas={kelas} active="absensi" />

      <div className="flex flex-wrap items-center gap-2">
        <PemilihTanggal
          kelasId={kelasId}
          tanggal={tanggal}
          min={kelas.semester?.tgl_mulai ?? kelas.tahun_pelajaran.tgl_mulai}
          max={kelas.semester?.tgl_selesai ?? kelas.tahun_pelajaran.tgl_selesai}
        />
      </div>

      {tanggal !== format(new Date(), "yyyy-MM-dd") && (
        <p className="flex flex-wrap items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-800 ring-1 ring-amber-100">
          <History className="shrink-0" size={14} />
          Anda sedang membuka tanggal lampau. Menyimpan akan memperbarui data
          absensi hari tersebut — berguna untuk memperbaiki kesalahan.
        </p>
      )}

      {/* Sesi (judul + jam pelajaran) dan catatan jurnal diletakkan di atas
          daftar santri; tanggalnya mengikuti tanggal absensi yang dipilih. */}
      <JurnalForm
        kelasId={kelasId}
        tanggal={tanggal}
        existing={(jurnalData as Jurnal | null) ?? null}
        aktif={aktif}
      />

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
