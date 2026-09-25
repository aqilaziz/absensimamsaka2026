-- ============================================================
-- 0002_rls.sql — Row Level Security: setiap guru hanya datanya sendiri
-- Catatan: pakai TO authenticated + (select auth.uid()) agar
-- tidak berlaku untuk anon dan lebih efisien (initplan).
-- ============================================================

alter table profiles        enable row level security;
alter table tahun_pelajaran enable row level security;
alter table kelas           enable row level security;
alter table siswa           enable row level security;
alter table absensi         enable row level security;
alter table tugas           enable row level security;
alter table pengumpulan     enable row level security;

create policy "own profile" on profiles
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "own data" on tahun_pelajaran
  for all to authenticated
  using (guru_id = (select auth.uid()))
  with check (guru_id = (select auth.uid()));

create policy "own data" on kelas
  for all to authenticated
  using (guru_id = (select auth.uid()))
  with check (guru_id = (select auth.uid()));

create policy "own data" on siswa
  for all to authenticated
  using (guru_id = (select auth.uid()))
  with check (guru_id = (select auth.uid()));

create policy "own data" on absensi
  for all to authenticated
  using (guru_id = (select auth.uid()))
  with check (guru_id = (select auth.uid()));

create policy "own data" on tugas
  for all to authenticated
  using (guru_id = (select auth.uid()))
  with check (guru_id = (select auth.uid()));

create policy "own data" on pengumpulan
  for all to authenticated
  using (guru_id = (select auth.uid()))
  with check (guru_id = (select auth.uid()));
