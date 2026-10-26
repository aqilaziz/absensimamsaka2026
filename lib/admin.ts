import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Ambil profil user yang sedang login (atau null bila belum login). */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").single();
  return (data as Profile | null) ?? null;
}

/** Versi boolean dari guard admin, untuk dipakai di server action. */
export async function cekAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("role").single();
  return (data as { role?: string } | null)?.role === "admin";
}

/**
 * Guard untuk halaman admin. Jika user bukan admin, dialihkan ke /
 * (dashboardnya sendiri). Balikannya profil admin untuk dipakai halaman.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (profile?.role !== "admin") redirect("/");
  return profile;
}
