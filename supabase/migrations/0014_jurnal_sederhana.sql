-- ============================================================
-- 0014_jurnal_sederhana.sql
--
-- Menyederhanakan jurnal mengajar agar bentuknya seperti "sesi":
--
--   • `pertemuan` (angka)  → `judul` (teks, mis. "Pertemuan Senin, 26/10/2026")
--   • `tujuan`             → `topik` (Topik Pembelajaran)
--   • tambah `jam_mulai` & `jam_selesai` (Jam ke-1 … Jam ke-9)
--
-- `materi`, `kegiatan` (dipakai sebagai Metode Pembelajaran), dan `catatan`
-- tetap seperti semula.
--
-- Jalankan setelah 0013_pengampu_boleh_ganda.sql
-- ============================================================

alter table jurnal rename column pertemuan to judul;
alter table jurnal alter column judul type text using judul::text;

alter table jurnal rename column tujuan to topik;

alter table jurnal add column if not exists jam_mulai   smallint;
alter table jurnal add column if not exists jam_selesai smallint;
