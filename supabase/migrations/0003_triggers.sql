-- ============================================================
-- 0003_triggers.sql — Guard arsip, init pengumpulan, validasi nilai,
--                     profil otomatis, updated_at
-- ============================================================

-- ----- Kunci data tahun arsip -----
create or replace function cegah_ubah_arsip()
returns trigger language plpgsql as $$
declare v_status status_tahun;
begin
  select tp.status into v_status
  from kelas k join tahun_pelajaran tp on tp.id = k.tahun_pelajaran_id
  where k.id = coalesce(new.kelas_id, old.kelas_id);

  if v_status = 'arsip' then
    raise exception 'Tahun pelajaran sudah diarsipkan, data tidak dapat diubah';
  end if;
  return coalesce(new, old);
end $$;

create trigger siswa_guard before insert or update or delete on siswa
  for each row execute function cegah_ubah_arsip();
create trigger absensi_guard before insert or update or delete on absensi
  for each row execute function cegah_ubah_arsip();
create trigger tugas_guard before insert or update or delete on tugas
  for each row execute function cegah_ubah_arsip();
create trigger pengumpulan_guard before insert or update or delete on pengumpulan
  for each row execute function cegah_ubah_arsip();

-- ----- Saat tugas dibuat → baris pengumpulan 'belum' untuk semua siswa kelas -----
create or replace function buat_pengumpulan_awal()
returns trigger language plpgsql as $$
begin
  insert into pengumpulan (tugas_id, siswa_id, kelas_id, guru_id)
  select new.id, s.id, new.kelas_id, new.guru_id
  from siswa s where s.kelas_id = new.kelas_id;
  return new;
end $$;

create trigger tugas_init_pengumpulan after insert on tugas
  for each row execute function buat_pengumpulan_awal();

-- ----- Siswa baru ditambahkan belakangan → baris pengumpulan untuk tugas yang sudah ada -----
create or replace function pengumpulan_untuk_siswa_baru()
returns trigger language plpgsql as $$
begin
  insert into pengumpulan (tugas_id, siswa_id, kelas_id, guru_id)
  select t.id, new.id, new.kelas_id, new.guru_id
  from tugas t where t.kelas_id = new.kelas_id;
  return new;
end $$;

create trigger siswa_init_pengumpulan after insert on siswa
  for each row execute function pengumpulan_untuk_siswa_baru();

-- ----- Validasi nilai pengumpulan -----
create or replace function validasi_nilai_pengumpulan()
returns trigger language plpgsql as $$
declare v_tipe tipe_penilaian; v_maks numeric;
begin
  select tipe, nilai_maks into v_tipe, v_maks from tugas where id = new.tugas_id;
  if v_tipe = 'ceklis' and new.nilai is not null then
    raise exception 'Tugas tipe ceklis tidak menerima nilai';
  end if;
  if v_tipe = 'nilai' and new.nilai is not null and new.nilai > v_maks then
    raise exception 'Nilai melebihi nilai maksimal (%)', v_maks;
  end if;
  -- Nilai diisi berarti sudah dikumpulkan
  if new.nilai is not null and new.status = 'belum' then
    new.status := 'sudah';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger pengumpulan_validasi before insert or update on pengumpulan
  for each row execute function validasi_nilai_pengumpulan();

-- ----- updated_at absensi -----
create or replace function sentuh_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger absensi_updated before update on absensi
  for each row execute function sentuh_updated_at();

-- ----- Buat profil otomatis saat user baru (dipakai juga saat sign-up) -----
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, nama)
  values (new.id, coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
