"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { simpanAbsensiSchema, hapusAbsensiSchema } from "@/lib/validations/absensi";
import type { ActionResult, KelasDetail } from "@/lib/types";

export async function simpanAbsensi(input: unknown): Promise<ActionResult> {
  const parsed = simpanAbsensiSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { kelas_id, tanggal, items } = parsed.data;

  // Guru hanya boleh mengabsen kelas yang sudah ia ambil (menu Ambil Kelas).
  const { data: pengampu } = await supabase
    .from("kelas_ajar")
    .select("id")
    .eq("kelas_id", kelas_id)
    .eq("guru_id", user.id)
    .limit(1);
  if (!pengampu || pengampu.length === 0) {
    return {
      ok: false,
      error: "Anda belum mengambil kelas ini. Buka menu Ambil Kelas dulu.",
    };
  }

  const { data: kelasData } = await supabase
    .from("kelas")
    .select(
      "*, tahun_pelajaran(*), semester:semester!kelas_semester_id_fkey(*)",
    )
    .eq("id", kelas_id)
    .maybeSingle();
  if (!kelasData) return { ok: false, error: "Kelas tidak ditemukan" };
  const kelas = kelasData as unknown as KelasDetail;

  const tp = kelas.tahun_pelajaran;
  if (tp.status !== "aktif") {
    return { ok: false, error: "Tahun pelajaran sudah diarsipkan" };
  }
  // Absensi hanya boleh dalam rentang semester kelas itu (bila semester
  // belum tersedia karena migrasi 0005 belum jalan, pakai rentang tahun)
  const rentang = kelas.semester ?? tp;
  if (tanggal < rentang.tgl_mulai || tanggal > rentang.tgl_selesai) {
    return {
      ok: false,
      error: kelas.semester
        ? "Tanggal di luar rentang semester kelas ini"
        : "Tanggal di luar rentang tahun pelajaran",
    };
  }

  const rows = items.map((i) => ({
    siswa_id: i.siswa_id,
    kelas_id,
    guru_id: user.id,
    tanggal,
    status: i.status,
    keterangan:
      i.status === "sakit" || i.status === "izin"
        ? (i.keterangan ?? null)
        : null,
  }));

  const { error } = await supabase
    .from("absensi")
    .upsert(rows, { onConflict: "siswa_id,tanggal,guru_id" });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/kelas/${kelas_id}/absensi`);
  revalidatePath(`/kelas/${kelas_id}/rekap`);
  return { ok: true };
}

/**
 * Hapus absensi satu kelas pada satu tanggal.
 *
 * Guru hanya menghapus baris miliknya sendiri (kelas & tanggal itu); admin
 * menghapus seluruh baris pada tanggal tersebut, termasuk milik guru lain.
 */
export async function hapusAbsensi(input: unknown): Promise<ActionResult> {
  const parsed = hapusAbsensiSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { kelas_id, tanggal } = parsed.data;

  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = (profil as { role?: string } | null)?.role === "admin";

  if (!isAdmin) {
    // Guru hanya boleh menghapus absensi kelas yang ia ampu.
    const { data: pengampu } = await supabase
      .from("kelas_ajar")
      .select("id")
      .eq("kelas_id", kelas_id)
      .eq("guru_id", user.id)
      .limit(1);
    if (!pengampu || pengampu.length === 0) {
      return {
        ok: false,
        error: "Anda belum mengambil kelas ini. Buka menu Ambil Kelas dulu.",
      };
    }
  }

  let q = supabase
    .from("absensi")
    .delete()
    .eq("kelas_id", kelas_id)
    .eq("tanggal", tanggal);
  if (!isAdmin) q = q.eq("guru_id", user.id);

  const { error } = await q;
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/kelas/${kelas_id}/absensi`);
  revalidatePath(`/kelas/${kelas_id}/rekap`);
  return { ok: true };
}
