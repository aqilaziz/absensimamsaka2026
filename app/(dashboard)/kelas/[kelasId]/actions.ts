"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  updateSiswaSchema,
  hapusBanyakSiswaSchema,
  salinSiswaSchema,
} from "@/lib/validations/siswa";
import { ambilKelasDetail, sebagaiKelasDetail } from "@/lib/kelas";
import type { ActionResult, Siswa } from "@/lib/types";

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
  // Hanya area kelas yang terpengaruh (sidebar tidak menampilkan data santri),
  // jadi cukup invalidasi segmen /kelas — jauh lebih murah daripada "/" layout.
  revalidatePath("/kelas", "layout");
  return { ok: true };
}

export async function hapusSiswa(siswaId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("siswa").delete().eq("id", siswaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/kelas", "layout");
  return { ok: true };
}

export async function hapusBanyakSiswa(input: unknown): Promise<ActionResult> {
  const parsed = hapusBanyakSiswaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("siswa")
    .delete()
    .in("id", parsed.data.siswa_ids);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/kelas", "layout");
  return { ok: true };
}

/**
 * Salin seluruh santri dari kelas lain (biasanya kelas semester sebelumnya)
 * ke kelas ini. Dipakai saat semester ganjil: bila tidak ada perubahan,
 * daftar santri boleh sama dengan semester genap sebelumnya.
 *
 * Santri yang NIS-nya sudah ada di kelas tujuan dilewati (tidak diduplikasi),
 * dan santri tanpa NIS dilewati jika namanya sudah sama.
 */
export async function salinSiswaDariKelas(
  input: unknown,
): Promise<ActionResult & { disalin?: number; dilewati?: number }> {
  const parsed = salinSiswaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { kelas_id, kelas_sumber_id } = parsed.data;
  if (kelas_id === kelas_sumber_id) {
    return { ok: false, error: "Kelas sumber harus berbeda dari kelas ini" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  const { data: kelasData } = await ambilKelasDetail(supabase, kelas_id);
  if (!kelasData) return { ok: false, error: "Kelas tidak ditemukan" };
  const kelas = sebagaiKelasDetail(kelasData);
  if (kelas.tahun_pelajaran.status !== "aktif") {
    return {
      ok: false,
      error: "Tahun pelajaran sudah diarsipkan, santri tidak dapat ditambah",
    };
  }

  const [{ data: sumberData }, { data: tujuanData }, { count: jumlahTujuan }] =
    await Promise.all([
      supabase
        .from("siswa")
        .select("nama, nis, urutan")
        .eq("kelas_id", kelas_sumber_id)
        .order("urutan"),
      supabase.from("siswa").select("nama, nis").eq("kelas_id", kelas_id),
      supabase
        .from("siswa")
        .select("id", { count: "exact", head: true })
        .eq("kelas_id", kelas_id),
    ]);

  const sumber = (sumberData ?? []) as Pick<Siswa, "nama" | "nis" | "urutan">[];
  if (sumber.length === 0) {
    return { ok: false, error: "Kelas sumber tidak memiliki santri" };
  }

  const tujuan = (tujuanData ?? []) as Pick<Siswa, "nama" | "nis">[];
  const nisTujuan = new Set(
    tujuan.map((s) => s.nis).filter((n): n is string => !!n),
  );
  const namaTanpaNisTujuan = new Set(
    tujuan.filter((s) => !s.nis).map((s) => s.nama.trim().toLowerCase()),
  );

  let urutanBerikut = jumlahTujuan ?? 0;
  const rows: {
    kelas_id: string;
    guru_id: string;
    nama: string;
    nis: string | null;
    urutan: number;
  }[] = [];
  const nisBaru = new Set<string>();
  let dilewati = 0;

  for (const s of sumber) {
    const nis = s.nis?.trim() || null;
    if (nis && (nisTujuan.has(nis) || nisBaru.has(nis))) {
      dilewati++;
      continue;
    }
    if (!nis && namaTanpaNisTujuan.has(s.nama.trim().toLowerCase())) {
      dilewati++;
      continue;
    }
    if (nis) nisBaru.add(nis);
    rows.push({
      kelas_id,
      guru_id: user.id,
      nama: s.nama,
      nis,
      urutan: ++urutanBerikut,
    });
  }

  if (rows.length === 0) {
    return {
      ok: false,
      error: `Tidak ada santri baru untuk disalin (${dilewati} santri sudah ada di kelas ini)`,
    };
  }

  const { error } = await supabase.from("siswa").insert(rows);
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ada NIS yang bentrok di kelas ini" };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/kelas", "layout");
  return { ok: true, disalin: rows.length, dilewati };
}
