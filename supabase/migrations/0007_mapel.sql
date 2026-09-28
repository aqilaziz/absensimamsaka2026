-- ============================================================
-- 0007_mapel.sql — Mata pelajaran (mapel) sebagai identitas kelas
--
-- Tujuan: satu guru dapat mengajar BANYAK mapel di BANYAK kelas.
-- Setiap mapel punya satu warna tema yang dipakai konsisten di seluruh
-- antarmuka (badge kelas, kartu dashboard, sidebar, header kelas, dsb.)
-- sehingga mudah dibedakan sekilas.
--
-- Perubahan:
--   1. Tabel `mapel` (milik satu guru, nama unik per guru, warna tema).
--   2. `kelas.mapel_id` (opsional untuk data lama, diisi untuk kelas baru).
--   3. Keunikan kelas menjadi (semester, mapel, nama) supaya "XII MIPA 1"
--      boleh muncul lebih dari sekali bila mapelnya berbeda.
--
-- Jalankan setelah 0006_jurnal.sql
-- ============================================================

-- ===== TABEL MAPEL =====
create table mapel (
  id          uuid primary key default gen_random_uuid(),
  guru_id     uuid not null references profiles(id) on delete cascade,
  nama        text not null,
  warna       text not null default 'emerald',   -- kunci palet, lihat lib/mapel.ts
  created_at  timestamptz default now()
);
-- Nama mapel tidak boleh ganda (tanpa membedakan huruf besar/kecil)
create unique index mapel_nama_per_guru on mapel (guru_id, lower(nama));
create index mapel_guru_idx on mapel (guru_id);

-- ===== RLS: hanya guru pemilik =====
alter table mapel enable row level security;

create policy "own data" on mapel
  for all to authenticated
  using (guru_id = (select auth.uid()))
  with check (guru_id = (select auth.uid()));

-- ===== KELAS → MAPEL =====
alter table kelas add column mapel_id uuid references mapel(id) on delete set null;
create index kelas_mapel_idx on kelas (mapel_id);

-- Kelas hanya boleh menunjuk mapel milik guru yang sama
create or replace function validasi_mapel_kelas()
returns trigger language plpgsql as $$
declare v_guru uuid;
begin
  if new.mapel_id is null then
    return new;
  end if;
  select guru_id into v_guru from mapel where id = new.mapel_id;
  if v_guru is null then
    raise exception 'Mata pelajaran tidak ditemukan';
  end if;
  if v_guru <> new.guru_id then
    raise exception 'Mata pelajaran bukan milik guru ini';
  end if;
  return new;
end $$;

create trigger kelas_validasi_mapel before insert or update of mapel_id on kelas
  for each row execute function validasi_mapel_kelas();

-- ===== KEUNIKAN KELAS: per semester + mapel + nama =====
alter table kelas drop constraint if exists kelas_semester_nama_key;
alter table kelas add constraint kelas_semester_mapel_nama_key
  unique (semester_id, mapel_id, nama);

-- Data lama belum punya mapel (mapel_id NULL). Karena NULL dianggap berbeda
-- oleh constraint di atas, tambahkan index parsial agar nama kelas tetap unik
-- selagi mapelnya belum diisi.
create unique index kelas_nama_tanpa_mapel
  on kelas (semester_id, nama) where mapel_id is null;