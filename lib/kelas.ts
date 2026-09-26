import type { SupabaseClient } from "@supabase/supabase-js";
import type { KelasDetail } from "./types";

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
    .select(
      "*, tahun_pelajaran(*), semester:semester!kelas_semester_id_fkey(*)",
    )
    .eq("id", kelasId)
    .maybeSingle();
}

export function sebagaiKelasDetail(data: unknown): KelasDetail {
  return data as unknown as KelasDetail;
}
