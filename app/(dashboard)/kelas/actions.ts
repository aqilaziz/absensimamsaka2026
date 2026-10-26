"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { kelasSchema } from "@/lib/validations/kelas";
import { mapelBaruSchema } from "@/lib/validations/mapel";
import type { ActionResult, Semester, TahunPelajaran } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Semua aksi di file ini hanya untuk admin: kelas, mapel, dan tahun
 * pelajaran adalah data master yang disiapkan admin. Guru hanya mencentang
 * (lihat `ambil-kelas/actions.ts`).
 */
async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, userId: null, isAdmin: false };

  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    supabase,
    userId: user.id,
    isAdmin: (profil as { role?: string } | null)?.role === "admin",
  };
}

const HANYA_ADMIN = "Hanya admin yang dapat mengubah data ini";

/** Pastikan semester ada dan berada di tahun yang masih aktif. */
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
  const { supabase, userId, isAdmin } = await getContext();
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };
  if (!isAdmin) return { ok: false, error: HANYA_ADMIN };

  const cek = await ambilSemesterValid(supabase, parsed.data.semester_id);
  if (cek.error) return { ok: false, error: cek.error };
  const semester = cek.semester!;

  const { error } = await supabase.from("kelas").insert({
    tahun_pelajaran_id: semester.tahun_pelajaran_id,
    semester_id: semester.id,
    guru_id: null,
    nama: parsed.data.nama,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Kelas dengan nama ini sudah ada di semester tersebut",
      };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/kelas", "layout");
  revalidatePath("/ambil-kelas");
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
  const { supabase, userId, isAdmin } = await getContext();
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };
  if (!isAdmin) return { ok: false, error: HANYA_ADMIN };

  const cek = await ambilSemesterValid(supabase, parsed.data.semester_id);
  if (cek.error) return { ok: false, error: cek.error };

  const { error } = await supabase
    .from("kelas")
    .update({
      nama: parsed.data.nama,
      semester_id: parsed.data.semester_id,
    })
    .eq("id", kelasId);

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Kelas dengan nama ini sudah ada di semester tersebut",
      };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/kelas", "layout");
  revalidatePath("/ambil-kelas");
  return { ok: true };
}

export async function hapusKelas(kelasId: string): Promise<ActionResult> {
  const { supabase, userId, isAdmin } = await getContext();
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };
  if (!isAdmin) return { ok: false, error: HANYA_ADMIN };

  const { error } = await supabase.from("kelas").delete().eq("id", kelasId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/kelas", "layout");
  revalidatePath("/ambil-kelas");
  return { ok: true };
}

/** Tambah mata pelajaran (master admin). */
export async function buatMapel(input: unknown): Promise<ActionResult> {
  const parsed = mapelBaruSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { supabase, userId, isAdmin } = await getContext();
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };
  if (!isAdmin) return { ok: false, error: HANYA_ADMIN };

  const { error } = await supabase.from("mapel").insert({
    guru_id: null,
    nama: parsed.data.nama,
    warna: parsed.data.warna,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Nama mata pelajaran sudah ada" };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/kelas", "layout");
  revalidatePath("/ambil-kelas");
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
  const { supabase, userId, isAdmin } = await getContext();
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };
  if (!isAdmin) return { ok: false, error: HANYA_ADMIN };

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
  revalidatePath("/ambil-kelas");
  return { ok: true };
}

/** Hapus mapel. Pengampu yang memakainya ikut terhapus (cascade). */
export async function hapusMapel(mapelId: string): Promise<ActionResult> {
  const { supabase, userId, isAdmin } = await getContext();
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };
  if (!isAdmin) return { ok: false, error: HANYA_ADMIN };

  const { error } = await supabase.from("mapel").delete().eq("id", mapelId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/kelas", "layout");
  revalidatePath("/ambil-kelas");
  return { ok: true };
}
