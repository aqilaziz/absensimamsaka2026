import { z } from "zod";

export const siswaItemSchema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi").max(100),
  nis: z.string().trim().max(30).optional(),
});

export const importSiswaSchema = z.object({
  kelas_id: z.string().uuid(),
  items: z.array(siswaItemSchema).min(1, "Minimal 1 santri"),
});

export const updateSiswaSchema = z.object({
  siswa_id: z.string().uuid(),
  nama: z.string().trim().min(1).max(100),
  nis: z.string().trim().max(30).nullable().optional(),
});

export const hapusBanyakSiswaSchema = z.object({
  siswa_ids: z.array(z.string().uuid()).min(1, "Pilih minimal 1 santri"),
});

/** Salin seluruh santri dari satu kelas (biasanya semester sebelumnya). */
export const salinSiswaSchema = z.object({
  kelas_id: z.string().uuid(),
  kelas_sumber_id: z.string().uuid(),
});

export type SiswaItem = z.infer<typeof siswaItemSchema>;
