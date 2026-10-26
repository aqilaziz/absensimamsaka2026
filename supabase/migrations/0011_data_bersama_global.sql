-- ============================================================
-- 0011_data_bersama_global.sql — SATU database untuk seluruh madrasah
--
-- Model baru (menggantikan "per guru" + "bersama" di 0010):
--
--   • Tahun pelajaran, kelas, santri, dan mapel adalah data BERSAMA.
--     Dibuat admin (guru_id NULL) atau oleh guru mana pun (guru_id = pembuat),
--     dan SELURUH guru dapat membacanya.
--   • Hanya ada SATU tahun pelajaran aktif untuk seluruh madrasah, sehingga
--     semua guru otomatis memakai tahun yang sama.
--   • Absensi, tugas, pengumpulan, dan jurnal juga data bersama: semua guru
--     dapat membaca dan mengubahnya. Rekap & dashboard menjadi gabungan.
--   • Kolom guru_id TETAP diisi (pembuat/pencatat) sebagai jejak audit,
--     bukan lagi sebagai pembatas akses.
--
-- Jalankan setelah 0010_model_bersama.sql
-- ============================================================

-- ============================================================
-- 1) SATU TAHUN PELAJARAN AKTIF UNTUK SELURUH MADRASAH
-- ============================================================

-- Bila saat migrasi ada beberapa tahun aktif (satu per guru), sisakan satu:
-- prioritas tahun yang paling banyak kelasnya (data yang benar-benar dipakai)
-- → tahun bersama (guru_id NULL) → yang paling baru. Sisanya diarsipkan agar
-- index unik di bawah bisa dibuat.
do $$
declare
  v_keep    uuid;
  v_diarsip int;
begin
  select tp.id into v_keep
  from tahun_pelajaran tp
  where tp.status = 'aktif'
  order by (select count(*) from kelas k where k.tahun_pelajaran_id = tp.id) desc,
           (tp.guru_id is null) desc,
           tp.tgl_mulai desc
  limit 1;

  if v_keep is not null then
    update tahun_pelajaran
       set status = 'arsip'
     where status = 'aktif'
       and id <> v_keep;
    get diagnostics v_diarsip = row_count;
    if v_diarsip > 0 then
      raise notice '0011: % tahun pelajaran lain diarsipkan otomatis.', v_diarsip;
    end if;
  end if;
end $$;

-- Batasan lama (per guru & khusus bersama) tidak berlaku lagi.
drop index if exists one_active_year_per_guru;
drop index if exists satu_tahun_aktif_bersama;

-- Satu-satunya tahun aktif di seluruh tabel.
create unique index if not exists satu_tahun_aktif_global
  on tahun_pelajaran ((1)) where status = 'aktif';

-- ============================================================
-- 2) SEMUA GURU MEMBACA SELURUH DATA MASTER
--    (policy "own data" tetap ada; SELECT baru ini bersifat OR,
--     sehingga guru melihat data sendiri + data guru lain + data admin)
-- ============================================================

drop policy if exists "semua guru baca" on tahun_pelajaran;
create policy "semua guru baca" on tahun_pelajaran
  for select to authenticated using (true);

drop policy if exists "semua guru baca" on semester;
create policy "semua guru baca" on semester
  for select to authenticated using (true);

drop policy if exists "semua guru baca" on mapel;
create policy "semua guru baca" on mapel
  for select to authenticated using (true);

drop policy if exists "semua guru baca" on kelas;
create policy "semua guru baca" on kelas
  for select to authenticated using (true);

drop policy if exists "semua guru baca" on siswa;
create policy "semua guru baca" on siswa
  for select to authenticated using (true);

-- Kelas bersama (dibuat admin) boleh dirapikan guru mana pun — mis. salah
-- ketik nama kelas atau pindah semester. Menghapus kelas tetap hanya
-- pemilik/admin (lihat policy "own data" & "admin kelola kelas").
drop policy if exists "semua guru ubah kelas" on kelas;
create policy "semua guru ubah kelas" on kelas
  for update to authenticated
  using (true) with check (true);

