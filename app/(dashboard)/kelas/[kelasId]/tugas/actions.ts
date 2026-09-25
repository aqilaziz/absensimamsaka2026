"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  simpanPengumpulanSchema,
  tugasSchema,
} from "@/lib/validations/tugas";
import type { ActionResult, KelasDetail, Tugas } from "@/lib/types";

async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function createTugas(
  kelasId: string,
  input: unknown,
): Promise<ActionResult & { tugasId?: string }> {
  const parsed = tugasSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { supabase, userId } = await getContext();
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { data, error } = await supabase
    .from("tugas")
    .insert({
      kelas_id: kelasId,
      guru_id: userId,
      judul: parsed.data.judul,
      deskripsi: parsed.data.deskripsi || null,
      tipe: parsed.data.tipe,
      nilai_maks: parsed.data.tipe === "nilai" ? parsed.data.nilai_maks! : null,
      tgl_diberikan: parsed.data.tgl_diberikan,
      tgl_tenggat: parsed.data.tgl_tenggat || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/kelas/${kelasId}/tugas`);
  return { ok: true, tugasId: data.id as string };
}

export async function updateTugas(
  tugasId: string,
  kelasId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = tugasSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { supabase, userId } = await getContext();
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const ubahKeCeklis = parsed.data.tipe === "ceklis";

  const { error } = await supabase
    .from("tugas")
    .update({
      judul: parsed.data.judul,
      deskripsi: parsed.data.deskripsi || null,
      tipe: parsed.data.tipe,
      nilai_maks: ubahKeCeklis ? null : parsed.data.nilai_maks!,
      tgl_diberikan: parsed.data.tgl_diberikan,
      tgl_tenggat: parsed.data.tgl_tenggat || null,
    })
    .eq("id", tugasId);

  if (error) return { ok: false, error: error.message };

  // Jika diubah ke ceklis, hapus nilai yang sudah terlanjur diisi
  if (ubahKeCeklis) {
    await supabase
      .from("pengumpulan")
      .update({ nilai: null })
      .eq("tugas_id", tugasId);
  }

  revalidatePath(`/kelas/${kelasId}/tugas`);
  revalidatePath(`/kelas/${kelasId}/tugas/${tugasId}`);
  return { ok: true };
}

export async function hapusTugas(
  tugasId: string,
  kelasId: string,
): Promise<ActionResult> {
  const { supabase, userId } = await getContext();
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { error } = await supabase.from("tugas").delete().eq("id", tugasId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/kelas/${kelasId}/tugas`);
  return { ok: true };
}

export async function simpanPengumpulan(
  input: unknown,
): Promise<ActionResult> {
  const parsed = simpanPengumpulanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { supabase, userId } = await getContext();
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { tugas_id, items } = parsed.data;

  const { data: tugasData } = await supabase
    .from("tugas")
    .select("*, kelas(*, tahun_pelajaran(*), semester(*))")
    .eq("id", tugas_id)
    .maybeSingle();
  if (!tugasData) return { ok: false, error: "Tugas tidak ditemukan" };

  const tugas = tugasData as unknown as Tugas & { kelas: KelasDetail };
  if (tugas.kelas.tahun_pelajaran.status !== "aktif") {
    return { ok: false, error: "Tahun pelajaran sudah diarsipkan" };
  }

  for (const item of items) {
    if (tugas.tipe === "ceklis" && item.nilai != null) {
      return { ok: false, error: "Tugas tipe ceklis tidak menerima nilai" };
    }
    if (
      tugas.tipe === "nilai" &&
      item.nilai != null &&
      tugas.nilai_maks != null &&
      item.nilai > tugas.nilai_maks
    ) {
      return {
        ok: false,
        error: `Nilai melebihi nilai maksimal (${tugas.nilai_maks})`,
      };
    }
  }

  const hariIni = new Date().toISOString().slice(0, 10);
  const rows = items.map((i) => ({
    tugas_id,
    siswa_id: i.siswa_id,
    kelas_id: tugas.kelas_id,
    guru_id: userId,
    status: i.status,
    nilai: tugas.tipe === "nilai" ? (i.nilai ?? null) : null,
    catatan: i.catatan || null,
    tgl_kumpul: i.status === "belum" ? null : hariIni,
  }));

  const { error } = await supabase
    .from("pengumpulan")
    .upsert(rows, { onConflict: "tugas_id,siswa_id" });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/kelas/${tugas.kelas_id}/tugas`);
  revalidatePath(`/kelas/${tugas.kelas_id}/tugas/${tugas_id}`);
  revalidatePath(`/kelas/${tugas.kelas_id}/rekap`);
  return { ok: true };
}
