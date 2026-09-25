"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { importSiswaSchema } from "@/lib/validations/siswa";
import type { ActionResult } from "@/lib/types";

export async function importSiswa(input: unknown): Promise<ActionResult> {
  const parsed = importSiswaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const kelasId = parsed.data.kelas_id;

  // Lanjutkan nomor urut dari santri yang sudah ada
  const { data: existing } = await supabase
    .from("siswa")
    .select("urutan")
    .eq("kelas_id", kelasId)
    .order("urutan", { ascending: false })
    .limit(1);
  const mulaiUrutan = (existing?.[0]?.urutan ?? 0) + 1;

  const rows = parsed.data.items.map((s, i) => ({
    kelas_id: kelasId,
    guru_id: user.id,
    nama: s.nama,
    nis: s.nis?.trim() ? s.nis.trim() : null,
    urutan: mulaiUrutan + i,
  }));

  const { error } = await supabase.from("siswa").insert(rows);
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ada NIS yang sudah dipakai di kelas ini" };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath(`/kelas/${kelasId}`);
  return { ok: true };
}
