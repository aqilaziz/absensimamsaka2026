-- ============================================================
-- 0013_pengampu_boleh_ganda.sql
--
-- Sebelumnya satu mapel di satu kelas hanya boleh diampu SATU guru
-- (unique kelas_id + mapel_id), sehingga guru lain melihat mapel itu
-- "terkunci" dan tidak bisa mengambilnya.
--
-- Sekarang satu mapel di satu kelas boleh diampu lebih dari satu guru
-- (mis. Tahfidz dibagi dua guru, atau team teaching). Yang tetap dijaga:
-- guru yang sama tidak mengambil mapel yang sama dua kali di kelas yang sama.
--
-- Jalankan setelah 0012_model_rombel_pengampu.sql
-- ============================================================

alter table kelas_ajar
  drop constraint if exists kelas_ajar_kelas_id_mapel_id_key;

alter table kelas_ajar
  add constraint kelas_ajar_kelas_mapel_guru_key
  unique (kelas_id, mapel_id, guru_id);
