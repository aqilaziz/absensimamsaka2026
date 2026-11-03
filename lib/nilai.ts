/** Pilihan jenis penilaian harian (dipakai UI & validasi). */
export const JENIS_NILAI = [
  "Harian",
  "Kuis",
  "Hafalan",
  "Praktik",
  "Ulangan",
] as const;

export type JenisNilai = (typeof JENIS_NILAI)[number];
