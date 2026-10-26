import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "./types";

/**
 * Profil milik pengguna yang sedang login.
 *
 * WAJIB difilter `id`: policy "admin lihat profil" membuat admin dapat
 * membaca SELURUH baris profiles, sehingga `.single()` tanpa filter akan
 * gagal ("multiple rows returned") dan aplikasi keliru menganggap admin
 * sebagai guru (menu admin & tahun pelajaran hilang).
 */
export async function ambilProfilSendiri(
  supabase: SupabaseClient,
): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile | null) ?? null;
}
