-- 0017: nilai harian santri
--
-- Guru mencatat nilai harian per santri, per mata pelajaran, per tanggal.
-- Satu santri boleh punya beberapa nilai pada hari yang sama selama
-- jenisnya berbeda (mis. Harian dan Kuis).

CREATE TABLE IF NOT EXISTS nilai_harian (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id   uuid NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
  kelas_id   uuid NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  mapel_id   uuid NOT NULL REFERENCES mapel(id) ON DELETE RESTRICT,
  guru_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tanggal    date NOT NULL,
  jenis      text NOT NULL DEFAULT 'Harian',
  nilai      numeric(5, 2) NOT NULL CHECK (nilai >= 0 AND nilai <= 100),
  catatan    text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- satu nilai per santri/tanggal/mapel/jenis untuk tiap guru
  UNIQUE (siswa_id, tanggal, mapel_id, guru_id, jenis)
);

CREATE INDEX IF NOT EXISTS nilai_harian_kelas_idx ON nilai_harian (kelas_id, tanggal);
CREATE INDEX IF NOT EXISTS nilai_harian_siswa_idx ON nilai_harian (siswa_id);
CREATE INDEX IF NOT EXISTS nilai_harian_guru_idx ON nilai_harian (guru_id);

ALTER TABLE nilai_harian ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nilai milik sendiri" ON nilai_harian;
CREATE POLICY "nilai milik sendiri" ON nilai_harian
  FOR ALL TO authenticated
  USING (guru_id = (SELECT auth.uid()))
  WITH CHECK (guru_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "nilai admin" ON nilai_harian;
CREATE POLICY "nilai admin" ON nilai_harian
  FOR ALL TO authenticated
  USING (profil_role() = 'admin')
  WITH CHECK (profil_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON nilai_harian TO authenticated;

-- Tahun pelajaran yang sudah diarsipkan tidak boleh diubah.
DROP TRIGGER IF EXISTS nilai_harian_guard ON nilai_harian;
CREATE TRIGGER nilai_harian_guard
  BEFORE INSERT OR DELETE OR UPDATE ON nilai_harian
  FOR EACH ROW EXECUTE FUNCTION cegah_ubah_arsip();

DROP TRIGGER IF EXISTS nilai_harian_updated ON nilai_harian;
CREATE TRIGGER nilai_harian_updated
  BEFORE UPDATE ON nilai_harian
  FOR EACH ROW EXECUTE FUNCTION sentuh_updated_at();
