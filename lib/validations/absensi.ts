import { z } from "zod";

export const absensiItemSchema = z
  .object({
    siswa_id: z.string().uuid(),
    status: z.enum(["hadir", "sakit", "izin", "alpha"]),
    keterangan: z.string().trim().max(200).optional(),
  })
  .refine(
    (d) => !["sakit", "izin"].includes(d.status) || (d.keterangan?.length ?? 0) > 0,
    { message: "Keterangan wajib diisi untuk Sakit/Izin", path: ["keterangan"] },
  );

export const simpanAbsensiSchema = z.object({
  kelas_id: z.string().uuid(),
  tanggal: z.string().date(),
  items: z.array(absensiItemSchema).min(1),
});

export type AbsensiItem = z.infer<typeof absensiItemSchema>;
