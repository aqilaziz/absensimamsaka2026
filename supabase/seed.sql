-- ============================================================
-- seed.sql — data contoh untuk pengembangan lokal.
-- Prasyarat: buat user dulu lewat Authentication → Users di dashboard
--            (atau sign-up lewat aplikasi), lalu ganti email di bawah.
-- ============================================================

do $$
declare
  v_guru   uuid;
  v_tahun  uuid;
  v_kelas  uuid;
  v_siswa1 uuid;
  v_siswa2 uuid;
  v_siswa3 uuid;
  v_tugas  uuid;
begin
  select id into v_guru from auth.users where email = 'guru@contoh.com';
  if v_guru is null then
    raise exception 'User guru@contoh.com belum ada. Buat dulu di Authentication → Users.';
  end if;

  insert into tahun_pelajaran (guru_id, nama, tgl_mulai, tgl_selesai, batas_semester)
  values (v_guru, '2026/2027', '2026-07-13', '2027-06-20', '2026-12-20')
  returning id into v_tahun;

  -- Semester (Ganjil & Genap) dibuat otomatis oleh trigger tahun_buat_semester
  insert into kelas (tahun_pelajaran_id, semester_id, guru_id, nama)
  select v_tahun, s.id, v_guru, 'XII IPA 1'
  from semester s
  where s.tahun_pelajaran_id = v_tahun and s.nama = 'ganjil'
  returning id into v_kelas;

  insert into siswa (kelas_id, guru_id, nama, nis, urutan) values
    (v_kelas, v_guru, 'Ahmad Fauzi',  '1920.0345', 1) returning id into v_siswa1;
  insert into siswa (kelas_id, guru_id, nama, nis, urutan) values
    (v_kelas, v_guru, 'Budi Santoso', '1920.0346', 2) returning id into v_siswa2;
  insert into siswa (kelas_id, guru_id, nama, nis, urutan) values
    (v_kelas, v_guru, 'Citra Dewi',   '1920.0347', 3) returning id into v_siswa3;

  insert into absensi (siswa_id, kelas_id, guru_id, tanggal, status, keterangan) values
    (v_siswa1, v_kelas, v_guru, current_date,     'hadir', null),
    (v_siswa2, v_kelas, v_guru, current_date,     'sakit', 'Demam'),
    (v_siswa3, v_kelas, v_guru, current_date,     'izin',  'Acara keluarga'),
    (v_siswa1, v_kelas, v_guru, current_date - 1, 'hadir', null),
    (v_siswa2, v_kelas, v_guru, current_date - 1, 'hadir', null),
    (v_siswa3, v_kelas, v_guru, current_date - 1, 'alpha', null);

  insert into tugas (kelas_id, guru_id, judul, tipe, nilai_maks, tgl_diberikan, tgl_tenggat)
  values (v_kelas, v_guru, 'Ulangan Harian 1', 'nilai', 100, current_date - 3, current_date + 7)
  returning id into v_tugas;

  update pengumpulan set status = 'sudah', nilai = 85, tgl_kumpul = current_date
    where tugas_id = v_tugas and siswa_id = v_siswa1;
  update pengumpulan set status = 'sudah', nilai = 92, tgl_kumpul = current_date
    where tugas_id = v_tugas and siswa_id = v_siswa3;

  insert into tugas (kelas_id, guru_id, judul, tipe, tgl_diberikan)
  values (v_kelas, v_guru, 'LKPD Bab 3 - Fungsi', 'ceklis', current_date - 1)
  returning id into v_tugas;

  update pengumpulan set status = 'sudah', tgl_kumpul = current_date
    where tugas_id = v_tugas and siswa_id in (v_siswa1, v_siswa2);
end $$;
