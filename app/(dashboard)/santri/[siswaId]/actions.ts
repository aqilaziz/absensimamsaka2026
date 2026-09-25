"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

const updateNisSchema = z.object({
  siswa_id: z.string().uuid(),
  nis: z.string().trim().max(30),
});

export async function updateNis(input: unknown): Promise<ActionResult> {
  const parsed = updateNisSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from("siswa")
    .update({ nis: parsed.data.nis || null })
    .eq("id", parsed.data.siswa_id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "NIS sudah dipakai santri lain di kelas ini" };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath(`/santri/${parsed.data.siswa_id}`);
  return { ok: true };
}
