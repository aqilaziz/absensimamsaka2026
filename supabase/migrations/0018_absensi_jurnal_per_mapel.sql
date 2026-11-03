-- 0018: absensi & jurnal per mata pelajaran
--
-- Guru yang mengampu beberapa mapel di kelas yang sama perlu mencatat
-- absensi dan jurnal terpisah untuk tiap mapel. Sebelumnya keduanya hanya
-- per kelas + tanggal + guru, sehingga mapel kedua menimpa yang pertama.

ALTER TABLE absensi ADD COLUMN IF NOT EXISTS mapel_id uuid REFERENCES mapel(id);
ALTER TABLE jurnal  ADD COLUMN IF NOT EXISTS mapel_id uuid REFERENCES mapel(id);

-- Isi mapel lama dengan mapel pertama yang diampu guru tersebut di kelas itu
-- (urutan pengambilan paling awal). Baris tanpa pengampu dibiarkan NULL.
UPDATE absensi a
SET mapel_id = sub.mapel_id
FROM (
  SELECT DISTINCT ON (ka.kelas_id, ka.guru_id)
         ka.kelas_id, ka.guru_id, ka.mapel_id
  FROM kelas_ajar ka
  ORDER BY ka.kelas_id, ka.guru_id, ka.created_at
) sub
WHERE a.mapel_id IS NULL
  AND a.kelas_id = sub.kelas_id
  AND a.guru_id = sub.guru_id;

UPDATE jurnal j
SET mapel_id = sub.mapel_id
FROM (
  SELECT DISTINCT ON (ka.kelas_id, ka.guru_id)
         ka.kelas_id, ka.guru_id, ka.mapel_id
  FROM kelas_ajar ka
  ORDER BY ka.kelas_id, ka.guru_id, ka.created_at
) sub
WHERE j.mapel_id IS NULL
  AND j.kelas_id = sub.kelas_id
  AND j.guru_id = sub.guru_id;

-- Kunci unik baru: satu baris per santri/tanggal/guru/mapel.
-- NULLS NOT DISTINCT agar baris tanpa mapel tetap tidak bisa dobel.
ALTER TABLE absensi DROP CONSTRAINT IF EXISTS absensi_siswa_tgl_guru_key;
ALTER TABLE absensi
  ADD CONSTRAINT absensi_siswa_tgl_guru_mapel_key
  UNIQUE NULLS NOT DISTINCT (siswa_id, tanggal, guru_id, mapel_id);

ALTER TABLE jurnal DROP CONSTRAINT IF EXISTS jurnal_kelas_tgl_guru_key;
ALTER TABLE jurnal
  ADD CONSTRAINT jurnal_kelas_tgl_guru_mapel_key
  UNIQUE NULLS NOT DISTINCT (kelas_id, tanggal, guru_id, mapel_id);

CREATE INDEX IF NOT EXISTS absensi_mapel_idx ON absensi (kelas_id, mapel_id, tanggal);
CREATE INDEX IF NOT EXISTS jurnal_mapel_idx  ON jurnal  (kelas_id, mapel_id, tanggal);
