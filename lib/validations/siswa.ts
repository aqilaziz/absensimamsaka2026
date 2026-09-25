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

export type SiswaItem = z.infer<typeof siswaItemSchema>;
