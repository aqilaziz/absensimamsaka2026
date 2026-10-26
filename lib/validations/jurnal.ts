import { z } from "zod";

const jam = z.coerce
  .number()
  .int()
  .min(1, "Jam pelajaran 1–9")
  .max(9, "Jam pelajaran 1–9")
  .optional()
  .or(z.literal("").transform(() => undefined));

/**
 * Jurnal sesi mengajar.
 *
 * Bagian inti: judul sesi + jam pelajaran. Catatan jurnal (topik, materi,
 * metode, refleksi) semuanya opsional — guru boleh menyimpan sesi kosong
 * lebih dulu lalu melengkapinya nanti.
 */
export const simpanJurnalSchema = z.object({
  kelas_id: z.string().uuid(),
  tanggal: z.string().date(),
  judul: z.string().trim().max(200).optional(),
  jam_mulai: jam,
  jam_selesai: jam,
  topik: z.string().trim().max(1000).optional(),
  materi: z.string().trim().max(1000).optional(),
  kegiatan: z.string().trim().max(2000).optional(),
  catatan: z.string().trim().max(2000).optional(),
});

export const hapusJurnalSchema = z.object({
  kelas_id: z.string().uuid(),
  tanggal: z.string().date(),
});

export type SimpanJurnalInput = z.infer<typeof simpanJurnalSchema>;
