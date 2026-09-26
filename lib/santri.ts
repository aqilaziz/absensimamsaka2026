import type { SupabaseClient } from "@supabase/supabase-js";
import type { KelasDetail, NamaSemester, Semester } from "./types";

export interface KelasSumber {
  id: string;
  nama: string;
  jumlahSiswa: number;
  semesterNama: NamaSemester;
  tahunNama: string;
}

export interface SemesterSumber {
  semester: Semester;
  tahunNama: string;
  tahunId: string;
  /** Kelas pada semester sebelumnya milik guru yang sama. */
  kelasList: KelasSumber[];
  /** Kelas yang namanya sama dengan kelas saat ini (pra-pilih otomatis). */
  saranKelasId: string | null;
}

/**
 * Cari semester "sebelumnya" untuk sebuah kelas.
 *
 * Alur yang dimaksud: santri semester Ganjil umumnya sama dengan santri
 * semester Genap sebelumnya (bila tidak ada perubahan). Karena itu sumber
 * diambil dari semester dengan `tgl_selesai` terbesar yang masih lebih awal
 * daripada `tgl_mulai` semester kelas ini — lintas tahun pelajaran sekalipun.
 */
export async function cariSemesterSumber(
  supabase: SupabaseClient,
  kelas: KelasDetail,
): Promise<SemesterSumber | null> {
  const tglMulai = kelas.semester?.tgl_mulai ?? kelas.tahun_pelajaran.tgl_mulai;

  const { data: semData } = await supabase
    .from("semester")
    .select("*, tahun_pelajaran(nama)")
    .lt("tgl_selesai", tglMulai)
    .order("tgl_selesai", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!semData) return null;

  const semester = semData as unknown as Semester & {
    tahun_pelajaran: { nama: string };
  };

  const { data: kelasData } = await supabase
    .from("kelas")
    .select(
      "id, nama, semester:semester!kelas_semester_id_fkey(nama), siswa(count)",
    )
    .eq("semester_id", semester.id)
    .order("nama");

  const kelasList: KelasSumber[] = (
    (kelasData ?? []) as unknown as {
      id: string;
      nama: string;
      semester: { nama: NamaSemester } | null;
      siswa: { count: number }[];
    }[]
  ).map((k) => ({
    id: k.id,
    nama: k.nama,
    jumlahSiswa: k.siswa?.[0]?.count ?? 0,
    semesterNama: k.semester?.nama ?? semester.nama,
    tahunNama: semester.tahun_pelajaran.nama,
  }));

  if (kelasList.length === 0) return null;

  const sama = kelasList.find((k) => k.nama === kelas.nama);

  return {
    semester,
    tahunNama: semester.tahun_pelajaran.nama,
    tahunId: semester.tahun_pelajaran_id,
    kelasList,
    saranKelasId: sama?.id ?? kelasList[0].id,
  };
}