-- Daftar santri dipelihara bersama: guru yang menemukan nama salah ketik,
-- santri pindah, atau santri baru tidak perlu menunggu admin.
drop policy if exists "semua guru kelola siswa" on siswa;
create policy "semua guru kelola siswa" on siswa
  for all to authenticated
  using (true) with check (true);

-- Validasi lama (0007) menolak kelas memakai mapel milik guru lain. Karena
-- mapel sekarang satu daftar bersama, aturan itu justru menghalangi; cukup
-- andalkan foreign key `kelas.mapel_id`.
drop trigger if exists kelas_validasi_mapel on kelas;
drop function if exists validasi_mapel_kelas();

-- ============================================================
-- 3) DATA TRANSAKSI JADI BERSAMA
--    SELECT/UPDATE/DELETE terbuka untuk semua guru; INSERT tetap wajib
--    mengisi guru_id = pencatat (policy "own data" yang sudah ada).
--    Tanpa UPDATE terbuka, `upsert` guru kedua akan ditolak RLS ketika
--    baris absensi/pengumpulan/jurnal sudah dibuat guru pertama.
-- ============================================================

drop policy if exists "data bersama" on absensi;
create policy "data bersama" on absensi
  for select to authenticated using (true);
drop policy if exists "data bersama ubah" on absensi;
create policy "data bersama ubah" on absensi
  for update to authenticated using (true) with check (true);
drop policy if exists "data bersama hapus" on absensi;
create policy "data bersama hapus" on absensi
  for delete to authenticated using (true);

drop policy if exists "data bersama" on tugas;
create policy "data bersama" on tugas
  for select to authenticated using (true);
drop policy if exists "data bersama ubah" on tugas;
create policy "data bersama ubah" on tugas
  for update to authenticated using (true) with check (true);
drop policy if exists "data bersama hapus" on tugas;
create policy "data bersama hapus" on tugas
  for delete to authenticated using (true);

drop policy if exists "data bersama" on pengumpulan;
create policy "data bersama" on pengumpulan
  for select to authenticated using (true);
-- Insert juga dibuka: menambah santri ke kelas bersama memicu trigger yang
-- membuat baris pengumpulan atas nama pembuat tugas (guru lain).
drop policy if exists "data bersama tambah" on pengumpulan;
create policy "data bersama tambah" on pengumpulan
  for insert to authenticated with check (true);
drop policy if exists "data bersama ubah" on pengumpulan;
create policy "data bersama ubah" on pengumpulan
  for update to authenticated using (true) with check (true);
drop policy if exists "data bersama hapus" on pengumpulan;
create policy "data bersama hapus" on pengumpulan
  for delete to authenticated using (true);

drop policy if exists "data bersama" on jurnal;
create policy "data bersama" on jurnal
  for select to authenticated using (true);
drop policy if exists "data bersama ubah" on jurnal;
create policy "data bersama ubah" on jurnal
  for update to authenticated using (true) with check (true);
drop policy if exists "data bersama hapus" on jurnal;
create policy "data bersama hapus" on jurnal
  for delete to authenticated using (true);

-- ============================================================
-- 4) PERBAIKAN TRIGGER: santri milik admin (guru_id NULL)
--
--    `pengumpulan.guru_id` NOT NULL, sedangkan trigger lama menyalin
--    new.guru_id apa adanya. Begitu admin menambah santri ke kelas yang
--    sudah punya tugas, insert pengumpulan gagal (null). Sekarang diambil
--    dari guru_id tugas/santri yang tersedia.
-- ============================================================

create or replace function buat_pengumpulan_awal()
returns trigger language plpgsql as $$
begin
  insert into pengumpulan (tugas_id, siswa_id, kelas_id, guru_id)
  select new.id, s.id, new.kelas_id, coalesce(new.guru_id, s.guru_id)
  from siswa s where s.kelas_id = new.kelas_id;
  return new;
end $$;

create or replace function pengumpulan_untuk_siswa_baru()
returns trigger language plpgsql as $$
begin
  insert into pengumpulan (tugas_id, siswa_id, kelas_id, guru_id)
  select t.id, new.id, new.kelas_id, coalesce(t.guru_id, new.guru_id)
  from tugas t where t.kelas_id = new.kelas_id;
  return new;
