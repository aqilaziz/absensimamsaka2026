"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tahunSchema } from "@/lib/validations/tahun";
import type { ActionResult } from "@/lib/types";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function createTahun(input: unknown): Promise<ActionResult> {
  const parsed = tahunSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { supabase, userId } = await getUserId();
  if (!userId)
    return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  // Tanggal semester otomatis dari nama tahun:
  // Ganjil 1 Juli–31 Des (tahun pertama), Genap 1 Jan–30 Jun (tahun kedua).
  const [awal, akhir] = parsed.data.nama.split("/").map(Number);
  const row = {
    nama: parsed.data.nama,
    guru_id: userId,
    tgl_mulai: `${awal}-07-01`,
    batas_semester: `${awal}-12-31`,
    tgl_selesai: `${akhir}-06-30`,
  };

  const { error } = await supabase.from("tahun_pelajaran").insert(row);

  if (error) {
    if (error.message.includes("one_active_year_per_guru")) {
      return {
        ok: false,
        error:
          "Masih ada tahun pelajaran aktif. Arsipkan dulu sebelum membuat baru.",
      };
    }
    if (error.code === "23505") {
      return { ok: false, error: "Nama tahun pelajaran sudah dipakai" };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateTahun(
  tahunId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = tahunSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { supabase, userId } = await getUserId();
  if (!userId)
    return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  // Tanggal ikut dihitung ulang dari nama (aturan semester tetap).
  const [awal, akhir] = parsed.data.nama.split("/").map(Number);
  const row = {
    nama: parsed.data.nama,
    tgl_mulai: `${awal}-07-01`,
    batas_semester: `${awal}-12-31`,
    tgl_selesai: `${akhir}-06-30`,
  };

  const { error } = await supabase
    .from("tahun_pelajaran")
    .update(row)
    .eq("id", tahunId);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Nama tahun pelajaran sudah dipakai" };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function arsipkanTahun(tahunId: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId)
    return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { error } = await supabase
    .from("tahun_pelajaran")
    .update({ status: "arsip" })
    .eq("id", tahunId)
    .eq("status", "aktif");

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function hapusTahun(tahunId: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId)
    return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  // Hanya tahun aktif yang bisa dihapus dari aplikasi; tahun arsip dikunci
  // oleh trigger database agar riwayat tidak hilang.
  const { error } = await supabase
    .from("tahun_pelajaran")
    .delete()
    .eq("id", tahunId)
    .eq("status", "aktif");

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
