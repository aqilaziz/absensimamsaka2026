"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  hapusJurnalSchema,
  simpanJurnalSchema,
} from "@/lib/validations/jurnal";
import type { ActionResult, KelasDetail } from "@/lib/types";

export async function simpanJurnal(input: unknown): Promise<ActionResult> {
  const parsed = simpanJurnalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const {
    kelas_id,
    tanggal,
    judul,
    jam_mulai,
    jam_selesai,
    topik,
    materi,
    kegiatan,
    catatan,
  } = parsed.data;

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
  const rentang = kelas.semester ?? tp;
  if (tanggal < rentang.tgl_mulai || tanggal > rentang.tgl_selesai) {
    return {
      ok: false,
      error: kelas.semester
        ? "Tanggal di luar rentang semester kelas ini"
        : "Tanggal di luar rentang tahun pelajaran",
    };
  }

  const { error } = await supabase.from("jurnal").upsert(
    {
      kelas_id,
      guru_id: user.id,
      tanggal,
      judul: judul || null,
      jam_mulai: jam_mulai ?? null,
      jam_selesai: jam_selesai ?? null,
      topik: topik || null,
      materi: materi || null,
      kegiatan: kegiatan || null,
      catatan: catatan || null,
    },
    { onConflict: "kelas_id,tanggal,guru_id" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/kelas/${kelas_id}/absensi`);
  return { ok: true };
}

/**
 * Kosongkan catatan jurnal (topik, materi, metode, refleksi) untuk satu
 * kelas & tanggal.
 *
 * Barisnya TIDAK dihapus: judul pertemuan dan jam pelajaran tetap tersimpan,
 * dan absensi santri sama sekali tidak tersentuh (tabel berbeda).
 */
export async function hapusJurnal(input: unknown): Promise<ActionResult> {
  const parsed = hapusJurnalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { kelas_id, tanggal } = parsed.data;

  const { error } = await supabase
    .from("jurnal")
    .update({ topik: null, materi: null, kegiatan: null, catatan: null })
    .eq("kelas_id", kelas_id)
    .eq("tanggal", tanggal)
    .eq("guru_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/kelas/${kelas_id}/absensi`);
  return { ok: true };
}
