-- ============================================================
-- 0010_model_bersama.sql — Master bersama (shared) yang dibuat admin
--
-- Mengubah model dari "per guru" menjadi "bersama + per guru":
--   • Baris dengan guru_id NULL = milik BERSAMA / dibuat admin.
--   • Semua guru bisa MEMBACA (memakai) data bersama tsb.
--   • Admin punya kontrol penuh baca+tulis atas data bersama
--     (termasuk tahun pelajaran & semester).
--   • Guru tetap bisa membuat datanya sendiri (guru_id = dirinya).
--   • Guru TIDAK bisa mengubah data bersama (hanya admin).
--
-- Perubahan:
--   1. guru_id boleh NULL pada tahun_pelajaran, semester, mapel,
--      kelas, siswa (NULL = bersama/admin).
--   2. Batasan unik khusus data bersama (nama tahun & mapel unik,
--      maksimal satu tahun aktif bersama).
--   3. Policy RLS "baca bersama": guru membaca baris guru_id NULL
--      pada kelima tabel tsb.
--   4. Policy "admin kelola tahun/semester" (baca+tulis penuh).
--   5. Perbaiki v_admin_rekap_kelas agar menyertakan kelas bersama
--      (guru_id NULL) di bawah grup "Bersama (Admin)".
--
-- Jalankan setelah 0009_admin_kelola_kelas.sql
-- ============================================================

-- 1) guru_id boleh NULL pada tabel master (NULL = milik bersama/admin)
alter table tahun_pelajaran alter column guru_id drop not null;
alter table semester      alter column guru_id drop not null;
alter table mapel         alter column guru_id drop not null;
alter table kelas         alter column guru_id drop not null;
alter table siswa         alter column guru_id drop not null;

-- 2) Batasan unik data bersama
-- Maksimal satu tahun aktif "bersama" (menggantikan batasan per guru
-- yang tidak berlaku untuk NULL).
create unique index if not exists satu_tahun_aktif_bersama
  on tahun_pelajaran ((1)) where status = 'aktif' and guru_id is null;

-- Nama tahun bersama tidak boleh ganda
create unique index if not exists tahun_bersama_nama_unik
  on tahun_pelajaran (nama) where guru_id is null;

-- Nama mapel bersama tidak boleh ganda
create unique index if not exists mapel_bersama_nama_unik
  on mapel (lower(nama)) where guru_id is null;

-- 3) Guru boleh MEMBACA data bersama (guru_id NULL)
drop policy if exists "baca bersama" on tahun_pelajaran;
create policy "baca bersama" on tahun_pelajaran
  for select to authenticated using (guru_id is null);
drop policy if exists "baca bersama" on semester;
create policy "baca bersama" on semester
  for select to authenticated using (guru_id is null);
drop policy if exists "baca bersama" on mapel;
create policy "baca bersama" on mapel
  for select to authenticated using (guru_id is null);
drop policy if exists "baca bersama" on kelas;
create policy "baca bersama" on kelas
  for select to authenticated using (guru_id is null);
drop policy if exists "baca bersama" on siswa;
create policy "baca bersama" on siswa
  for select to authenticated using (guru_id is null);

-- 4) Admin kelola penuh (baca+tulis) atas tahun & semester
drop policy if exists "admin kelola tahun" on tahun_pelajaran;
create policy "admin kelola tahun" on tahun_pelajaran
  for all to authenticated
  using (profil_role() = 'admin')
  with check (profil_role() = 'admin');

drop policy if exists "admin kelola semester" on semester;
create policy "admin kelola semester" on semester
  for all to authenticated
  using (profil_role() = 'admin')
  with check (profil_role() = 'admin');

-- 5) Rekap admin menyertakan kelas bersama
drop view if exists v_admin_rekap_kelas;
create view v_admin_rekap_kelas
with (security_invoker = true) as
select
  k.id            as kelas_id,
  k.guru_id,
  coalesce(g.nama, 'Bersama (Admin)') as guru,
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
left join profiles g      on g.id = k.guru_id
join tahun_pelajaran tp    on tp.id = k.tahun_pelajaran_id
join semester sm            on sm.id = k.semester_id
left join mapel m           on m.id = k.mapel_id
left join siswa s           on s.kelas_id = k.id
left join absensi a         on a.siswa_id = s.id
group by k.id, k.guru_id, g.nama, k.nama, tp.nama, sm.nama,
         m.nama, m.warna, sm.urutan;
