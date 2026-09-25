import { z } from "zod";

export const tahunSchema = z.object({
  nama: z
    .string()
    .trim()
    .regex(/^\d{4}\/\d{4}$/, "Format nama harus YYYY/YYYY, mis. 2026/2027")
    .refine(
      (nama) => {
        const [awal, akhir] = nama.split("/").map(Number);
        return akhir === awal + 1;
      },
      {
        message: "Tahun kedua harus tahun pertama + 1, mis. 2026/2027",
        path: ["nama"],
      },
    ),
});

export type TahunInput = z.infer<typeof tahunSchema>;
