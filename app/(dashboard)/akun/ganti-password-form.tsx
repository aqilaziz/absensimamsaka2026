"use client";

import { useRef, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Ganti kata sandi sendiri.
 *
 * Kata sandi lama diverifikasi dulu lewat signInWithPassword, baru
 * `updateUser({ password })` dijalankan — jadi orang yang menemukan sesi
 * yang masih terbuka tidak bisa mengganti sandi tanpa tahu sandi lama.
 */
export function GantiPasswordForm({ email }: { email: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [tampil, setTampil] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const lama = String(fd.get("lama") ?? "");
    const baru = String(fd.get("baru") ?? "");
    const ulang = String(fd.get("ulang") ?? "");

    if (!email) {
      setPesan({ ok: false, teks: "Email akun tidak ditemukan." });
      return;
    }
    if (baru.length < 8) {
      setPesan({ ok: false, teks: "Kata sandi baru minimal 8 karakter." });
      return;
    }
    if (baru !== ulang) {
      setPesan({ ok: false, teks: "Konfirmasi kata sandi tidak sama." });
      return;
    }
    if (baru === lama) {
      setPesan({
        ok: false,
        teks: "Kata sandi baru harus berbeda dari yang sekarang.",
      });
      return;
    }

    setPending(true);
    setPesan(null);
    const supabase = createClient();

    const { error: errLama } = await supabase.auth.signInWithPassword({
      email,
      password: lama,
    });
    if (errLama) {
      setPending(false);
      setPesan({ ok: false, teks: "Kata sandi lama salah." });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: baru });
    setPending(false);

    if (error) {
      setPesan({ ok: false, teks: error.message });
      return;
    }

    setPesan({ ok: true, teks: "Kata sandi berhasil diperbarui." });
    formRef.current?.reset();
  }

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <KeyRound size={16} className="text-emerald-600" />
        Ganti kata sandi
      </h2>

      <form ref={formRef} onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Kata sandi sekarang
          </span>
          <div className="relative">
            <input
              name="lama"
              type={tampil ? "text" : "password"}
              required
              autoComplete="current-password"
              className="input pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setTampil((v) => !v)}
              aria-label={tampil ? "Sembunyikan" : "Tampilkan"}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
            >
              {tampil ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Kata sandi baru
            </span>
            <input
              name="baru"
              type={tampil ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              className="input"
              placeholder="minimal 8 karakter"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Ulangi kata sandi baru
            </span>
            <input
              name="ulang"
              type={tampil ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              className="input"
              placeholder="ulangi"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Menyimpan…" : "Simpan Kata Sandi"}
          </button>
          {pesan && (
            <p
              className={`text-sm ${pesan.ok ? "text-emerald-600" : "text-red-600"}`}
            >
              {pesan.teks}
            </p>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Setelah diganti, gunakan kata sandi baru saat masuk berikutnya. Sesi
          yang sedang aktif tidak terganggu.
        </p>
      </form>
    </section>
  );
}
