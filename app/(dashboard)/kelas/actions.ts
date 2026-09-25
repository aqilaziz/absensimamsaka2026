"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { kelasSchema } from "@/lib/validations/kelas";
import type { ActionResult, Semester, TahunPelajaran } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
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

  const { error } = await supabase.from("kelas").insert({
    tahun_pelajaran_id: semester.tahun_pelajaran_id,
    semester_id: semester.id,
    guru_id: userId,
    nama: parsed.data.nama,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Nama kelas sudah ada di semester ini" };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/", "layout");
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

  const { error } = await supabase
    .from("kelas")
    .update({ nama: parsed.data.nama, semester_id: parsed.data.semester_id })
    .eq("id", kelasId);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Nama kelas sudah ada di semester ini" };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function hapusKelas(kelasId: string): Promise<ActionResult> {
  const { supabase, userId } = await getContext();
  if (!userId)
    return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { error } = await supabase.from("kelas").delete().eq("id", kelasId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
