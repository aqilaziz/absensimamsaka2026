import { z } from "zod";
import { mapelBaruSchema } from "./mapel";
import { siswaItemSchema } from "./siswa";

/**
 * Tahun pelajaran bersama baru yang dibuat admin (guru_id = NULL).
 */
export const tahunBaruSchema = z.object({
  nama: z.string().trim().min(1, "Nama tahun pelajaran wajib diisi").max(20),
  tgl_mulai: z.string().min(1, "Tanggal mulai wajib diisi"),
  batas_semester: z.string().min(1, "Tanggal batas semester wajib diisi"),
  tgl_selesai: z.string().min(1, "Tanggal selesai wajib diisi"),
});

/**
 * Payload pembuatan kelas BERSAMA oleh admin (guru_id = NULL).
 *
 * Admin bisa:
 *   • memakai tahun pelajaran bersama yang sudah ada (tahun_pelajaran_id +
 *     semester_id), atau membuat tahun bersama baru sekaligus (tahun_baru —
 *     kedua semester dibuat otomatis oleh trigger);
 *   • memakai mapel bersama yang sudah ada (mapel_id), atau membuat mapel
 *     bersama baru sekaligus (mapel_baru).
 * Seluruh hasilnya menjadi milik bersama → bisa dipakai semua guru.
 */
export const adminKelasBaruSchema = z
  .object({
    /** Pilih tahun bersama yang sudah ada. */
    tahun_pelajaran_id: z.string().uuid().optional(),
    /** Atau buat tahun bersama baru sekaligus. */
    tahun_baru: tahunBaruSchema.optional(),
    /** Semester untuk tahun yang sudah ada. */
    semester_id: z.string().uuid().optional(),
    /** Semester untuk tahun baru (otomatis dibuat oleh trigger). */
    semester_nama: z.enum(["ganjil", "genap"]).default("ganjil"),
    /** Pilih mapel bersama yang sudah ada. */
    mapel_id: z.string().uuid().optional(),
    /** Atau buat mapel bersama baru sekaligus. */
    mapel_baru: mapelBaruSchema.optional(),
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
  })
  .refine((d) => Boolean(d.mapel_id) || Boolean(d.mapel_baru), {
    message: "Pilih atau buat mata pelajaran dulu",
    path: ["mapel_id"],
  });

export type AdminKelasBaruInput = z.infer<typeof adminKelasBaruSchema>;
