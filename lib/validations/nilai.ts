import { z } from "zod";

export { JENIS_NILAI } from "@/lib/nilai";

export const nilaiItemSchema = z.object({
  siswa_id: z.string().uuid(),
  /** null = nilai dikosongkan (baris lama dihapus bila ada). */
  nilai: z.number().min(0).max(100).nullable(),
  catatan: z.string().trim().max(200).optional(),
});

export const simpanNilaiSchema = z.object({
  kelas_id: z.string().uuid(),
  mapel_id: z.string().uuid(),
  tanggal: z.string().date(),
  jenis: z.string().trim().min(1).max(30),
  items: z.array(nilaiItemSchema).min(1),
});

export const hapusNilaiSchema = z.object({
  kelas_id: z.string().uuid(),
  mapel_id: z.string().uuid(),
  tanggal: z.string().date(),
  jenis: z.string().trim().min(1).max(30),
});

export type NilaiItem = z.infer<typeof nilaiItemSchema>;
