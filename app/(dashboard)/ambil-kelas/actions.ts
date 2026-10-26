"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ambilKelasSchema } from "@/lib/validations/kelas";
import type { ActionResult } from "@/lib/types";

/**
 * Guru mencentang sebuah kelas untuk satu mapel.
 * Keunikan (kelas, mapel) dijaga database, jadi satu mapel di satu kelas
 * hanya diampu satu guru.
 */
export async function ambilKelas(input: unknown): Promise<ActionResult> {
  const parsed = ambilKelasSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { error } = await supabase.from("kelas_ajar").insert({
    kelas_id: parsed.data.kelas_id,
    mapel_id: parsed.data.mapel_id,
    guru_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Kelas ini sudah diambil untuk mapel tersebut",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/ambil-kelas");
  revalidatePath("/kelas");
  revalidatePath("/");
  return { ok: true };
}

/** Guru melepas kelas yang sudah diambil (centang dibatalkan). */
export async function lepasKelas(pengampuId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { error } = await supabase
    .from("kelas_ajar")
    .delete()
    .eq("id", pengampuId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/ambil-kelas");
  revalidatePath("/kelas");
  revalidatePath("/");
  return { ok: true };
}
