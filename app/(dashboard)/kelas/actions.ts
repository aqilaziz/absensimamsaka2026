"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { kelasSchema } from "@/lib/validations/kelas";
import type { ActionResult } from "@/lib/types";

async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function createKelas(input: unknown): Promise<ActionResult> {
  const parsed = kelasSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { supabase, userId } = await getContext();
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { data: tahun } = await supabase
    .from("tahun_pelajaran")
    .select("id")
    .eq("status", "aktif")
    .maybeSingle();

  if (!tahun) {
    return { ok: false, error: "Belum ada tahun pelajaran aktif" };
  }

  const { error } = await supabase.from("kelas").insert({
    tahun_pelajaran_id: tahun.id,
    guru_id: userId,
    nama: parsed.data.nama,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Nama kelas sudah ada di tahun ini" };
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
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { error } = await supabase
    .from("kelas")
    .update({ nama: parsed.data.nama })
    .eq("id", kelasId);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Nama kelas sudah ada di tahun ini" };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function hapusKelas(kelasId: string): Promise<ActionResult> {
  const { supabase, userId } = await getContext();
  if (!userId) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { error } = await supabase.from("kelas").delete().eq("id", kelasId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
