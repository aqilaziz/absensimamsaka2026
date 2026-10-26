import { z } from "zod";

/**
 * Kelas = rombel. Mapel tidak lagi menempel di kelas; guru memilih mapel
 * lewat halaman "Ambil Kelas" (tabel pengampu).
 */
export const kelasSchema = z.object({
  nama: z.string().trim().min(1, "Nama kelas wajib diisi").max(50),
  semester_id: z.string().uuid("Semester belum dipilih"),
});

export type KelasInput = z.infer<typeof kelasSchema>;

/** Guru mengambil (mencentang) sebuah kelas untuk satu mapel. */
export const ambilKelasSchema = z.object({
  kelas_id: z.string().uuid("Kelas tidak dikenal"),
  mapel_id: z.string().uuid("Pilih mata pelajaran dulu"),
});

export type AmbilKelasInput = z.infer<typeof ambilKelasSchema>;

