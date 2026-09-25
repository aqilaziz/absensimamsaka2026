"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateSiswaSchema } from "@/lib/validations/siswa";
import type { ActionResult } from "@/lib/types";

export async function updateSiswa(input: unknown): Promise<ActionResult> {
  const parsed = updateSiswaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from("siswa")
    .update({
      nama: parsed.data.nama,
      nis: parsed.data.nis?.trim() ? parsed.data.nis.trim() : null,
    })
    .eq("id", parsed.data.siswa_id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "NIS sudah dipakai santri lain di kelas ini" };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function hapusSiswa(siswaId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("siswa").delete().eq("id", siswaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
