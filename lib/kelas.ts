import type { SupabaseClient } from "@supabase/supabase-js";
import type { KelasAjar, KelasDetail, Mapel } from "./types";
import { idPenggunaSekarang } from "./profil";

/** Kolom kelas + relasi yang selalu dibutuhkan. Kelas tidak lagi punya
 *  mapel; mapel ditentukan lewat tabel pengampu (`kelas_ajar`). */
export const KELAS_SELECT =
  "*, tahun_pelajaran(*), semester:semester!kelas_semester_id_fkey(*)";

/**
 * Ambil detail kelas beserta tahun pelajaran & semester-nya.
 *
 * Catatan: relasi `kelas → semester` bersifat ganda di skema
 * (FK `semester_id` + FK kombinasi `(tahun_pelajaran_id, semester_id)`),
 * sehingga `semester(*)` ambigu dan PostgREST melempar PGRST201.
 * Karena itu relasi semester di-hint eksplisit lewat nama constraint
 * `kelas_semester_id_fkey`.
 */
export async function ambilKelasDetail(
  supabase: SupabaseClient,
  kelasId: string,
) {
  return supabase
    .from("kelas")
    .select(KELAS_SELECT)
    .eq("id", kelasId)
    .maybeSingle();
}

/** Pengampu sebuah kelas (semua guru, atau milik satu guru bila `guruId` diisi). */
export async function ambilPengampu(
  supabase: SupabaseClient,
  kelasId: string,
  guruId?: string | null,
) {
  let q = supabase
    .from("kelas_ajar")
    .select("*, mapel:mapel!kelas_ajar_mapel_id_fkey(id, nama, warna)")
    .eq("kelas_id", kelasId)
    .order("created_at");
  if (guruId) q = q.eq("guru_id", guruId);
  return q;
}

/**
 * Detail kelas + mapel yang diampu guru tertentu.
 * `kelas.mapel` berisi mapel pertama yang ia ampu di kelas ini (dipakai
 * header & badge), `kelas.pengampu` berisi seluruh baris pengampu miliknya.
 */
export async function ambilKelasUntukGuru(
  supabase: SupabaseClient,
  kelasId: string,
  guruId: string,
): Promise<KelasDetail | null> {
  const { data } = await ambilKelasDetail(supabase, kelasId);
  if (!data) return null;

  const kelas = data as unknown as KelasDetail;
  const { data: pengampu } = await ambilPengampu(supabase, kelasId, guruId);
  const daftar = (pengampu ?? []) as (KelasAjar & { mapel?: Mapel | null })[];

  kelas.mapel = daftar[0]?.mapel ?? null;
  kelas.pengampu = daftar;
  return kelas;
}

export function sebagaiKelasDetail(data: unknown): KelasDetail {
  return data as unknown as KelasDetail;
}

/** Mapel yang diampu pengguna yang sedang login di sebuah kelas (null bila
 *  belum mengambil kelas tersebut). Dipakai untuk badge di header. */
export async function mapelSaya(
  supabase: SupabaseClient,
  kelasId: string,
  guruId?: string | null,
): Promise<Mapel | null> {
  // Pakai id dari cookie sesi (tanpa round-trip ke Auth). Bila pemanggil
  // sudah punya id (mis. dari layout), kirimkan agar tidak ada query tambahan.
  const uid = guruId ?? (await idPenggunaSekarang(supabase));
  if (!uid) return null;

  const { data } = await ambilPengampu(supabase, kelasId, uid);
  const daftar = (data ?? []) as unknown as { mapel?: Mapel | null }[];
  return daftar[0]?.mapel ?? null;
}

export interface KelasRingkas {
  id: string;
  nama: string;
  semester_id: string;
}

/**
 * Daftar kelas yang diampu seorang guru pada satu tahun pelajaran.
 * Satu kelas bisa diampu untuk beberapa mapel → dideduplikasi per kelas.
 */
export async function ambilKelasSaya(
  supabase: SupabaseClient,
  guruId: string,
  tahunId: string,
): Promise<KelasRingkas[]> {
  const { data } = await supabase
    .from("kelas_ajar")
    .select(
      "kelas_id, kelas:kelas!kelas_ajar_kelas_id_fkey(id, nama, semester_id, tahun_pelajaran_id)",
    )
    .eq("guru_id", guruId);

  const baris = (data ?? []) as unknown as {
    kelas: {
      id: string;
      nama: string;
      semester_id: string;
      tahun_pelajaran_id: string;
    } | null;
  }[];

  const unik = new Map<string, KelasRingkas>();
  for (const r of baris) {
    const k = r.kelas;
    if (!k || k.tahun_pelajaran_id !== tahunId) continue;
    unik.set(k.id, { id: k.id, nama: k.nama, semester_id: k.semester_id });
  }
  return [...unik.values()].sort((a, b) => a.nama.localeCompare(b.nama));
}
