"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export interface HasilSimpan {
  ok: boolean;
  error?: string;
}

type SimpanFn = () => Promise<HasilSimpan>;

interface DaftarSimpan {
  jurnal: { current: SimpanFn | null };
  absensi: { current: SimpanFn | null };
}

const Ctx = createContext<DaftarSimpan | null>(null);

/**
 * Menyatukan tombol simpan absensi & jurnal.
 *
 * Kedua bagian tetap komponen terpisah (state-nya berbeda), tetapi
 * masing-masing mendaftarkan fungsi simpannya ke provider ini sehingga satu
 * tombol dapat menjalankan keduanya berurutan.
 */
export function SimpanSemuaProvider({ children }: { children: ReactNode }) {
  const jurnal = useRef<SimpanFn | null>(null);
  const absensi = useRef<SimpanFn | null>(null);
  const nilai = useRef<DaftarSimpan>({ jurnal, absensi });

  return <Ctx.Provider value={nilai.current}>{children}</Ctx.Provider>;
}

/** null bila komponen dipakai di luar provider (mis. halaman admin). */
export function useSimpanSemua() {
  return useContext(Ctx);
}

/** Daftarkan fungsi simpan milik komponen ke tombol gabungan. */
export function useDaftarSimpan(
  jenis: "jurnal" | "absensi",
  fn: SimpanFn,
) {
  const ctx = useSimpanSemua();
  const ref = useRef(fn);
  ref.current = fn;

  useEffect(() => {
    if (!ctx) return;
    const slot = ctx[jenis];
    slot.current = () => ref.current();
    return () => {
      slot.current = null;
    };
  }, [ctx, jenis]);
}

export function TombolSimpanSemua({ aktif }: { aktif: boolean }) {
  const ctx = useSimpanSemua();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(
    null,
  );

  if (!aktif) return null;

  function onClick() {
    setPesan(null);
    startTransition(async () => {
      // Absensi lebih dulu: kalau gagal, jurnal tidak ikut tersimpan
      // supaya keduanya tetap sinkron.
      const a = await ctx?.absensi.current?.();
      if (a && !a.ok) {
        setPesan({ ok: false, teks: a.error ?? "Gagal menyimpan absensi" });
        return;
      }
      const j = await ctx?.jurnal.current?.();
      if (j && !j.ok) {
        setPesan({
          ok: false,
          teks: `Absensi tersimpan, tetapi jurnal gagal: ${j.error ?? "kesalahan tidak diketahui"}`,
        });
        return;
      }
      setPesan({ ok: true, teks: "Absensi & jurnal tersimpan." });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={onClick}
        disabled={pending}
        className="btn-primary w-full sm:w-auto"
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={15} className="animate-spin" /> Menyimpan…
          </span>
        ) : (
          "Simpan Absensi & Jurnal"
        )}
      </button>
      {pesan && (
        <p
          className={`text-sm ${pesan.ok ? "text-emerald-600" : "text-red-600"}`}
        >
          {pesan.teks}
        </p>
      )}
    </div>
  );
}
