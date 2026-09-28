"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { kelasSchema } from "@/lib/validations/kelas";
import { mapelBaruSchema } from "@/lib/validations/mapel";
import type { ActionResult, Semester, TahunPelajaran } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/**
 * Tentukan id mapel untuk kelas: pakai yang sudah dipilih, atau buat mapel
 * baru milik guru ini. Mengembalikan pesan galat bila gagal.
 */
async function siapkanMapel(
  supabase: SupabaseClient,
  userId: string,
  data: { mapel_id?: string; mapel_baru?: { nama: string; warna: string } },
): Promise<{ mapelId?: string; error?: string }> {
  if (data.mapel_id) {
    const { data: mapel } = await supabase
      .from("mapel")
      .select("id, guru_id")
      .eq("id", data.mapel_id)
      .maybeSingle();
    if (!mapel || (mapel as { guru_id: string }).guru_id !== userId) {
      return { error: "Mata pelajaran tidak ditemukan" };
    }
    return { mapelId: (mapel as { id: string }).id };
  }

  if (data.mapel_baru) {
    const { data: mapel, error } = await supabase
      .from("mapel")
      .insert({
        guru_id: userId,
        nama: data.mapel_baru.nama,
        warna: data.mapel_baru.warna,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        // Mapel dengan nama sama sudah ada → pakai yang sudah ada.
        const { data: ada } = await supabase
          .from("mapel")
          .select("id")
          .ilike("nama", data.mapel_baru.nama)
          .maybeSingle();
        if (ada) return { mapelId: (ada as { id: string }).id };
        return { error: "Mata pelajaran sudah ada" };
      }
      return { error: error.message };
    }
    revalidatePath("/kelas", "layout");
    return { mapelId: (mapel as { id: string }).id };
  }

  return { error: "Pilih atau buat mata pelajaran dulu" };
}

/** Pastikan semester dipilih ada, milik guru, dan berada di tahun aktif. */
async function ambilSemesterValid(
  supabase: SupabaseClient,
  semesterId: string,
): Promise<{ semester?: Semester; error?: string }> {
  const { data } = await supabase
    .from("semester")
    .select("*, tahun_pelajaran(*)")
    .eq("id", semesterId)
    .maybeSingle();

  if (!data) return { error: "Semester tidak ditemukan" };

  const semester = data as unknown as Semester & {
    tahun_pelajaran: TahunPelajaran;
  };
  if (semester.tahun_pelajaran.status !== "aktif") {
    return { error: "Semester ini bukan bagian dari tahun pelajaran aktif" };
  }
  return { semester };
}

export async function createKelas(input: unknown): Promise<ActionResult> {
  const parsed = kelasSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { supabase, userId } = await getContext();
  if (!userId)
    return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const cek = await ambilSemesterValid(supabase, parsed.data.semester_id);
  if (cek.error) return { ok: false, error: cek.error };
  const semester = cek.semester!;

  const mapel = await siapkanMapel(supabase, userId, parsed.data);
  if (mapel.error) return { ok: false, error: mapel.error };

  const { error } = await supabase.from("kelas").insert({
    tahun_pelajaran_id: semester.tahun_pelajaran_id,
    semester_id: semester.id,
    mapel_id: mapel.mapelId,
    guru_id: userId,
    nama: parsed.data.nama,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error:
          "Kelas dengan nama & mata pelajaran ini sudah ada di semester tersebut",
      };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/kelas", "layout");
  return { ok: true };
}

export async function updateKelas(
  kelasId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = kelasSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { supabase, userId } = await getContext();
  if (!userId)
    return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const cek = await ambilSemesterValid(supabase, parsed.data.semester_id);
  if (cek.error) return { ok: false, error: cek.error };

  const mapel = await siapkanMapel(supabase, userId, parsed.data);
  if (mapel.error) return { ok: false, error: mapel.error };

  const { error } = await supabase
    .from("kelas")
    .update({
      nama: parsed.data.nama,
      semester_id: parsed.data.semester_id,
      mapel_id: mapel.mapelId,
    })
    .eq("id", kelasId);

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error:
          "Kelas dengan nama & mata pelajaran ini sudah ada di semester tersebut",
      };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/kelas", "layout");
  return { ok: true };
}

export async function hapusKelas(kelasId: string): Promise<ActionResult> {
  const { supabase, userId } = await getContext();
  if (!userId)
    return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { error } = await supabase.from("kelas").delete().eq("id", kelasId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/kelas", "layout");
  return { ok: true };
}

/** Perbarui nama / warna sebuah mata pelajaran. */
export async function updateMapel(
  mapelId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = mapelBaruSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { supabase, userId } = await getContext();
  if (!userId)
    return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { error } = await supabase
    .from("mapel")
    .update({ nama: parsed.data.nama, warna: parsed.data.warna })
    .eq("id", mapelId);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Nama mata pelajaran sudah ada" };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/kelas", "layout");
  return { ok: true };
}

/** Hapus mapel. Kelas yang memakainya menjadi tanpa mapel (ON DELETE SET NULL). */
export async function hapusMapel(mapelId: string): Promise<ActionResult> {
  const { supabase, userId } = await getContext();
  if (!userId)
    return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { error } = await supabase.from("mapel").delete().eq("id", mapelId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/kelas", "layout");
  return { ok: true };
}
