import { z } from "zod";

// Keterangan bersifat opsional untuk semua status (sakit/izin tidak wajib
// memberi alasan) — guru bisa menyimpan walau kolomnya dikosongkan.
export const absensiItemSchema = z.object({
  siswa_id: z.string().uuid(),
  status: z.enum(["hadir", "sakit", "izin", "alpha"]),
  keterangan: z.string().trim().max(200).optional(),
});

export const simpanAbsensiSchema = z.object({
  kelas_id: z.string().uuid(),
  mapel_id: z.string().uuid(),
  tanggal: z.string().date(),
  items: z.array(absensiItemSchema).min(1),
});

/** Hapus seluruh absensi satu kelas pada satu tanggal. */
export const hapusAbsensiSchema = z.object({
  kelas_id: z.string().uuid(),
  mapel_id: z.string().uuid(),
  tanggal: z.string().date(),
});

export type AbsensiItem = z.infer<typeof absensiItemSchema>;
