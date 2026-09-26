"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { simpanAbsensiSchema } from "@/lib/validations/absensi";
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
    .upsert(rows, { onConflict: "siswa_id,tanggal" });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/kelas/${kelas_id}/absensi`);
  revalidatePath(`/kelas/${kelas_id}/rekap`);
  return { ok: true };
}
