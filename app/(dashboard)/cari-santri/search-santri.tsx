"use client";

import { useEffect, useRef, useState } from "react";
import { NamaSantriLink } from "@/components/nama-santri-link";
import type { HasilCariSantri } from "@/lib/types";
import { Loader2, Search } from "lucide-react";

type HasilCari = HasilCariSantri;

/**
 * Kotak pencarian santri yang langsung menampilkan hasil saat diketik.
 * Tidak perlu menekan tombol "Cari" — ketikan di-debounce 250 ms agar tidak
 * membombardir server pada setiap huruf.
 */
export function SearchSantri({ qAwal = "" }: { qAwal?: string }) {
  const [q, setQ] = useState(qAwal);
  const [arsip, setArsip] = useState(false);
  const [hasil, setHasil] = useState<HasilCari[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [sudahCari, setSudahCari] = useState(false);

  // Penanda request terakhir: hasil dari ketikan lama diabaikan.
  const urutRef = useRef(0);

  useEffect(() => {
    const query = q.trim();

    if (query.length < 2) {
      setHasil([]);
      setMemuat(false);
      setGalat(null);
      setSudahCari(false);
      return;
    }

    const urut = ++urutRef.current;
    setMemuat(true);
    setGalat(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/santri?q=${encodeURIComponent(query)}${arsip ? "&arsip=1" : ""}`,
        );
        const json: { hasil: HasilCari[]; error?: string } = await res.json();
        if (urut !== urutRef.current) return; // ketikan lebih baru sudah jalan
        if (json.error) {
          setGalat(json.error);
          setHasil([]);
        } else {
          setHasil(json.hasil ?? []);
        }
        setSudahCari(true);
      } catch {
        if (urut !== urutRef.current) return;
        setGalat("Gagal menghubungi server. Periksa koneksi Anda.");
        setHasil([]);
      } finally {
        if (urut === urutRef.current) setMemuat(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [q, arsip]);

  const query = q.trim();

  return (
    <div className="space-y-3">
      <div className="card flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full min-w-0 flex-1 sm:min-w-60">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            inputMode="search"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ketik nama atau NIS... (langsung tampil)"
            aria-label="Cari santri berdasarkan nama atau NIS"
            className="input pl-9 pr-9"
            autoFocus
          />
          {memuat && (
            <Loader2
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-600"
            />
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={arsip}
            onChange={(e) => setArsip(e.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          Termasuk arsip
        </label>

        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="btn-secondary w-full py-1.5 sm:w-auto"
          >
            Bersihkan
          </button>
        )}
      </div>

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-amber-600">
          Ketik minimal 2 karakter agar pencarian mulai berjalan.
        </p>
      )}

      {galat && <p className="text-sm text-red-600">{galat}</p>}

      {query.length >= 2 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-500" aria-live="polite">
            {memuat && !sudahCari
              ? "Mencari..."
              : `${hasil.length} hasil untuk "${query}"`}
          </p>

          {hasil.length > 0 && (
            <div className="divide-y divide-slate-100 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              {hasil.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <NamaSantriLink id={s.id} nama={s.nama} />
                    {s.nis && (
                      <span className="ml-2 text-xs text-slate-400">
                        {s.nis}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>
                      {s.kelas.nama} · {s.kelas.tahun_pelajaran.nama}
                    </span>
                    {s.kelas.tahun_pelajaran.status === "arsip" && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">
                        Arsip
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {sudahCari && !memuat && hasil.length === 0 && !galat && (
            <p className="card text-sm text-slate-500">
              Tidak ada santri yang cocok dengan &quot;{query}&quot;.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
