-- ============================================================
-- 0008_role_admin.sql — Dashboard Admin (lihat kehadiran semua guru)
--
-- Perubahan:
--   1. Kolom `profiles.role` sebagai 'guru' | 'admin' (default 'guru').
--   2. Policy RLS tambahan: admin boleh MEMBACA semua data lintas guru
--      (read-only). Mutasi (insert/update/delete) tetap terbatas pada
--      data milik sendiri, sehingga admin murni pengamat.
--   3. View `v_admin_rekap_kelas` untuk rekap ringkas per kelas
--      (guru + kelas + semester + mapel + statistik absensi).
--
-- Cara menjadikan user sebagai admin (jalankan di SQL Editor):
--   update profiles set role = 'admin' where nama = 'Nama Guru';
--
-- Jalankan setelah 0007_mapel.sql
-- ============================================================

-- ===== ROLE PROFIL =====
create type peran as enum ('guru', 'admin');

alter table profiles add column role peran not null default 'guru';

-- Helper: role user saat ini. security definer → berjalan sebagai pemilik
-- tabel (postgres) sehingga bebas RLS; terhindar dari infinite recursion
-- (policy pada profiles tidak boleh mem-query profiles lagi secara implisit).
create or replace function public.profil_role()
returns peran
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- Admin boleh melihat profil semua user (untuk daftar guru dsb.)
create policy "admin lihat profil" on profiles
  for select to authenticated
  using (profil_role() = 'admin');

-- ===== ADMIN BACA SEMUA (read-only, lintas guru) =====
-- Setiap tabel data mendapat policy SELECT tambahan untuk admin.
-- Karena policy digabung dengan OR, guru tetap hanya melihat miliknya,
-- sementara admin melihat miliknya + semua guru lain.

create policy "admin baca semua" on tahun_pelajaran
  for select to authenticated
  using (profil_role() = 'admin');

create policy "admin baca semua" on semester
  for select to authenticated
  using (profil_role() = 'admin');

create policy "admin baca semua" on kelas
  for select to authenticated
  using (profil_role() = 'admin');

create policy "admin baca semua" on siswa
  for select to authenticated
  using (profil_role() = 'admin');

create policy "admin baca semua" on absensi
  for select to authenticated
  using (profil_role() = 'admin');

create policy "admin baca semua" on tugas
  for select to authenticated
  using (profil_role() = 'admin');

create policy "admin baca semua" on pengumpulan
  for select to authenticated
  using (profil_role() = 'admin');

create policy "admin baca semua" on jurnal
  for select to authenticated
  using (profil_role() = 'admin');

create policy "admin baca semua" on mapel
  for select to authenticated
  using (profil_role() = 'admin');

-- ===== REKAP PER KELAS UNTUK DASHBOARD ADMIN =====
-- security_invoker → RLS tetap berlaku: guru hanya melihat kelasnya sendiri,
-- admin melihat semua kelas.
create or replace view v_admin_rekap_kelas
with (security_invoker = true) as
select
  k.id            as kelas_id,
  k.guru_id,
  g.nama          as guru,
  k.nama          as kelas,
  tp.nama         as tahun,
  sm.nama         as semester,
  m.nama          as mapel,
  m.warna         as mapel_warna,
  count(distinct s.id)                          as jumlah_santri,
  count(distinct a.tanggal)                     as total_hari,
  count(*) filter (where a.status = 'hadir')    as hadir,
  count(*) filter (where a.status = 'sakit')    as sakit,
  count(*) filter (where a.status = 'izin')     as izin,
  count(*) filter (where a.status = 'alpha')    as alpha,
  round(100.0 * count(*) filter (where a.status = 'hadir')
        / nullif(count(*), 0), 1)               as persen_hadir
from kelas k
join profiles g        on g.id = k.guru_id
join tahun_pelajaran tp on tp.id = k.tahun_pelajaran_id
join semester sm        on sm.id = k.semester_id
left join mapel m       on m.id = k.mapel_id
left join siswa s       on s.kelas_id = k.id
left join absensi a     on a.siswa_id = s.id
group by k.id, k.guru_id, g.nama, k.nama, tp.nama, sm.nama,
         m.nama, m.warna, sm.urutan;
