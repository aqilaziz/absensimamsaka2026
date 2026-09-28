import { z } from "zod";
import { mapelBaruSchema } from "./mapel";

export const kelasSchema = z
  .object({
    nama: z.string().trim().min(1, "Nama kelas wajib diisi").max(50),
    semester_id: z.string().uuid("Semester belum dipilih"),
    /** Pilih mata pelajaran yang sudah ada. */
    mapel_id: z.string().uuid().optional(),
    /** Atau buat mata pelajaran baru sekaligus. */
    mapel_baru: mapelBaruSchema.optional(),
  })
  .refine((d) => Boolean(d.mapel_id) || Boolean(d.mapel_baru), {
    message: "Pilih atau buat mata pelajaran dulu",
    path: ["mapel_id"],
  });

export type KelasInput = z.infer<typeof kelasSchema>;
