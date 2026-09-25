-- ============================================================
-- 0001_schema.sql — Aplikasi Absensi & Tugas Santri
-- Jalankan berurutan: 0001 → 0002 (RLS) → 0003 (trigger) → 0004 (view/rpc)
-- ============================================================

create extension if not exists pgcrypto;

-- ===== ENUM =====
create type status_tahun as enum ('aktif', 'arsip');
create type status_absensi as enum ('hadir', 'sakit', 'izin', 'alpha');
create type tipe_penilaian as enum ('ceklis', 'nilai');
create type status_kumpul as enum ('belum', 'sudah', 'terlambat');

-- ===== PROFILES (extends auth.users) =====
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nama        text not null,
  created_at  timestamptz default now()
);

-- ===== TAHUN PELAJARAN =====
create table tahun_pelajaran (
  id              uuid primary key default gen_random_uuid(),
  guru_id         uuid not null references profiles(id) on delete cascade,
  nama            text not null,                 -- "2026/2027"
  tgl_mulai       date not null,
  tgl_selesai     date not null,
  batas_semester  date not null,                 -- tgl terakhir semester ganjil
  status          status_tahun not null default 'aktif',
  created_at      timestamptz default now(),
  unique (guru_id, nama),
  constraint rentang_tahun_valid check (tgl_mulai < batas_semester and batas_semester < tgl_selesai)
);

-- Hanya satu tahun aktif per guru
create unique index one_active_year_per_guru
  on tahun_pelajaran (guru_id) where status = 'aktif';

-- ===== KELAS =====
create table kelas (
  id                  uuid primary key default gen_random_uuid(),
  tahun_pelajaran_id  uuid not null references tahun_pelajaran(id) on delete cascade,
  guru_id             uuid not null references profiles(id) on delete cascade,
  nama                text not null,             -- "XII IPA 1"
  created_at          timestamptz default now(),
  unique (tahun_pelajaran_id, nama)
);

-- ===== SISWA (satu baris = satu santri di satu kelas di satu tahun) =====
create table siswa (
  id          uuid primary key default gen_random_uuid(),   -- id unik per pendaftaran kelas
  kelas_id    uuid not null references kelas(id) on delete cascade,
  guru_id     uuid not null references profiles(id) on delete cascade,
  nama        text not null,
  nis         text,                              -- Nomor Induk Santri: kunci identitas lintas tahun
  urutan      int not null default 0,
  created_at  timestamptz default now()
);
create index siswa_kelas_idx on siswa (kelas_id, urutan);
-- NIS tidak boleh ganda dalam satu kelas (null diabaikan)
create unique index siswa_nis_per_kelas on siswa (kelas_id, nis) where nis is not null;
-- Untuk mencari riwayat santri yang sama di semua tahun
create index siswa_guru_nis_idx on siswa (guru_id, nis) where nis is not null;

-- ===== ABSENSI =====
create table absensi (
  id          uuid primary key default gen_random_uuid(),
  siswa_id    uuid not null references siswa(id) on delete cascade,
  kelas_id    uuid not null references kelas(id) on delete cascade,
  guru_id     uuid not null references profiles(id) on delete cascade,
  tanggal     date not null,
  status      status_absensi not null,
  keterangan  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (siswa_id, tanggal),
  -- Sakit & Izin wajib keterangan
  constraint keterangan_wajib check (
    status in ('hadir', 'alpha')
    or (keterangan is not null and length(trim(keterangan)) > 0)
  )
);
create index absensi_kelas_tgl_idx on absensi (kelas_id, tanggal);
create index absensi_siswa_tgl_idx on absensi (siswa_id, tanggal);

-- ===== TUGAS / KEGIATAN =====
create table tugas (
  id              uuid primary key default gen_random_uuid(),
  kelas_id        uuid not null references kelas(id) on delete cascade,
  guru_id         uuid not null references profiles(id) on delete cascade,
  judul           text not null,
  deskripsi       text,
  tipe            tipe_penilaian not null default 'ceklis',
  nilai_maks      numeric(5,2),                  -- wajib jika tipe = 'nilai'
  tgl_diberikan   date not null default current_date,
  tgl_tenggat     date,
  created_at      timestamptz default now(),
  constraint nilai_maks_wajib check (
    tipe = 'ceklis' or (nilai_maks is not null and nilai_maks > 0)
  )
);
create index tugas_kelas_idx on tugas (kelas_id, tgl_diberikan desc);

-- ===== PENGUMPULAN (1 baris per siswa per tugas) =====
create table pengumpulan (
  id            uuid primary key default gen_random_uuid(),
  tugas_id      uuid not null references tugas(id) on delete cascade,
  siswa_id      uuid not null references siswa(id) on delete cascade,
  kelas_id      uuid not null references kelas(id) on delete cascade,
  guru_id       uuid not null references profiles(id) on delete cascade,
  status        status_kumpul not null default 'belum',
  nilai         numeric(5,2),
  catatan       text,
  tgl_kumpul    date,
  updated_at    timestamptz default now(),
  unique (tugas_id, siswa_id),
  constraint nilai_non_negatif check (nilai is null or nilai >= 0)
);
create index pengumpulan_tugas_idx on pengumpulan (tugas_id);
create index pengumpulan_siswa_idx on pengumpulan (siswa_id);
