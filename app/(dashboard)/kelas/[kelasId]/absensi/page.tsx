import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { ambilPengampu } from "@/lib/kelas";
import { ambilProfilSendiri } from "@/lib/profil";
import { KelasHeader } from "@/components/kelas-header";
import { AbsensiGrid } from "./absensi-grid";
import { RiwayatAbsensi, type HariAbsensi } from "./riwayat-absensi";
import { JurnalForm } from "./jurnal-form";
import { PemilihMapel } from "./pemilih-mapel";
import {
  SimpanSemuaProvider,
  TombolSimpanSemua,
} from "./simpan-semua";
import { PemilihTanggal } from "./pemilih-tanggal";
import type {
  Absensi,
  Jurnal,
  KelasDetail,
  Mapel,
  Siswa,
  StatusAbsensi,
} from "@/lib/types";
import { History } from "lucide-react";

export default async function AbsensiPage({
  params,
  searchParams,
}: {
  params: Promise<{ kelasId: string }>;
  searchParams: Promise<{ tanggal?: string; mapel?: string }>;
}) {
  const { kelasId } = await params;
  const { tanggal: tanggalParam, mapel: mapelParam } = await searchParams;
  const tanggal =
    tanggalParam && /^\d{4}-\d{2}-\d{2}$/.test(tanggalParam)
      ? tanggalParam
      : format(new Date(), "yyyy-MM-dd");

  const supabase = await createClient();
  const profil = await ambilProfilSendiri(supabase);
  const uid = profil?.id ?? null;

  // Kelas, santri, dan daftar pengampu diambil bersamaan.
  const [{ data: kelasData }, { data: siswaData }, { data: pengampuData }] =
    await Promise.all([
      supabase
        .from("kelas")
        .select(
          "*, tahun_pelajaran(*), semester:semester!kelas_semester_id_fkey(*)",
        )
        .eq("id", kelasId)
        .maybeSingle(),
      supabase.from("siswa").select("*").eq("kelas_id", kelasId).order("urutan"),
      ambilPengampu(supabase, kelasId),
    ]);

  if (!kelasData) notFound();
  const kelas = kelasData as unknown as KelasDetail;

  const semuaPengampu = (pengampuData ?? []) as unknown as {
    guru_id: string | null;
    mapel: Mapel | null;
  }[];
  const milikSaya = semuaPengampu.filter((p) => p.guru_id === uid && p.mapel);
  // Guru memakai mapel yang ia ampu; admin boleh melihat semua mapel kelas.
  const sumber = milikSaya.length > 0 ? milikSaya : semuaPengampu;
  const mapelList: Mapel[] = [];
  for (const p of sumber) {
    if (p.mapel && !mapelList.some((m) => m.id === p.mapel!.id)) {
      mapelList.push(p.mapel);
    }
  }
  const mapelTerpilih =
    mapelList.find((m) => m.id === mapelParam) ?? mapelList[0] ?? null;
  kelas.mapel = milikSaya[0]?.mapel ?? mapelTerpilih;

  const aktif = kelas.tahun_pelajaran.status === "aktif";
  const siswaList = (siswaData ?? []) as Siswa[];

  // Absensi, riwayat, dan jurnal dibatasi pada mapel sesi ini.
  let absensiList: Absensi[] = [];
  let riwayat: Pick<
    Absensi,
    "tanggal" | "status" | "siswa_id" | "keterangan"
  >[] = [];
  let jurnalData: Jurnal | null = null;

  if (mapelTerpilih) {
    const [a, r, j] = await Promise.all([
      supabase
        .from("absensi")
        .select("*")
        .eq("kelas_id", kelasId)
        .eq("mapel_id", mapelTerpilih.id)
        .eq("tanggal", tanggal),
      // Riwayat mapel ini: daftar tanggal + status pertemuan sebelumnya.
      supabase
        .from("absensi")
        .select("tanggal, status, siswa_id, keterangan")
        .eq("kelas_id", kelasId)
        .eq("mapel_id", mapelTerpilih.id)
        .order("tanggal", { ascending: false }),
      supabase
        .from("jurnal")
        .select("*")
        .eq("kelas_id", kelasId)
        .eq("mapel_id", mapelTerpilih.id)
        .eq("tanggal", tanggal)
        .maybeSingle(),
    ]);
    absensiList = (a.data ?? []) as Absensi[];
    riwayat = (r.data ?? []) as Pick<
      Absensi,
      "tanggal" | "status" | "siswa_id" | "keterangan"
    >[];
    jurnalData = (j.data as Jurnal | null) ?? null;
  }

  // Kelompokkan riwayat per tanggal.
  const petaHari = new Map<string, HariAbsensi>();
  for (const a of riwayat) {
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

  // Pertemuan sebelumnya = tanggal terakhir sebelum tanggal yang dibuka.
  const tanggalSebelum =
    hariList.find((h) => h.tanggal < tanggal)?.tanggal ?? null;
  const absensiSebelum = tanggalSebelum
    ? riwayat.filter((a) => a.tanggal === tanggalSebelum)
    : [];

  return (
    <div className="space-y-6">
      <KelasHeader kelas={kelas} active="absensi" />

      <div className="flex flex-wrap items-center gap-2">
        <PemilihTanggal
          kelasId={kelasId}
          tanggal={tanggal}
          mapelId={mapelTerpilih?.id}
          min={kelas.semester?.tgl_mulai ?? kelas.tahun_pelajaran.tgl_mulai}
          max={kelas.semester?.tgl_selesai ?? kelas.tahun_pelajaran.tgl_selesai}
        />
        {mapelTerpilih && (
          <PemilihMapel
            kelasId={kelasId}
            tanggal={tanggal}
            mapelId={mapelTerpilih.id}
            mapelList={mapelList.map((m) => ({ id: m.id, nama: m.nama }))}
          />
        )}
      </div>

      {tanggal !== format(new Date(), "yyyy-MM-dd") && (
        <p className="flex flex-wrap items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-800 ring-1 ring-amber-100">
          <History className="shrink-0" size={14} />
          Anda sedang membuka tanggal lampau. Menyimpan akan memperbarui data
          absensi hari tersebut — berguna untuk memperbaiki kesalahan.
        </p>
      )}

      {!mapelTerpilih ? (
        <div className="card max-w-lg space-y-1 text-sm text-slate-600">
          <p className="font-medium text-slate-900">
            Belum ada mata pelajaran untuk sesi ini.
          </p>
          <p>
            Anda belum mengambil kelas/mapel ini. Buka menu Ambil Kelas lalu
            centang mapel yang Anda ampu.
          </p>
        </div>
      ) : (
      <SimpanSemuaProvider>
        {/* Sesi (judul + jam pelajaran) dan catatan jurnal diletakkan di atas
            daftar santri; tanggalnya mengikuti tanggal absensi yang dipilih. */}
        <JurnalForm
          kelasId={kelasId}
          mapelId={mapelTerpilih.id}
          tanggal={tanggal}
          existing={jurnalData}
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
          <div className="space-y-3">
            <AbsensiGrid
              kelasId={kelasId}
              mapelId={mapelTerpilih.id}
              tanggal={tanggal}
              siswaList={siswaList}
              existing={absensiList}
              aktif={aktif}
              tanggalSebelum={tanggalSebelum}
              absensiSebelum={absensiSebelum}
            />
            <TombolSimpanSemua aktif={aktif} />
          </div>
        )}
      </SimpanSemuaProvider>
      )}

      <RiwayatAbsensi
        kelasId={kelasId}
        mapelId={mapelTerpilih?.id}
        hariList={hariList}
        tanggalAktif={tanggal}
      />
    </div>
  );
}
