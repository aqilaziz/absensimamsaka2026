-- 0016: keterangan absensi bersifat opsional
--
-- Sebelumnya ada CHECK constraint `keterangan_wajib` yang menolak baris
-- sakit/izin tanpa keterangan. Sekarang guru boleh menyimpan tanpa mengisi
-- alasan (keterangan hanya pelengkap, bukan syarat).
--
-- Sudah dijalankan di database produksi (2026-11-02). File ini hanya
-- dokumentasi agar repo dan produksi tidak berbeda.

ALTER TABLE absensi DROP CONSTRAINT IF EXISTS keterangan_wajib;
