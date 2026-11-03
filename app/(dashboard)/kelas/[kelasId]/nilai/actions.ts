"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  hapusNilaiSchema,
  simpanNilaiSchema,
} from "@/lib/validations/nilai";
import type { ActionResult, KelasDetail } from "@/lib/types";

async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/** Kelas harus aktif dan tanggal berada di rentang semester kelas. */
async function cekKelasDanTanggal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kelasId: string,
  tanggal: string,
): Promise<{ ok: true; kelas: KelasDetail } | { ok: false; error: string }> {
  const { data } = await supabase
    .from("kelas")
    .select("*, tahun_pelajaran(*), semester:semester!kelas_semester_id_fkey(*)")
    .eq("id", kelasId)
    .maybeSingle();

  if (!data) return { ok: false, error: "Kelas tidak ditemukan" };
  const kelas = data as unknown as KelasDetail;
  if (kelas.tahun_pelajaran.status !== "aktif") {
    return { ok: false, error: "Tahun pelajaran sudah diarsipkan" };
  }
  const rentang = kelas.semester ?? kelas.tahun_pelajaran;
  if (tanggal < rentang.tgl_mulai || tanggal > rentang.tgl_selesai) {
    return {
      ok: false,
      error: kelas.semester
        ? "Tanggal di luar rentang semester kelas ini"
        : "Tanggal di luar rentang tahun pelajaran",
    };
  }
  return { ok: true, kelas };
}

export async function simpanNilai(input: unknown): Promise<ActionResult> {
  const parsed = simpanNilaiSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { supabase, userId } = await getContext();
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { kelas_id, mapel_id, tanggal, jenis, items } = parsed.data;

  const cek = await cekKelasDanTanggal(supabase, kelas_id, tanggal);
  if (!cek.ok) return cek;

  // Guru hanya boleh menilai mapel yang benar-benar ia ampu di kelas ini.
  const { data: pengampu } = await supabase
    .from("kelas_ajar")
    .select("id")
    .eq("kelas_id", kelas_id)
    .eq("mapel_id", mapel_id)
    .eq("guru_id", userId)
    .limit(1);
  if (!pengampu || pengampu.length === 0) {
    return {
      ok: false,
      error: "Anda belum mengambil mapel ini di kelas tersebut.",
    };
  }

  const terisi = items.filter((i) => i.nilai != null);
  const kosong = items.filter((i) => i.nilai == null).map((i) => i.siswa_id);

  if (terisi.length > 0) {
    const rows = terisi.map((i) => ({
      siswa_id: i.siswa_id,
      kelas_id,
      mapel_id,
      guru_id: userId,
      tanggal,
      jenis,
      nilai: i.nilai,
      catatan: i.catatan?.trim() ? i.catatan.trim() : null,
    }));

    const { error } = await supabase
      .from("nilai_harian")
      .upsert(rows, {
        onConflict: "siswa_id,tanggal,mapel_id,guru_id,jenis",
      });
    if (error) return { ok: false, error: error.message };
  }

  // Nilai yang dikosongkan guru dihapus agar tidak tertinggal nilai lama.
  if (kosong.length > 0) {
    const { error } = await supabase
      .from("nilai_harian")
      .delete()
      .eq("kelas_id", kelas_id)
      .eq("mapel_id", mapel_id)
      .eq("tanggal", tanggal)
      .eq("jenis", jenis)
      .eq("guru_id", userId)
      .in("siswa_id", kosong);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/kelas/${kelas_id}/nilai`);
  revalidatePath(`/kelas/${kelas_id}/rekap`);
  return { ok: true };
}

export async function hapusNilai(input: unknown): Promise<ActionResult> {
  const parsed = hapusNilaiSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { supabase, userId } = await getContext();
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { kelas_id, mapel_id, tanggal, jenis } = parsed.data;

  const cek = await cekKelasDanTanggal(supabase, kelas_id, tanggal);
  if (!cek.ok) return cek;

  const { error } = await supabase
    .from("nilai_harian")
    .delete()
    .eq("kelas_id", kelas_id)
    .eq("mapel_id", mapel_id)
    .eq("tanggal", tanggal)
    .eq("jenis", jenis)
    .eq("guru_id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/kelas/${kelas_id}/nilai`);
  revalidatePath(`/kelas/${kelas_id}/rekap`);
  return { ok: true };
}
