import { z } from "zod";

export const tugasSchema = z
  .object({
    judul: z.string().trim().min(1, "Judul wajib diisi").max(150),
    deskripsi: z.string().trim().max(1000).optional(),
    tipe: z.enum(["ceklis", "nilai"]),
    nilai_maks: z.coerce.number().positive().max(1000).optional(),
    tgl_diberikan: z.string().date(),
    tgl_tenggat: z.string().date().optional(),
  })
  .refine((d) => d.tipe === "ceklis" || d.nilai_maks !== undefined, {
    message: "Nilai maksimal wajib untuk tipe nilai",
    path: ["nilai_maks"],
  })
  .refine((d) => !d.tgl_tenggat || d.tgl_tenggat >= d.tgl_diberikan, {
    message: "Tenggat tidak boleh sebelum tanggal diberikan",
    path: ["tgl_tenggat"],
  });

export const pengumpulanItemSchema = z.object({
  siswa_id: z.string().uuid(),
  status: z.enum(["belum", "sudah", "terlambat"]),
  nilai: z.coerce.number().min(0).nullable().optional(),
  catatan: z.string().trim().max(200).optional(),
});

export const simpanPengumpulanSchema = z.object({
  tugas_id: z.string().uuid(),
  items: z.array(pengumpulanItemSchema).min(1),
});

export type TugasInput = z.infer<typeof tugasSchema>;
export type PengumpulanItem = z.infer<typeof pengumpulanItemSchema>;
