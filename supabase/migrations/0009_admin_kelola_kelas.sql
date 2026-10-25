-- ============================================================
-- 0009_admin_kelola_kelas.sql — Admin membuat kelas & santri utk guru
--
-- Fitur: "admin bisa buat kelas dan memasukkan nama siswa, sehingga guru
-- bisa menggunakan milik admin atau buat sendiri."
--
-- Caranya: admin membuat kelas ATAS NAMA seorang guru (kolom guru_id diisi
-- = guru tsb). Karena RLS berbasis guru_id, kelas & santrinya langsung
-- muncul di halaman /kelas milik guru tsb tanpa perubahan lain, dan guru
-- tetap bisa membuat kelasnya sendiri seperti biasa.
--
-- Perubahan:
--   Policy "admin kelola *" (for all) pada tabel kelas, siswa, mapel
--   → admin boleh INSERT/UPDATE/DELETE lintas guru (tidak lagi read-only).
--
-- Jalankan setelah 0008_role_admin.sql
-- ============================================================

create policy "admin kelola kelas" on kelas
  for all to authenticated
  using (profil_role() = 'admin')
  with check (profil_role() = 'admin');

create policy "admin kelola siswa" on siswa
  for all to authenticated
  using (profil_role() = 'admin')
  with check (profil_role() = 'admin');

create policy "admin kelola mapel" on mapel
  for all to authenticated
  using (profil_role() = 'admin')
  with check (profil_role() = 'admin');
