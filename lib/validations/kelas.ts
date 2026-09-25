import { z } from "zod";

export const kelasSchema = z.object({
  nama: z.string().trim().min(1, "Nama kelas wajib diisi").max(50),
});

export type KelasInput = z.infer<typeof kelasSchema>;
