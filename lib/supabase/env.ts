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
// Penting: method String (trim, toString, dsb.) harus mengembalikan fungsi
// yang ter-bind ke string asli, bukan string-nya — kalau tidak,
// supabase-js melempar "supabaseUrl.trim is not a function".
function lazyString(read: () => string): string {
  return new Proxy({} as Record<string | symbol, unknown>, {
    get(_t, prop) {
      const value = read();
      if (prop === Symbol.toPrimitive) return () => value;
      const member = (value as unknown as Record<string | symbol, unknown>)[
        prop
      ];
      if (typeof member === "function") return member.bind(value);
      return member;
    },
    has() {
      return true;
    },
    getOwnPropertyDescriptor() {
      return { configurable: true, enumerable: false };
    },
  }) as unknown as string;
}

export const supabaseUrl: string = lazyString(() => getSupabaseEnv().url);

export const supabaseKey: string = lazyString(() => getSupabaseEnv().key);
