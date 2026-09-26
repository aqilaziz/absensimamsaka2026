import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { HasilCariSantri } from "@/lib/types";

/**
 * Pencarian santri (live).
 *
 * Dipakai oleh kotak pencarian yang mengetik-langsung-tampil (debounce), jadi
 * endpoint ini harus ringan: satu query, batas 20 baris, dan hanya memvalidasi
 * sesi (bukan memuat seluruh data dashboard).
 *
 * Middleware sengaja melewati `/api/*` agar tidak ada round-trip `getUser()`
 * ganda; validasi sesi dilakukan di sini dan RLS tetap menjaga isolasi data.
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const termasukArsip = request.nextUrl.searchParams.get("arsip") === "1";

  // Minimal 2 karakter supaya tidak memindai seluruh tabel.
  if (q.length < 2) {
    return NextResponse.json({ hasil: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { hasil: [], error: "Sesi berakhir, silakan masuk ulang" },
      { status: 401 },
    );
  }

  const pola = `%${q.replace(/[%_,()]/g, "")}%`;
  let req = supabase
    .from("siswa")
    .select("*, kelas!inner(*, tahun_pelajaran!inner(*))")
    .or(`nama.ilike.${pola},nis.ilike.${pola}`)
    .order("nama")
    .limit(20);

  if (!termasukArsip) {
    req = req.eq("kelas.tahun_pelajaran.status", "aktif");
  }

  const { data, error } = await req;
  if (error) {
    return NextResponse.json(
      { hasil: [], error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    hasil: (data ?? []) as unknown as HasilCariSantri[],
  });
}
