# Absensi Santri — Next.js + Supabase

Aplikasi absensi dan penilaian tugas untuk guru/madrasah: tahun pelajaran → semester (ganjil/genap) → kelas, import siswa dari Excel (copy-paste), absensi harian (Hadir/Sakit/Izin/Alpha + keterangan), tugas dengan ceklis atau nilai, rekap persentase per bulan/semester/tahun, detail riwayat santri lintas tahun (NIS), dan arsip tahun lama.

**Hierarki semester:** setiap tahun pelajaran otomatis punya 2 semester (Ganjil: `tgl_mulai`–`batas_semester`, Genap: `batas_semester`+1–`tgl_selesai`) lewat trigger. Kelas menempel ke satu semester (`kelas.semester_id`, NOT NULL), sehingga nama kelas yang sama bisa ada di Ganjil & Genap. Daftar kelas, tab rekap, dan riwayat santri difilter/per-semester.

Rancangan arsitektur: `../arsitektur-absensi-nextjs-supabase.md`

## Setup

1. **Buat proyek Supabase** di <https://supabase.com> (atau self-host).

2. **Jalankan migrasi SQL** — lewat SQL Editor dashboard, urut:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_triggers.sql`
   - `supabase/migrations/0004_views_rpc.sql`
   - `supabase/migrations/0005_semester.sql`
   - `supabase/migrations/0006_jurnal.sql`
   - `supabase/migrations/0007_mapel.sql`
   - `supabase/migrations/0008_role_admin.sql`
   - `supabase/migrations/0009_admin_kelola_kelas.sql`
   - `supabase/migrations/0010_model_bersama.sql`
   - `supabase/migrations/0011_data_bersama_global.sql`
   - `supabase/migrations/0012_model_rombel_pengampu.sql`

   Atau via CLI: `supabase link --project-ref <ref>` lalu `supabase db push`.

3. **Isi environment** — salin `.env.local.example` menjadi `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   # atau legacy anon key:
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

4. **Buat akun guru** — Authentication → Users → Add user (email + password).
   Profil dibuat otomatis oleh trigger `handle_new_user`. Setiap profil default ber-role `guru`.

5. **Jadikan seorang admin** — setelah migrasi `0008_role_admin.sql` dijalankan, set role
   `admin` untuk profil tertentu lewat SQL Editor:

   ```sql
   update profiles set role = 'admin' where nama = 'Nama Guru';
   ```

   Admin bisa melihat rekap kehadiran lintas guru di `/admin`, dan membuat rombel
   beserta daftar santrinya lewat `/admin/kelas-baru`.

6. **(Model rombel + pengampu, migrasi `0012_model_rombel_pengampu.sql`)** — admin
   menyiapkan, guru mencentang.

   - **Hanya admin** yang membuat/mengubah tahun pelajaran, semester, mata pelajaran,
     kelas (rombel), dan daftar santri. Semua baris master ber-`guru_id = NULL`.
   - **Tahun pelajaran hanya boleh satu yang aktif** untuk seluruh madrasah (index unik
     `satu_tahun_aktif_global`), sehingga semua guru otomatis memakai tahun yang sama.
   - **Kelas = rombel**: tidak lagi menempel pada satu mapel. Keunikan kelas adalah
     `(semester, nama)`. Mapel ditentukan lewat tabel **`kelas_ajar`** (pengampu).
   - **Guru** membuka menu **Ambil Kelas** (`/ambil-kelas`), mencentang kelas lalu memilih
     mapel yang ia ampu. Satu mapel di satu kelas hanya boleh diampu satu guru. Centang
     bisa dilepas kapan saja.
   - **Guru hanya melihat kelas & santri yang ia ampu.** Menu Tahun Pelajaran, pembuatan
     kelas, pengelolaan mapel, dan impor santri tidak muncul untuk guru.
   - **Absensi, tugas, pengumpulan, dan jurnal kembali milik masing-masing guru**
     (`guru_id`). Absensi unik per `(siswa, tanggal, guru)` dan jurnal per
     `(kelas, tanggal, guru)`, sehingga dua guru di kelas yang sama tidak saling
     menimpa. Admin hanya membaca semua data lewat `/admin`.

   **Alur singkat:** admin membuat tahun → mapel → rombel + santri; guru membuka
   **Ambil Kelas**, mencentang kelas & mapel; setelah itu kelas muncul di dashboard guru
   dan absensi/tugas/rekap bisa diisi.

7. **(Opsional) seed data contoh** — ubah email di `supabase/seed.sql` sesuai akun guru, jalankan di SQL Editor.

8. **Jalankan aplikasi**:

   ```bash
   npm install
   npm run dev
   ```

   Buka <http://localhost:3000> → login.

## Perintah

| Perintah            | Fungsi                    |
| ------------------- | ------------------------- |
| `npm run dev`       | development server        |
| `npm run build`     | build produksi            |
| `npm run typecheck` | cek TypeScript tanpa emit |

## Struktur singkat

- `app/(auth)/login` — halaman login
- `app/(dashboard)` — seluruh halaman setelah login (dilindungi middleware)
- `lib/supabase` — client Supabase (browser/server/middleware)
- `lib/validations` — skema Zod
- `supabase/migrations` — skema database, RLS, trigger, view/RPC, semester
