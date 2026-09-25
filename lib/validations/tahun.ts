import { z } from "zod";

export const tahunSchema = z
  .object({
    nama: z.string().trim().min(4, "Nama minimal 4 karakter").max(20),
    tgl_mulai: z.string().date("Tanggal mulai tidak valid"),
    tgl_selesai: z.string().date("Tanggal selesai tidak valid"),
    batas_semester: z.string().date("Batas semester tidak valid"),
  })
  .refine(
    (d) => d.tgl_mulai < d.batas_semester && d.batas_semester < d.tgl_selesai,
    {
      message: "Urutan harus: mulai < batas semester < selesai",
      path: ["batas_semester"],
    },
  );

export type TahunInput = z.infer<typeof tahunSchema>;
