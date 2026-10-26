"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminKelasBaruSchema } from "@/lib/validations/admin-kelas";
import type { ActionResult, Semester, TahunPelajaran } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Tentukan mapel untuk kelas bersama: pakai mapel bersama yang sudah ada,
 * atau buat mapel BERSAMA baru (guru_id = NULL).
 */
async function siapkanMapelAdmin(
  supabase: SupabaseClient,
  data: { mapel_id?: string; mapel_baru?: { nama: string; warna: string } },
): Promise<{ mapelId?: string; error?: string }> {
  if (data.mapel_id) {
    const { data: mapel } = await supabase
      .from("mapel")
      .select("id")
      .eq("id", data.mapel_id)
      .maybeSingle();
    if (!mapel) return { error: "Mata pelajaran tidak ditemukan" };
    return { mapelId: (mapel as { id: string }).id };
  }

  if (data.mapel_baru) {
    const nama = data.mapel_baru.nama.trim();

    // Mapel adalah daftar bersama: pakai yang sudah ada (siapa pun pembuatnya).
    const { data: semua } = await supabase.from("mapel").select("id, nama");
    const sama = ((semua ?? []) as { id: string; nama: string }[]).find(
      (m) => m.nama.trim().toLowerCase() === nama.toLowerCase(),
    );
    if (sama) return { mapelId: sama.id };

    const { data: mapel, error } = await supabase
      .from("mapel")
      .insert({
        guru_id: null,
        nama,
        warna: data.mapel_baru.warna,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        const { data: ulang } = await supabase.from("mapel").select("id, nama");
        const ada = ((ulang ?? []) as { id: string; nama: string }[]).find(
          (m) => m.nama.trim().toLowerCase() === nama.toLowerCase(),
        );
        if (ada) return { mapelId: ada.id };
        return { error: "Mata pelajaran sudah ada" };
      }
      return { error: error.message };
    }
    return { mapelId: (mapel as { id: string }).id };
  }

  return { error: "Pilih atau buat mata pelajaran dulu" };
}

/**
 * Tentukan tahun & semester untuk kelas bersama:
 *   • buat tahun BERSAMA baru (trigger membuat kedua semester otomatis), atau
 *   • pakai tahun & semester bersama yang sudah ada.
 */
async function siapkanTahunDanSemester(
  supabase: SupabaseClient,
  data: {
    tahun_pelajaran_id?: string;
    tahun_baru?: {
      nama: string;
      tgl_mulai: string;
      batas_semester: string;
      tgl_selesai: string;
    };
    semester_id?: string;
    semester_nama?: "ganjil" | "genap";
  },
): Promise<{ tahunId?: string; semesterId?: string; error?: string }> {
  if (data.tahun_baru) {
    const { data: tahun, error } = await supabase
      .from("tahun_pelajaran")
      .insert({
        guru_id: null,
        nama: data.tahun_baru.nama,
        tgl_mulai: data.tahun_baru.tgl_mulai,
        batas_semester: data.tahun_baru.batas_semester,
        tgl_selesai: data.tahun_baru.tgl_selesai,
      })
      .select("id")
      .single();
    if (error) {
      if (error.message.includes("satu_tahun_aktif_global")) {
        return {
          error:
            "Sudah ada tahun pelajaran aktif untuk madrasah ini. Arsipkan dulu di menu Tahun Pelajaran.",
        };
      }
      if (error.code === "23505") {
        return { error: "Tahun pelajaran dengan nama ini sudah ada" };
      }
      return { error: error.message };
    }
    const nama = data.semester_nama ?? "ganjil";
    const { data: sem } = await supabase
      .from("semester")
      .select("id")
      .eq("tahun_pelajaran_id", (tahun as { id: string }).id)
      .eq("nama", nama)
      .maybeSingle();
    if (!sem) return { error: "Semester gagal dibuat otomatis" };
    return {
      tahunId: (tahun as { id: string }).id,
      semesterId: (sem as { id: string }).id,
    };
  }

  // Pakai tahun & semester yang sudah ada.
  if (!data.tahun_pelajaran_id || !data.semester_id) {
    return { error: "Tahun pelajaran & semester belum dipilih" };
  }
  const { data: semData } = await supabase
    .from("semester")
    .select("*, tahun_pelajaran(*)")
    .eq("id", data.semester_id)
    .maybeSingle();
  if (!semData) return { error: "Semester tidak ditemukan" };
  const semester = semData as unknown as Semester & {
    tahun_pelajaran: TahunPelajaran;
  };
  if (semester.tahun_pelajaran_id !== data.tahun_pelajaran_id) {
    return { error: "Tahun pelajaran tidak sesuai dengan semester" };
  }
  if (semester.tahun_pelajaran.status !== "aktif") {
    return { error: "Tahun pelajaran sudah diarsipkan, tidak dapat ditambah" };
  }
  return { tahunId: semester.tahun_pelajaran_id, semesterId: semester.id };
}

/** Buat kelas + daftar santri BERSAMA (guru_id = NULL, hanya admin). */
export async function adminBuatKelas(input: unknown): Promise<ActionResult> {
  const parsed = adminKelasBaruSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir, silakan masuk ulang" };

  // Pastikan benar-benar admin.
  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profil?.role !== "admin") {
    return { ok: false, error: "Hanya admin yang dapat membuat kelas" };
  }

  const { items } = parsed.data;

  const tahun = await siapkanTahunDanSemester(supabase, parsed.data);
  if (tahun.error) return { ok: false, error: tahun.error };

  const mapel = await siapkanMapelAdmin(supabase, parsed.data);
  if (mapel.error) return { ok: false, error: mapel.error };

  const { data: kelasData, error: kelasErr } = await supabase
    .from("kelas")
    .insert({
      tahun_pelajaran_id: tahun.tahunId,
      semester_id: tahun.semesterId,
      mapel_id: mapel.mapelId,
      guru_id: null,
      nama: parsed.data.nama,
    })
    .select("id")
    .single();

  if (kelasErr) {
    if (kelasErr.code === "23505") {
      return {
        ok: false,
        error:
          "Kelas dengan nama & mata pelajaran ini sudah ada di semester tersebut",
      };
    }
    return { ok: false, error: kelasErr.message };
  }

  const siswaRows = items.map((s, i) => ({
    kelas_id: kelasData.id,
    guru_id: null,
    nama: s.nama,
    nis: s.nis?.trim() ? s.nis.trim() : null,
    urutan: i + 1,
  }));

  const { error: siswaErr } = await supabase.from("siswa").insert(siswaRows);
  if (siswaErr) {
    if (siswaErr.code === "23505") {
      return { ok: false, error: "Ada NIS yang duplikat di antara santri" };
    }
    return { ok: false, error: siswaErr.message };
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/kelas", "layout");
  return { ok: true };
}
