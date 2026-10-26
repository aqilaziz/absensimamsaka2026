-- ============================================================
-- 0015_lampiran_tugas.sql
--
-- Tugas boleh punya lampiran berkas (PDF, Word, gambar, dsb).
-- Berkas disimpan di Supabase Storage pada bucket privat `tugas`,
-- dan daftar berkasnya dicatat di kolom `tugas.lampiran` (jsonb):
--   [{ "nama": "...", "path": "...", "ukuran": 12345, "tipe": "application/pdf" }]
--
-- Jalankan setelah 0014_jurnal_sederhana.sql
-- ============================================================

alter table tugas add column if not exists lampiran jsonb;

insert into storage.buckets (id, name, public, file_size_limit)
values ('tugas', 'tugas', false, 10485760)
on conflict (id) do nothing;

-- Guru (semua pengguna login) boleh mengunggah & membaca lampiran tugas.
drop policy if exists "lampiran tugas unggah" on storage.objects;
create policy "lampiran tugas unggah" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'tugas');

drop policy if exists "lampiran tugas baca" on storage.objects;
create policy "lampiran tugas baca" on storage.objects
  for select to authenticated
  using (bucket_id = 'tugas');

drop policy if exists "lampiran tugas hapus" on storage.objects;
create policy "lampiran tugas hapus" on storage.objects
  for delete to authenticated
  using (bucket_id = 'tugas' and owner = auth.uid());
