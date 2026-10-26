export type StatusTahun = "aktif" | "arsip";
export type StatusAbsensi = "hadir" | "sakit" | "izin" | "alpha";
export type TipePenilaian = "ceklis" | "nilai";
export type StatusKumpul = "belum" | "sudah" | "terlambat";
export type NamaSemester = "ganjil" | "genap";
export type Role = "guru" | "admin";

/** Kunci palet warna tema mata pelajaran (lihat lib/mapel.ts). */
export type WarnaMapel =
  | "emerald"
  | "sky"
  | "violet"
  | "amber"
  | "rose"
  | "teal"
  | "indigo"
  | "orange"
  | "cyan"
  | "fuchsia";

export interface Profile {
  id: string;
  nama: string;
  role: Role;
  created_at: string;
}

/** Baris rekap per kelas untuk Dashboard Admin (view v_admin_rekap_kelas). */
export interface AdminKelasRow {
  kelas_id: string;
  /** ID baris pengampu; NULL bila kelas belum diambil guru mana pun. */
  pengampu_id: string | null;
  /** Guru pengampu; NULL bila belum ada. */
  guru_id: string | null;
  guru: string;
  kelas: string;
  tahun_id: string;
  tahun: string;
  semester: NamaSemester;
  mapel: string | null;
  mapel_warna: WarnaMapel | null;
  jumlah_santri: number;
  total_hari: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  persen_hadir: number | null;
}

/** Semester anak dari tahun pelajaran; tanggalnya diturunkan dari
 *  tgl_mulai / batas_semester / tgl_selesai oleh trigger database. */
export interface Semester {
  id: string;
  tahun_pelajaran_id: string;
  /** NULL bila semester milik tahun bersama (dibuat admin). */
  guru_id: string | null;
  nama: NamaSemester;
  urutan: number;
  tgl_mulai: string;
  tgl_selesai: string;
  created_at: string;
}

export interface TahunPelajaran {
  id: string;
  /** NULL bila tahun bersama (dibuat admin); selain itu id pembuat. */
  guru_id: string | null;
  nama: string;
  tgl_mulai: string;
  tgl_selesai: string;
  batas_semester: string;
  status: StatusTahun;
  created_at: string;
}

export interface Mapel {
  id: string;
  /** NULL bila mapel bersama (dibuat admin). */
  guru_id: string | null;
  nama: string;
  warna: WarnaMapel;
  created_at: string;
}

/** Rombel: kelas tidak lagi menempel pada satu mapel. Mapel ditentukan
 *  lewat pengampu (lihat `KelasAjar`). */
export interface Kelas {
  id: string;
  tahun_pelajaran_id: string;
  semester_id: string;
  /** Dibuat admin; NULL untuk data lama. */
  guru_id: string | null;
  nama: string;
  created_at: string;
}

/** Pengampu: guru yang mencentang sebuah kelas untuk satu mapel. */
export interface KelasAjar {
  id: string;
  kelas_id: string;
  mapel_id: string;
  guru_id: string;
  created_at: string;
}

export interface Siswa {
  id: string;
  kelas_id: string;
  /** NULL bila santri didaftarkan admin. */
  guru_id: string | null;
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

export interface Jurnal {
  id: string;
  kelas_id: string;
  guru_id: string;
  tanggal: string;
  pertemuan: number | null;
  materi: string | null;
  tujuan: string | null;
  kegiatan: string | null;
  catatan: string | null;
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
  semester: NamaSemester;
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
  semester?: Semester;
  /** Mapel yang diampu guru yang sedang login di kelas ini (diisi per halaman). */
  mapel?: Mapel | null;
  /** Seluruh pengampu kelas ini (dipakai halaman admin). */
  pengampu?: (KelasAjar & {
    mapel?: Pick<Mapel, "nama" | "warna"> | null;
  })[];
}

/** Hasil pencarian santri: data santri + kelas induknya (beserta tahun). */
export interface HasilCariSantri extends Siswa {
  kelas: KelasDetail;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}
