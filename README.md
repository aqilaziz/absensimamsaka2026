# Absensi Santri — Next.js + Supabase

Aplikasi absensi dan penilaian tugas untuk guru/madrasah: tahun pelajaran, kelas, import siswa dari Excel (copy-paste), absensi harian (Hadir/Sakit/Izin/Alpha + keterangan), tugas dengan ceklis atau nilai, rekap persentase per bulan/semester/tahun, detail riwayat santri lintas tahun (NIS), dan arsip tahun lama.

Rancangan arsitektur: `../arsitektur-absensi-nextjs-supabase.md`

## Setup

1. **Buat proyek Supabase** di <https://supabase.com> (atau self-host).

2. **Jalankan migrasi SQL** — lewat SQL Editor dashboard, urut:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_triggers.sql`
   - `supabase/migrations/0004_views_rpc.sql`

   Atau via CLI: `supabase link --project-ref <ref>` lalu `supabase db push`.

3. **Isi environment** — salin `.env.local.example` menjadi `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   # atau legacy anon key:
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

4. **Buat akun guru** — Authentication → Users → Add user (email + password).
   Profil dibuat otomatis oleh trigger `handle_new_user`.

5. **(Opsional) seed data contoh** — ubah email di `supabase/seed.sql` sesuai akun guru, jalankan di SQL Editor.

6. **Jalankan aplikasi**:

   ```bash
   npm install
   npm run dev
   ```

   Buka <http://localhost:3000> → login.

## Perintah

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | development server |
| `npm run build` | build produksi |
| `npm run typecheck` | cek TypeScript tanpa emit |

## Struktur singkat

- `app/(auth)/login` — halaman login
- `app/(dashboard)` — seluruh halaman setelah login (dilindungi middleware)
- `lib/supabase` — client Supabase (browser/server/middleware)
- `lib/validations` — skema Zod
- `supabase/migrations` — skema database, RLS, trigger, view/RPC
