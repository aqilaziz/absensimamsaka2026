-- ============================================================
-- 0006_jurnal.sql — Jurnal mengajar guru (opsional, menyatu dengan absensi)
--
-- Saat guru mengabsen, ia dapat mengisi jurnal harian mengajar:
-- materi pokok, tujuan pembelajaran, kegiatan, dan catatan/refleksi.
-- Satu jurnal per kelas per tanggal (unik), bisa diperbarui (upsert).
--
-- Jalankan setelah 0005_semester.sql
-- ============================================================

create table jurnal (
  id          uuid primary key default gen_random_uuid(),
  kelas_id    uuid not null references kelas(id) on delete cascade,
  guru_id     uuid not null references profiles(id) on delete cascade,
  tanggal     date not null,
  pertemuan   int,                                -- nomor pertemuan (opsional)
  materi      text,                               -- pokok bahasan / materi
  tujuan      text,                               -- tujuan pembelajaran
  kegiatan    text,                               -- kegiatan pembelajaran
  catatan     text,                               -- refleksi / evaluasi / kendala
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (kelas_id, tanggal)
);
create index jurnal_kelas_tgl_idx on jurnal (kelas_id, tanggal desc);
create index jurnal_guru_idx on jurnal (guru_id);

-- ===== RLS: hanya guru pemilik =====
alter table jurnal enable row level security;

create policy "own data" on jurnal
  for all to authenticated
  using (guru_id = (select auth.uid()))
  with check (guru_id = (select auth.uid()));

-- ===== Guard arsip (pola sama seperti tabel lain) =====
create trigger jurnal_guard before insert or update or delete on jurnal
  for each row execute function cegah_ubah_arsip();

-- ===== updated_at otomatis =====
create trigger jurnal_updated before update on jurnal
  for each row execute function sentuh_updated_at();