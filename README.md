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

   Admin bisa melihat rekap kehadiran lintas guru di `/admin`, dan membuat kelas
   bersama beserta daftar santrinya lewat `/admin/kelas-baru`.

6. **(Data bersama, migrasi `0011_data_bersama_global.sql`)** — satu database untuk
   seluruh madrasah.

   - **Tahun pelajaran** hanya boleh **satu yang aktif** (dijaga index unik
     `satu_tahun_aktif_global`), sehingga semua guru otomatis memakai tahun yang sama.
     Admin membuatnya sebagai data bersama (`guru_id = NULL`); bila admin belum membuat,
     guru mana pun boleh membuat dan tahun itu langsung dipakai semua guru.
   - **Kelas, santri, dan mapel** dapat dibaca semua guru. Guru dapat menambah kelas
     sendiri, memakai kelas/mapel buatan guru lain, serta menambah, memperbaiki, dan
     menghapus santri pada kelas mana pun. Menghapus kelas tetap hanya pemiliknya/admin.
     Daftar mapel bersifat bersama: nama yang sama dipakai ulang, tidak dibuat ganda.
   - **Absensi, tugas, pengumpulan, dan jurnal** juga data bersama: semua guru melihat
     dan dapat mengisi/memperbaiki data yang sama, sehingga rekap dan dashboard admin
     merupakan gabungan seluruh guru. Bila dua guru mengisi kelas & tanggal yang sama,
     penyimpanan terakhir yang berlaku.
   - Kolom `guru_id` tetap diisi sebagai jejak audit (siapa pembuat/pencatat), bukan
     lagi pembatas akses.
   - Saat migrasi dijalankan, bila ada beberapa tahun aktif (satu per guru), sistem
     menyisakan satu (prioritas tahun bersama → paling banyak kelas → paling baru) dan
     mengarsipkan sisanya.

   **Admin** tetap punya `/admin` (rekap lintas guru) dan `/admin/kelas-baru` untuk
   membuat kelas + daftar santri bersama sekaligus.

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
