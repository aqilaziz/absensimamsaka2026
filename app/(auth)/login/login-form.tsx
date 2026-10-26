"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserRoundPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Login guru dengan email + kata sandi.
 *
 * Tidak ada pendaftaran mandiri maupun login Google: akun dibuat admin
 * madrasah (Supabase Auth admin API), dan pendaftaran lewat aplikasi
 * dimatikan di konfigurasi proyek.
 */
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [tampilPassword, setTampilPassword] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: String(fd.get("email")),
        password: String(fd.get("password")),
      });
      if (error) {
        setError("Email atau password salah.");
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          placeholder="nama@mam1paciran.sch.id"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={tampilPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setTampilPassword((v) => !v)}
            aria-label={
              tampilPassword ? "Sembunyikan password" : "Tampilkan password"
            }
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-600"
          >
            {tampilPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "Memproses…" : "Masuk"}
      </button>

      <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600 ring-1 ring-slate-200">
        <p className="flex items-center gap-1.5 font-semibold text-slate-700">
          <UserRoundPlus size={14} /> Belum punya akun?
        </p>
        <p className="mt-1 leading-relaxed">
          Akun guru dibuat oleh admin madrasah. Silakan minta admin
          mendaftarkan email Anda, lalu masuk dengan kata sandi yang diberikan.
          Lupa kata sandi? Minta admin mengatur ulang.
        </p>
        <a
          href="mailto:admin@mam1paciran.sch.id?subject=Permintaan%20akun%20Absensi%20Santri"
          className="mt-1.5 inline-block font-semibold text-emerald-700 hover:underline"
        >
          Hubungi admin: admin@mam1paciran.sch.id
        </a>
      </div>
    </form>
  );
}
