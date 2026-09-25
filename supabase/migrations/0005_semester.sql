-- ============================================================
-- 0005_semester.sql — Hierarki: Tahun Pelajaran → Semester → Kelas
--
-- 1. Tabel `semester` (Ganjil & Genap) dibuat OTOMATIS untuk setiap
--    tahun pelajaran dan tanggalnya disinkronkan oleh trigger:
--      Ganjil : tgl_mulai  s.d. batas_semester
--      Genap  : batas_semester + 1 s.d. tgl_selesai
-- 2. `kelas` wajib menempel pada satu semester (semester_id NOT NULL).
--    Nama kelas unik per SEMESTER (bukan per tahun), sehingga
--    "XII IPA 1" boleh ada di Ganjil sekaligus Genap.
-- 3. Constraint kombinasi menjaga semester & tahun pelajaran selalu selaras.
--
-- Jalankan setelah 0004_views_rpc.sql
-- ============================================================

create type nama_semester as enum ('ganjil', 'genap');

-- ===== TABEL SEMESTER =====
create table semester (
  id                 uuid primary key default gen_random_uuid(),
  tahun_pelajaran_id uuid not null references tahun_pelajaran(id) on delete cascade,
  guru_id            uuid not null references profiles(id) on delete cascade,
  nama               nama_semester not null,
  urutan             smallint not null,
  tgl_mulai          date not null,
  tgl_selesai        date not null,
  created_at         timestamptz default now(),
  unique (tahun_pelajaran_id, nama),
  -- dibutuhkan sebagai target FK kombinasi (tahun, semester) di tabel kelas
  unique (tahun_pelajaran_id, id),
  constraint rentang_semester_valid check (tgl_mulai <= tgl_selesai)
);
create index semester_guru_idx on semester (guru_id);

-- ===== RLS: semester mengikuti pemilik tahun pelajaran =====
alter table semester enable row level security;

create policy "own data" on semester
  for all to authenticated
  using (guru_id = (select auth.uid()))
  with check (guru_id = (select auth.uid()));

-- ===== TRIGGER: semester dibuat & disinkronkan dari tahun pelajaran =====
create or replace function sinkron_semester()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into semester (tahun_pelajaran_id, guru_id, nama, urutan, tgl_mulai, tgl_selesai)
    values
      (new.id, new.guru_id, 'ganjil', 1, new.tgl_mulai,    new.batas_semester),
      (new.id, new.guru_id, 'genap',  2, new.batas_semester + 1, new.tgl_selesai);
    return new;
  end if;

  -- UPDATE tanggal tahun pelajaran → geser tanggal kedua semester
  update semester set
    tgl_mulai  = case when nama = 'ganjil' then new.tgl_mulai else new.batas_semester + 1 end,
    tgl_selesai = case when nama = 'ganjil' then new.batas_semester else new.tgl_selesai end
  where tahun_pelajaran_id = new.id;
  return new;
end $$;

create trigger tahun_buat_semester
  after insert on tahun_pelajaran
  for each row execute function sinkron_semester();

create trigger tahun_sinkron_semester
  after update of tgl_mulai, batas_semester, tgl_selesai on tahun_pelajaran
  for each row
  when (
    old.tgl_mulai      is distinct from new.tgl_mulai or
    old.batas_semester is distinct from new.batas_semester or
    old.tgl_selesai    is distinct from new.tgl_selesai
  )
  execute function sinkron_semester();

-- ===== BACKFILL: tahun pelajaran yang sudah ada sebelum migrasi ini =====
insert into semester (tahun_pelajaran_id, guru_id, nama, urutan, tgl_mulai, tgl_selesai)
select tp.id, tp.guru_id, s.nama, s.urutan, s.dari, s.sampai
from tahun_pelajaran tp
cross join lateral (values
  ('ganjil'::nama_semester, 1::smallint, tp.tgl_mulai,             tp.batas_semester),
  ('genap'::nama_semester,  2::smallint, tp.batas_semester + 1,    tp.tgl_selesai)
) as s(nama, urutan, dari, sampai)
on conflict (tahun_pelajaran_id, nama) do nothing;

-- ===== KELAS WAJIB PUNYA SEMESTER =====
alter table kelas add column semester_id uuid references semester(id) on delete cascade;
create index kelas_semester_idx on kelas (semester_id);

-- Backfill: kelas lama ditempatkan di semester yang menampung
-- sebagian besar absensinya (bila tidak ada absensi → semester ganjil)
update kelas k set semester_id = (
  select s.id
  from semester s
  where s.tahun_pelajaran_id = k.tahun_pelajaran_id
  order by (
    select count(*) from absensi a
    where a.kelas_id = k.id and a.tanggal between s.tgl_mulai and s.tgl_selesai
  ) desc,
  s.urutan
  limit 1
);

alter table kelas alter column semester_id set not null;

-- Nama kelas unik per semester (bukan per tahun)
alter table kelas drop constraint if exists kelas_tahun_pelajaran_id_nama_key;
alter table kelas add constraint kelas_semester_nama_key unique (semester_id, nama);

-- Jaminan: semester dan tahun pelajaran pada satu kelas harus sama-sama
-- berasal dari tahun pelajaran yang sama
alter table kelas add constraint kelas_semester_konsisten
  foreign key (tahun_pelajaran_id, semester_id)
  references semester (tahun_pelajaran_id, id);

-- ===== RIWAYAT SANTRI: tampilkan semester pada baris riwayat =====
drop function if exists riwayat_santri_by_nis(text);

create function riwayat_santri_by_nis(p_nis text)
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
  where s.nis = p_nis and s.guru_id = auth.uid()
  group by s.id, tp.id, tp.nama, tp.status, k.id, k.nama, sm.nama, sm.urutan, tp.tgl_mulai
  order by tp.tgl_mulai desc, sm.urutan;
$$;
