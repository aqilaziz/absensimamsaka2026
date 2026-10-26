-- ============================================================
-- 0012_model_rombel_pengampu.sql — Admin menyiapkan, guru mencentang
--
-- Menggantikan model "satu database dipakai bebas" (0011) dengan:
--
--   • Data master (tahun pelajaran, semester, mapel, kelas, santri) hanya
--     dibuat & diubah ADMIN. Semua baris master ber-guru_id NULL.
--   • `kelas` kini murni ROMBEL: tidak lagi menempel pada satu mapel.
--     Keunikan kelas = (semester, nama).
--   • Tabel baru `kelas_ajar` (pengampu): guru mencentang kelas + mapel
--     yang ia ampu. Satu mapel di satu kelas diampu satu guru.
--   • Guru hanya melihat kelas & santri yang ia ampu (lewat `kelas_ajar`).
--   • Absensi, tugas, pengumpulan, jurnal kembali milik masing-masing guru;
--     admin hanya membaca. Absensi & jurnal unik per guru per tanggal,
--     sehingga dua guru di kelas yang sama tidak saling menimpa.
--
-- Jalankan setelah 0011_data_bersama_global.sql
-- ============================================================

-- ============================================================
-- 1) KELAS JADI ROMBEL (tanpa mapel)
-- ============================================================

-- View lama memakai k.mapel_id → harus dilepas lebih dulu.
drop view if exists v_admin_rekap_kelas;

drop index if exists kelas_nama_tanpa_mapel;
alter table kelas drop constraint if exists kelas_semester_mapel_nama_key;
alter table kelas drop column if exists mapel_id;

alter table kelas add constraint kelas_semester_nama_key
  unique (semester_id, nama);

-- ============================================================
-- 2) SEMUA DATA MASTER MILIK ADMIN
--    (guru_id NULL = dibuat/dikelola admin; kolom tetap ada sebagai
--     jejak audit bila suatu saat admin ingin mencatat pembuatnya)
-- ============================================================

-- Batasan lama yang menghalangi banyak baris ber-guru_id NULL:
--   • unique (guru_id, nama) pada tahun → dua tahun bernama sama jadi bentrok
--   • nama tahun unik khusus baris bersama
--   • nama mapel unik per guru
alter table tahun_pelajaran drop constraint if exists tahun_pelajaran_guru_id_nama_key;
drop index if exists tahun_bersama_nama_unik;
drop index if exists mapel_nama_per_guru;

update tahun_pelajaran set guru_id = null;
update semester        set guru_id = null;
update mapel           set guru_id = null;
update kelas           set guru_id = null;

-- `cegah_ubah_arsip` mengunci santri di tahun arsip, padahal migrasi ini
-- harus menyeragamkan kepemilikan. Trigger dimatikan sementara (aman:
-- seluruh migrasi berjalan dalam satu transaksi).
alter table siswa disable trigger siswa_guard;
update siswa set guru_id = null;
alter table siswa enable trigger siswa_guard;

-- ============================================================
-- 3) TABEL PENGAMPU (centang guru)
-- ============================================================

create table if not exists kelas_ajar (
  id         uuid primary key default gen_random_uuid(),
  kelas_id   uuid not null references kelas(id)  on delete cascade,
  mapel_id   uuid not null references mapel(id)  on delete cascade,
  guru_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  -- satu mapel di satu kelas diampu satu guru
  unique (kelas_id, mapel_id)
);
create index if not exists kelas_ajar_guru_idx  on kelas_ajar (guru_id);
create index if not exists kelas_ajar_kelas_idx on kelas_ajar (kelas_id);

-- ============================================================
-- 4) ABSENSI & JURNAL: unik per guru
--    (dua guru boleh mengisi kelas & tanggal yang sama tanpa bertabrakan)
-- ============================================================

alter table absensi drop constraint if exists absensi_siswa_id_tanggal_key;
alter table absensi add constraint absensi_siswa_tgl_guru_key
  unique (siswa_id, tanggal, guru_id);

alter table jurnal drop constraint if exists jurnal_kelas_id_tanggal_key;
alter table jurnal add constraint jurnal_kelas_tgl_guru_key
  unique (kelas_id, tanggal, guru_id);

-- ============================================================
-- 5) RLS: bersihkan policy lama, buat ulang
--    (policy di produksi berbeda nama dengan file migrasi repo, jadi
--     seluruh policy pada tabel terkait dilepas lebih dulu)
-- ============================================================

do $$
declare
  r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'tahun_pelajaran', 'semester', 'mapel', 'kelas', 'siswa',
        'kelas_ajar', 'absensi', 'tugas', 'pengumpulan', 'jurnal'
      )
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ----- MASTER: semua guru boleh membaca, hanya admin mengubah -----
create policy "baca tahun" on tahun_pelajaran
  for select to authenticated using (true);
create policy "admin kelola tahun" on tahun_pelajaran
  for all to authenticated
  using (profil_role() = 'admin') with check (profil_role() = 'admin');

create policy "baca semester" on semester
  for select to authenticated using (true);
