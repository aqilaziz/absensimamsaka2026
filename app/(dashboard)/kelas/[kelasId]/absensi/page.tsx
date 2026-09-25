import Link from "next/link";
import { notFound } from "next/navigation";
import { addDays, format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { KelasHeader } from "@/components/kelas-header";
import { AbsensiGrid } from "./absensi-grid";
import { formatTanggalPanjang } from "@/lib/periode";
import type { Absensi, KelasDetail, Siswa } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    .select("*, tahun_pelajaran(*)")
    .eq("id", kelasId)
    .maybeSingle();

  if (!kelasData) notFound();
  const kelas = kelasData as unknown as KelasDetail;
  const aktif = kelas.tahun_pelajaran.status === "aktif";

  const [{ data: siswaData }, { data: absensiData }] = await Promise.all([
    supabase.from("siswa").select("*").eq("kelas_id", kelasId).order("urutan"),
    supabase
      .from("absensi")
      .select("*")
      .eq("kelas_id", kelasId)
      .eq("tanggal", tanggal),
  ]);

  const siswaList = (siswaData ?? []) as Siswa[];
  const absensiList = (absensiData ?? []) as Absensi[];

  const kemarin = format(addDays(new Date(tanggal), -1), "yyyy-MM-dd");
  const besok = format(addDays(new Date(tanggal), 1), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <KelasHeader kelas={kelas} active="absensi" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/kelas/${kelasId}/absensi?tanggal=${kemarin}`}
            className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-50"
            aria-label="Hari sebelumnya"
          >
            <ChevronLeft size={16} />
          </Link>
          <form>
            <input
              type="date"
              name="tanggal"
              defaultValue={tanggal}
              min={kelas.tahun_pelajaran.tgl_mulai}
              max={kelas.tahun_pelajaran.tgl_selesai}
              className="input w-auto py-1.5"
            />
            <button type="submit" className="ml-2 btn-secondary py-1.5">
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
        <p className="text-sm font-medium text-slate-600">
          {formatTanggalPanjang(tanggal)}
        </p>
      </div>

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
    </div>
  );
}
