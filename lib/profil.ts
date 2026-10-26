import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "./types";

/**
 * ID pengguna yang sedang login, dibaca dari cookie sesi (tanpa round-trip
 * jaringan). Middleware sudah memvalidasi token lewat `getClaims()` dan
 * seluruh data tetap dijaga RLS, jadi untuk kebutuhan tampilan (nama, badge
 * mapel, daftar kelas) pembacaan lokal ini cukup — dan jauh lebih cepat
 * daripada `auth.getUser()` yang memanggil server Auth setiap request.
 */
export async function idPenggunaSekarang(
  supabase: SupabaseClient,
): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

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
  const uid = await idPenggunaSekarang(supabase);
  if (!uid) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .maybeSingle();

  return (data as Profile | null) ?? null;
}