end $$;

-- ============================================================
-- 5) RIWAYAT SANTRI LINTAS TAHUN: tanpa filter pemilik
--    (sebelumnya `s.guru_id = auth.uid()` menyembunyikan riwayat santri
--     yang didaftarkan guru lain / admin)
-- ============================================================

create or replace function riwayat_santri_by_nis(p_nis text)
returns table (
  siswa_id uuid, tahun_pelajaran_id uuid, tahun text, status_tahun status_tahun,
  kelas_id uuid, kelas text, semester nama_semester,
  total_hari bigint, hadir bigint, sakit bigint, izin bigint, alpha bigint, persen_hadir numeric,
  total_tugas bigint, tugas_sudah bigint, persen_kumpul numeric, rata_nilai numeric
) language sql stable security invoker as $$
  select
    s.id, tp.id, tp.nama, tp.status,
    k.id, k.nama, sm.nama,
    count(distinct a.id),
    count(distinct a.id) filter (where a.status = 'hadir'),
    count(distinct a.id) filter (where a.status = 'sakit'),
    count(distinct a.id) filter (where a.status = 'izin'),
    count(distinct a.id) filter (where a.status = 'alpha'),
    coalesce(round(100.0 * count(distinct a.id) filter (where a.status = 'hadir')
             / nullif(count(distinct a.id), 0), 1), 0),
    count(distinct p.id),
    count(distinct p.id) filter (where p.status <> 'belum'),
    coalesce(round(100.0 * count(distinct p.id) filter (where p.status <> 'belum')
             / nullif(count(distinct p.id), 0), 1), 0),
    round(avg(p.nilai), 1)
  from siswa s
  join kelas k on k.id = s.kelas_id
  join semester sm on sm.id = k.semester_id
  join tahun_pelajaran tp on tp.id = k.tahun_pelajaran_id
  left join absensi a on a.siswa_id = s.id
  left join pengumpulan p on p.siswa_id = s.id
  where s.nis = p_nis
  group by s.id, tp.id, tp.nama, tp.status, k.id, k.nama, sm.nama, sm.urutan, tp.tgl_mulai
  order by tp.tgl_mulai desc, sm.urutan;
$$;

-- ============================================================
-- 6) REKAP ADMIN: tambah tahun_id (filter harus pakai id, bukan nama —
--    dua tahun berbeda bisa bernama sama) dan perbaiki persen_hadir.
--
--    Sebelumnya penyebutnya count(*), sehingga kelas tanpa absensi
--    dilaporkan 0% (bukan "belum ada data"). Sekarang penyebutnya
--    jumlah baris absensi.
-- ============================================================

drop view if exists v_admin_rekap_kelas;
create view v_admin_rekap_kelas
with (security_invoker = true) as
select
  k.id            as kelas_id,
  k.guru_id,
  coalesce(g.nama, 'Bersama (Admin)') as guru,
  k.nama          as kelas,
  tp.id           as tahun_id,
  tp.nama         as tahun,
  sm.nama         as semester,
  m.nama          as mapel,
  m.warna         as mapel_warna,
  count(distinct s.id)                          as jumlah_santri,
  count(distinct a.tanggal)                     as total_hari,
  count(a.id) filter (where a.status = 'hadir') as hadir,
  count(a.id) filter (where a.status = 'sakit') as sakit,
  count(a.id) filter (where a.status = 'izin')  as izin,
  count(a.id) filter (where a.status = 'alpha') as alpha,
  round(100.0 * count(a.id) filter (where a.status = 'hadir')
        / nullif(count(a.id), 0), 1)            as persen_hadir
from kelas k
left join profiles g       on g.id = k.guru_id
join tahun_pelajaran tp    on tp.id = k.tahun_pelajaran_id
join semester sm           on sm.id = k.semester_id
left join mapel m          on m.id = k.mapel_id
left join siswa s          on s.kelas_id = k.id
left join absensi a        on a.siswa_id = s.id
group by k.id, k.guru_id, g.nama, k.nama, tp.id, tp.nama, sm.nama,
         m.nama, m.warna, sm.urutan;