create policy "admin kelola semester" on semester
  for all to authenticated
  using (profil_role() = 'admin') with check (profil_role() = 'admin');

create policy "baca mapel" on mapel
  for select to authenticated using (true);
create policy "admin kelola mapel" on mapel
  for all to authenticated
  using (profil_role() = 'admin') with check (profil_role() = 'admin');

-- Kelas dibaca semua guru supaya halaman "Ambil Kelas" bisa menampilkan
-- daftar rombel yang tersedia.
create policy "baca kelas" on kelas
  for select to authenticated using (true);
create policy "admin kelola kelas" on kelas
  for all to authenticated
  using (profil_role() = 'admin') with check (profil_role() = 'admin');

-- Santri hanya terlihat oleh guru yang mengampu kelasnya.
create policy "baca siswa" on siswa
  for select to authenticated
  using (
    profil_role() = 'admin'
    or exists (
      select 1 from kelas_ajar ka
      where ka.kelas_id = siswa.kelas_id
        and ka.guru_id = (select auth.uid())
    )
  );
create policy "admin kelola siswa" on siswa
  for all to authenticated
  using (profil_role() = 'admin') with check (profil_role() = 'admin');

-- ----- PENGAMPU -----
-- Dibaca semua guru supaya halaman "Ambil Kelas" bisa menandai mapel yang
-- sudah diambil orang lain (tidak menampilkan nama guru).
create policy "baca pengampu" on kelas_ajar
  for select to authenticated using (true);

-- Guru boleh mengambil kelas pada tahun yang masih aktif saja.
create policy "ambil kelas" on kelas_ajar
  for insert to authenticated
  with check (
    guru_id = (select auth.uid())
    and exists (
      select 1 from kelas k
      join tahun_pelajaran t on t.id = k.tahun_pelajaran_id
      where k.id = kelas_id and t.status = 'aktif'
    )
  );

create policy "lepas kelas" on kelas_ajar
  for delete to authenticated
  using (guru_id = (select auth.uid()) or profil_role() = 'admin');

create policy "admin kelola pengampu" on kelas_ajar
  for all to authenticated
  using (profil_role() = 'admin') with check (profil_role() = 'admin');

-- ----- TRANSAKSI: milik guru masing-masing, admin hanya membaca -----
create policy "milik sendiri" on absensi
  for all to authenticated
  using (guru_id = (select auth.uid())) with check (guru_id = (select auth.uid()));
create policy "admin" on absensi
  for all to authenticated
  using (profil_role() = 'admin') with check (profil_role() = 'admin');

create policy "milik sendiri" on tugas
  for all to authenticated
  using (guru_id = (select auth.uid())) with check (guru_id = (select auth.uid()));
create policy "admin" on tugas
  for all to authenticated
  using (profil_role() = 'admin') with check (profil_role() = 'admin');

create policy "milik sendiri" on pengumpulan
  for all to authenticated
  using (guru_id = (select auth.uid())) with check (guru_id = (select auth.uid()));
create policy "admin" on pengumpulan
  for all to authenticated
  using (profil_role() = 'admin') with check (profil_role() = 'admin');

create policy "milik sendiri" on jurnal
  for all to authenticated
  using (guru_id = (select auth.uid())) with check (guru_id = (select auth.uid()));
create policy "admin" on jurnal
  for all to authenticated
  using (profil_role() = 'admin') with check (profil_role() = 'admin');

-- ============================================================
-- 6) REKAP ADMIN: satu baris per pengampu (kelas + mapel + guru)
-- ============================================================

create view v_admin_rekap_kelas
with (security_invoker = true) as
select
  k.id            as kelas_id,
  ka.id           as pengampu_id,
  ka.guru_id,
  coalesce(g.nama, 'Belum ada pengampu') as guru,
  k.nama          as kelas,
  tp.id           as tahun_id,
  tp.nama         as tahun,
  sm.nama         as semester,
  m.nama          as mapel,
  m.warna         as mapel_warna,
  (select count(*) from siswa s where s.kelas_id = k.id) as jumlah_santri,
  count(distinct a.tanggal)                     as total_hari,
  count(a.id) filter (where a.status = 'hadir') as hadir,
  count(a.id) filter (where a.status = 'sakit') as sakit,
  count(a.id) filter (where a.status = 'izin')  as izin,
  count(a.id) filter (where a.status = 'alpha') as alpha,
  round(100.0 * count(a.id) filter (where a.status = 'hadir')
        / nullif(count(a.id), 0), 1)            as persen_hadir
from kelas k
join tahun_pelajaran tp on tp.id = k.tahun_pelajaran_id
join semester sm        on sm.id = k.semester_id
left join kelas_ajar ka on ka.kelas_id = k.id
left join profiles g    on g.id = ka.guru_id
left join mapel m       on m.id = ka.mapel_id
left join siswa s       on s.kelas_id = k.id
left join absensi a     on a.siswa_id = s.id and a.guru_id = ka.guru_id
group by k.id, ka.id, ka.guru_id, g.nama, k.nama, tp.id, tp.nama,
         sm.nama, m.nama, m.warna, sm.urutan;
