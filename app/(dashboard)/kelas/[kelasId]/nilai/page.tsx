import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { ambilPengampu } from "@/lib/kelas";
import { ambilProfilSendiri } from "@/lib/profil";
import { KelasHeader } from "@/components/kelas-header";
import { JENIS_NILAI } from "@/lib/nilai";
import { NilaiGrid, PemilihNilai } from "./nilai-form";
import type {
  KelasDetail,
  Mapel,
  NilaiHarian,
  Siswa,
} from "@/lib/types";

export default async function NilaiPage({
  params,
  searchParams,
}: {
  params: Promise<{ kelasId: string }>;
  searchParams: Promise<{ tanggal?: string; mapel?: string; jenis?: string }>;
}) {
  const { kelasId } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const profil = await ambilProfilSendiri(supabase);
  const uid = profil?.id ?? null;
  const isAdmin = profil?.role === "admin";

  const [{ data: kelasData }, { data: pengampuData }] = await Promise.all([
    supabase
      .from("kelas")
      .select(
        "*, tahun_pelajaran(*), semester:semester!kelas_semester_id_fkey(*)",
      )
      .eq("id", kelasId)
      .maybeSingle(),
    ambilPengampu(supabase, kelasId),
  ]);

  if (!kelasData) notFound();
  const kelas = kelasData as unknown as KelasDetail;

  const semuaPengampu = (pengampuData ?? []) as unknown as {
    guru_id: string | null;
    mapel: Mapel | null;
  }[];
  const milikSaya = semuaPengampu.filter((p) => p.guru_id === uid && p.mapel);

  // Guru menilai mapel yang ia ampu; admin boleh melihat semua mapel kelas.
  const sumber = milikSaya.length > 0 ? milikSaya : semuaPengampu;
  const mapelList: Mapel[] = [];
  for (const p of sumber) {
    if (p.mapel && !mapelList.some((m) => m.id === p.mapel!.id)) {
      mapelList.push(p.mapel);
    }
  }
  const bisaEdit = milikSaya.length > 0;

  kelas.mapel = milikSaya[0]?.mapel ?? mapelList[0] ?? null;

  const mapelTerpilih =
    mapelList.find((m) => m.id === sp.mapel) ?? mapelList[0] ?? null;

  // Rentang tanggal yang boleh dipakai = semester kelas (atau tahun).
  const rentang = kelas.semester ?? kelas.tahun_pelajaran;
  const hariIni = format(new Date(), "yyyy-MM-dd");
  const tanggal =
    sp.tanggal && /^\d{4}-\d{2}-\d{2}$/.test(sp.tanggal)
      ? sp.tanggal
      : hariIni >= rentang.tgl_mulai && hariIni <= rentang.tgl_selesai
        ? hariIni
        : rentang.tgl_mulai;

  const jenis =
    sp.jenis && (JENIS_NILAI as readonly string[]).includes(sp.jenis)
      ? sp.jenis
      : JENIS_NILAI[0];

  const [{ data: siswaData }, { data: nilaiData }] = await Promise.all([
    supabase.from("siswa").select("*").eq("kelas_id", kelasId).order("urutan"),
    mapelTerpilih
      ? supabase
          .from("nilai_harian")
          .select("*")
          .eq("kelas_id", kelasId)
          .eq("mapel_id", mapelTerpilih.id)
          .eq("tanggal", tanggal)
          .eq("jenis", jenis)
      : Promise.resolve({ data: [] as NilaiHarian[] }),
  ]);

  const siswaList = (siswaData ?? []) as Siswa[];
  const nilaiList = (nilaiData ?? []) as NilaiHarian[];

  return (
    <div className="space-y-6">
      <KelasHeader kelas={kelas} active="nilai" />

      {!mapelTerpilih ? (
        <div className="card max-w-lg space-y-1 text-sm text-slate-600">
          <p className="font-medium text-slate-900">
            Belum ada mata pelajaran untuk dinilai.
          </p>
          <p>
            {isAdmin
              ? "Kelas ini belum punya pengampu, jadi belum ada mapel yang bisa dinilai."
              : "Anda belum mengambil kelas/mapel ini. Buka menu Ambil Kelas lalu centang mapel yang Anda ampu."}
          </p>
        </div>
      ) : (
        <>
          <PemilihNilai
            kelasId={kelasId}
            tanggal={tanggal}
            mapelId={mapelTerpilih.id}
            jenis={jenis}
            mapelList={mapelList.map((m) => ({ id: m.id, nama: m.nama }))}
            min={rentang.tgl_mulai}
            max={rentang.tgl_selesai}
          />

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-700">
              {mapelTerpilih.nama}
            </span>
            <span className="text-slate-300">·</span>
            <span>{jenis}</span>
          </div>

          {siswaList.length === 0 ? (
            <p className="card text-sm text-slate-500">
              Belum ada santri di kelas ini.
            </p>
          ) : (
            <NilaiGrid
              kelasId={kelasId}
              mapelId={mapelTerpilih.id}
              tanggal={tanggal}
              jenis={jenis}
              siswaList={siswaList}
              existing={nilaiList}
              bisaEdit={bisaEdit}
            />
          )}
        </>
      )}
    </div>
  );
}
