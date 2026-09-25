// Publishable key (format baru sb_publishable_...) lebih disarankan;
// fallback ke legacy anon key bila masih dipakai.
// Dibaca malas (lazy) agar error env yang hilang memberi pesan jelas
// saat runtime, bukan crash misterius di middleware (500 di Vercel).
export function getSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Env Supabase belum diisi: NEXT_PUBLIC_SUPABASE_URL dan " +
        "(NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY atau NEXT_PUBLIC_SUPABASE_ANON_KEY). " +
        "Isi di Vercel → Settings → Environment Variables.",
    );
  }
  return { url, key };
}

// Kompatibilitas: modul lama mengimpor konstanta ini langsung.
// Diakses malas agar import-time tidak meledak saat env belum ada.
export const supabaseUrl: string = new Proxy({} as { v?: string }, {
  get(_t, prop) {
    const { url } = getSupabaseEnv();
    const value = (url as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "string") return value;
    if (prop === "toString" || prop === Symbol.toPrimitive) return () => url;
    if (prop === "valueOf") return () => url;
    return url;
  },
}) as unknown as string;

export const supabaseKey: string = new Proxy({} as { v?: string }, {
  get(_t, prop) {
    const { key } = getSupabaseEnv();
    const value = (key as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "string") return value;
    if (prop === "toString" || prop === Symbol.toPrimitive) return () => key;
    if (prop === "valueOf") return () => key;
    return key;
  },
}) as unknown as string;
