import { z } from "zod";

/** Jurnal mengajar bersifat opsional: guru boleh mengisi sebagian saja.
 *  Minimal salah satu kolom isi terisi agar tidak menyimpan jurnal kosong. */
export const simpanJurnalSchema = z
  .object({
    kelas_id: z.string().uuid(),
    tanggal: z.string().date(),
    pertemuan: z.coerce
      .number()
      .int()
      .positive()
      .max(200)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    materi: z.string().trim().max(1000).optional(),
    tujuan: z.string().trim().max(1000).optional(),
    kegiatan: z.string().trim().max(2000).optional(),
    catatan: z.string().trim().max(2000).optional(),
  })
  .refine(
    (d) =>
      Boolean(
        d.materi || d.tujuan || d.kegiatan || d.catatan,
      ),
    { message: "Isi minimal salah satu kolom jurnal" },
  );

export const hapusJurnalSchema = z.object({
  kelas_id: z.string().uuid(),
  tanggal: z.string().date(),
});

export type SimpanJurnalInput = z.infer<typeof simpanJurnalSchema>;