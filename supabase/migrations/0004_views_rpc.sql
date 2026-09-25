-- ============================================================
-- 0004_views_rpc.sql — View & RPC untuk rekap (security invoker: RLS tetap berlaku)
-- ============================================================

-- ----- Rekap per siswa per bulan -----
create or replace view v_rekap_bulanan
with (security_invoker = true) as
select
  a.siswa_id,
  a.kelas_id,
  date_trunc('month', a.tanggal)::date          as bulan,
  count(*)                                       as total_hari,
  count(*) filter (where status = 'hadir')       as hadir,
  count(*) filter (where status = 'sakit')       as sakit,
  count(*) filter (where status = 'izin')        as izin,
  count(*) filter (where status = 'alpha')       as alpha,
  round(100.0 * count(*) filter (where status = 'hadir') / count(*), 1) as persen_hadir
from absensi a
group by a.siswa_id, a.kelas_id, date_trunc('month', a.tanggal);

-- ----- Rekap absensi fleksibel (bulan/semester/tahun via rentang tanggal) -----
create or replace function rekap_absensi(
  p_kelas_id uuid,
  p_dari     date,
  p_sampai   date
)
returns table (
  siswa_id uuid, nama text, nis text, urutan int,
  total_hari bigint, hadir bigint, sakit bigint, izin bigint, alpha bigint,
  persen_hadir numeric
) language sql stable security invoker as $$
  select
    s.id, s.nama, s.nis, s.urutan,
    count(a.id),
    count(a.id) filter (where a.status = 'hadir'),
    count(a.id) filter (where a.status = 'sakit'),
    count(a.id) filter (where a.status = 'izin'),
    count(a.id) filter (where a.status = 'alpha'),
    coalesce(round(100.0 * count(a.id) filter (where a.status = 'hadir')
             / nullif(count(a.id), 0), 1), 0)
  from siswa s
  left join absensi a
    on a.siswa_id = s.id and a.tanggal between p_dari and p_sampai
  where s.kelas_id = p_kelas_id
  group by s.id, s.nama, s.nis, s.urutan
  order by s.urutan;
$$;

-- ----- Ringkasan per tugas -----
create or replace view v_ringkasan_tugas
with (security_invoker = true) as
select
  t.id            as tugas_id,
  t.kelas_id,
  t.guru_id,
  t.judul,
  t.tipe,
  t.nilai_maks,
  t.tgl_diberikan,
  t.tgl_tenggat,
  count(p.id)                                             as total_siswa,
  count(p.id) filter (where p.status <> 'belum')          as sudah,
  count(p.id) filter (where p.status = 'belum')           as belum,
  count(p.id) filter (where p.status = 'terlambat')       as terlambat,
  coalesce(round(100.0 * count(p.id) filter (where p.status <> 'belum')
        / nullif(count(p.id), 0), 1), 0)                  as persen_kumpul,
  round(avg(p.nilai), 1)                                  as rata_nilai
from tugas t
left join pengumpulan p on p.tugas_id = t.id
group by t.id;

-- ----- Rekap tugas per siswa dalam rentang tanggal -----
create or replace function rekap_tugas_siswa(
  p_kelas_id uuid,
  p_dari     date,
  p_sampai   date
)
returns table (
  siswa_id uuid, nama text, nis text, urutan int,
  total_tugas bigint, sudah bigint, belum bigint, terlambat bigint,
  persen_kumpul numeric, rata_nilai numeric
) language sql stable security invoker as $$
  select
    s.id, s.nama, s.nis, s.urutan,
    count(p.id),
    count(p.id) filter (where p.status <> 'belum'),
    count(p.id) filter (where p.status = 'belum'),
    count(p.id) filter (where p.status = 'terlambat'),
    coalesce(round(100.0 * count(p.id) filter (where p.status <> 'belum')
             / nullif(count(p.id), 0), 1), 0),
    round(avg(p.nilai), 1)
  from siswa s
  left join tugas t on t.kelas_id = s.kelas_id
    and t.tgl_diberikan between p_dari and p_sampai
  left join pengumpulan p on p.tugas_id = t.id and p.siswa_id = s.id
  where s.kelas_id = p_kelas_id
  group by s.id, s.nama, s.nis, s.urutan
  order by s.urutan;
$$;

-- ----- Rekap bulanan satu santri (grafik halaman detail) -----
create or replace function rekap_bulanan_siswa(p_siswa_id uuid)
returns table (
  bulan date, total_hari bigint, hadir bigint, sakit bigint, izin bigint, alpha bigint,
  persen_hadir numeric
) language sql stable security invoker as $$
  select
    date_trunc('month', a.tanggal)::date,
    count(*),
    count(*) filter (where a.status = 'hadir'),
    count(*) filter (where a.status = 'sakit'),
    count(*) filter (where a.status = 'izin'),
    count(*) filter (where a.status = 'alpha'),
    round(100.0 * count(*) filter (where a.status = 'hadir') / count(*), 1)
  from absensi a
  where a.siswa_id = p_siswa_id
  group by 1
  order by 1;
$$;

-- ----- Riwayat lintas tahun berdasarkan NIS -----
create or replace function riwayat_santri_by_nis(p_nis text)
returns table (
  siswa_id uuid, tahun_pelajaran_id uuid, tahun text, status_tahun status_tahun,
  kelas_id uuid, kelas text,
  total_hari bigint, hadir bigint, sakit bigint, izin bigint, alpha bigint, persen_hadir numeric,
  total_tugas bigint, tugas_sudah bigint, persen_kumpul numeric, rata_nilai numeric
) language sql stable security invoker as $$
  select
    s.id, tp.id, tp.nama, tp.status, k.id, k.nama,
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
  join tahun_pelajaran tp on tp.id = k.tahun_pelajaran_id
  left join absensi a on a.siswa_id = s.id
  left join pengumpulan p on p.siswa_id = s.id
  where s.nis = p_nis and s.guru_id = auth.uid()
  group by s.id, tp.id, tp.nama, tp.status, k.id, k.nama, tp.tgl_mulai
  order by tp.tgl_mulai desc;
$$;
