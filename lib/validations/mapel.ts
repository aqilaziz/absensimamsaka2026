import { z } from "zod";
import { WARNA_MAPEL_LIST } from "@/lib/mapel";

const warnaSchema = z.enum(WARNA_MAPEL_LIST as [string, ...string[]], {
  message: "Warna tidak dikenal",
});

/** Mapel yang sudah ada (dipilih lewat id). */
export const mapelPilihSchema = z.object({
  mapel_id: z.string().uuid("Mata pelajaran belum dipilih"),
});

/** Mapel baru yang dibuat langsung saat membuat kelas. */
export const mapelBaruSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(1, "Nama mata pelajaran wajib diisi")
    .max(60, "Nama mata pelajaran terlalu panjang"),
  warna: warnaSchema.default("emerald"),
});

export const mapelSchema = mapelBaruSchema;

export type MapelBaruInput = z.infer<typeof mapelBaruSchema>;
