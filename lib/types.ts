export type StatusTahun = "aktif" | "arsip";
export type StatusAbsensi = "hadir" | "sakit" | "izin" | "alpha";
export type TipePenilaian = "ceklis" | "nilai";
export type StatusKumpul = "belum" | "sudah" | "terlambat";

export interface Profile {
  id: string;
  nama: string;
  created_at: string;
}

export interface TahunPelajaran {
  id: string;
  guru_id: string;
  nama: string;
  tgl_mulai: string;
  tgl_selesai: string;
  batas_semester: string;
  status: StatusTahun;
  created_at: string;
}

export interface Kelas {
  id: string;
  tahun_pelajaran_id: string;
  guru_id: string;
  nama: string;
  created_at: string;
}

export interface Siswa {
  id: string;
  kelas_id: string;
  guru_id: string;
  nama: string;
  nis: string | null;
  urutan: number;
  created_at: string;
}

export interface Absensi {
  id: string;
  siswa_id: string;
  kelas_id: string;
  guru_id: string;
  tanggal: string;
  status: StatusAbsensi;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tugas {
  id: string;
  kelas_id: string;
  guru_id: string;
  judul: string;
  deskripsi: string | null;
  tipe: TipePenilaian;
  nilai_maks: number | null;
  tgl_diberikan: string;
  tgl_tenggat: string | null;
  created_at: string;
}

export interface Pengumpulan {
  id: string;
  tugas_id: string;
  siswa_id: string;
  kelas_id: string;
  guru_id: string;
  status: StatusKumpul;
  nilai: number | null;
  catatan: string | null;
  tgl_kumpul: string | null;
  updated_at: string;
}

export interface RekapAbsensiRow {
  siswa_id: string;
  nama: string;
  nis: string | null;
  urutan: number;
  total_hari: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  persen_hadir: number;
}

export interface RekapTugasRow {
  siswa_id: string;
  nama: string;
  nis: string | null;
  urutan: number;
  total_tugas: number;
  sudah: number;
  belum: number;
  terlambat: number;
  persen_kumpul: number;
  rata_nilai: number | null;
}

export interface RingkasanTugas {
  tugas_id: string;
  kelas_id: string;
  guru_id: string;
  judul: string;
  tipe: TipePenilaian;
  nilai_maks: number | null;
  tgl_diberikan: string;
  tgl_tenggat: string | null;
  total_siswa: number;
  sudah: number;
  belum: number;
  terlambat: number;
  persen_kumpul: number;
  rata_nilai: number | null;
}

export interface BulananSiswa {
  bulan: string;
  total_hari: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  persen_hadir: number;
}

export interface RiwayatTahunRow {
  siswa_id: string;
  tahun_pelajaran_id: string;
  tahun: string;
  status_tahun: StatusTahun;
  kelas_id: string;
  kelas: string;
  total_hari: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  persen_hadir: number;
  total_tugas: number;
  tugas_sudah: number;
  persen_kumpul: number;
  rata_nilai: number | null;
}

export interface KelasDetail extends Kelas {
  tahun_pelajaran: TahunPelajaran;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}
