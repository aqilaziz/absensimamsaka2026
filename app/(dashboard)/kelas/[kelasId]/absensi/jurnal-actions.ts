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

  const { kelas_id, tanggal, pertemuan, materi, tujuan, kegiatan, catatan } =
    parsed.data;

  const { data: kelasData } = await supabase
    .from("kelas")
    .select(
      "*, tahun_pelajaran(*), mapel:mapel!kelas_mapel_id_fkey(*), semester:semester!kelas_semester_id_fkey(*)",
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
      pertemuan: pertemuan ?? null,
      materi: materi || null,
      tujuan: tujuan || null,
      kegiatan: kegiatan || null,
      catatan: catatan || null,
    },
    { onConflict: "kelas_id,tanggal" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/kelas/${kelas_id}/absensi`);
  return { ok: true };
}

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
    .delete()
    .eq("kelas_id", kelas_id)
    .eq("tanggal", tanggal);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/kelas/${kelas_id}/absensi`);
  return { ok: true };
}
