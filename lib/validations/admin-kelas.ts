import { z } from "zod";
import { siswaItemSchema } from "./siswa";

/**
 * Tahun pelajaran baru yang dibuat admin (guru_id = NULL).
 */
export const tahunBaruSchema = z.object({
  nama: z.string().trim().min(1, "Nama tahun pelajaran wajib diisi").max(20),
  tgl_mulai: z.string().min(1, "Tanggal mulai wajib diisi"),
  batas_semester: z.string().min(1, "Tanggal batas semester wajib diisi"),
  tgl_selesai: z.string().min(1, "Tanggal selesai wajib diisi"),
});

/**
 * Payload pembuatan rombel oleh admin (guru_id = NULL).
 *
 * Kelas kini murni rombel: tanpa mapel. Admin memilih tahun & semester
 * yang sudah ada, atau membuat tahun baru sekaligus (kedua semester dibuat
 * otomatis oleh trigger). Guru nanti mencentang kelas + mapel lewat
 * halaman "Ambil Kelas".
 */
export const adminKelasBaruSchema = z
  .object({
    /** Pilih tahun yang sudah ada. */
    tahun_pelajaran_id: z.string().uuid().optional(),
    /** Atau buat tahun baru sekaligus. */
    tahun_baru: tahunBaruSchema.optional(),
    /** Semester untuk tahun yang sudah ada. */
    semester_id: z.string().uuid().optional(),
    /** Semester untuk tahun baru (otomatis dibuat oleh trigger). */
    semester_nama: z.enum(["ganjil", "genap"]).default("ganjil"),
    nama: z.string().trim().min(1, "Nama kelas wajib diisi").max(50),
    /** Daftar santri (nama, opsional nis). */
    items: z.array(siswaItemSchema).min(1, "Masukkan minimal 1 santri"),
  })
  .refine((d) => Boolean(d.tahun_pelajaran_id) || Boolean(d.tahun_baru), {
    message: "Pilih atau buat tahun pelajaran dulu",
    path: ["tahun_pelajaran_id"],
  })
  .refine((d) => !d.tahun_pelajaran_id || Boolean(d.semester_id), {
    message: "Pilih semester",
    path: ["semester_id"],
  });

export type AdminKelasBaruInput = z.infer<typeof adminKelasBaruSchema>;
