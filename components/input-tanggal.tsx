"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, addMonths, format, getDay, parse, startOfMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Minggu dimulai Senin (kebiasaan Indonesia). */
const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function keTanggal(iso: string | null | undefined): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = parse(iso, "yyyy-MM-dd", new Date());
  return Number.isNaN(d.getTime()) ? null : d;
}

function iso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

/** "Senin, 26 Oktober 2026" */
export function tanggalIndonesia(isoStr: string | null | undefined) {
  const d = keTanggal(isoStr);
  if (!d) return "";
  return format(d, "EEEE, d MMMM yyyy", { locale: localeId });
}

interface Props {
  /** Nama field untuk dikirim bersama form (menghasilkan ISO yyyy-MM-dd). */
  name?: string;
  /** Mode terkontrol. */
  value?: string;
  /** Mode tak terkontrol. */
  defaultValue?: string;
  onChange?: (nilaiIso: string) => void;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  /** Teks saat belum ada tanggal. */
  placeholder?: string;
}

/**
 * Input tanggal dengan tampilan Indonesia: nama hari + tanggal + bulan + tahun.
 * Nilai yang dikirim ke form tetap ISO (yyyy-MM-dd) lewat input tersembunyi,
 * sehingga validasi server tidak berubah.
 */
export function InputTanggal({
  name,
  value,
  defaultValue,
  onChange,
  required,
  disabled,
  min,
  max,
  className = "",
  placeholder = "Pilih tanggal",
}: Props) {
  const terkontrol = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const nilai = terkontrol ? (value as string) : internal;

  const [buka, setBuka] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const dipilih = keTanggal(nilai);
  const [bulanLihat, setBulanLihat] = useState<Date>(
    startOfMonth(dipilih ?? new Date()),
  );

  // Ikuti nilai dari luar saat popover dibuka.
  useEffect(() => {
    if (buka) setBulanLihat(startOfMonth(keTanggal(nilai) ?? new Date()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buka]);

  // Tutup saat klik di luar atau tombol Escape.
  useEffect(() => {
    if (!buka) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setBuka(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setBuka(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [buka]);

  function pilih(isoBaru: string) {
    if (!terkontrol) setInternal(isoBaru);
    onChange?.(isoBaru);
    setBuka(false);
  }

  const sel = useMemo(() => {
    const awal = startOfMonth(bulanLihat);
    // getDay: Minggu = 0 → geser supaya Senin jadi kolom pertama.
    const geser = (getDay(awal) + 6) % 7;
    const mulai = addDays(awal, -geser);
    return Array.from({ length: 42 }, (_, i) => addDays(mulai, i));
  }, [bulanLihat]);

  const tahunOpsi = useMemo(() => {
    const lihat = bulanLihat.getFullYear();
    const terpilih = dipilih?.getFullYear() ?? lihat;
    const dari = Math.min(lihat, terpilih) - 6;
    return Array.from({ length: 13 }, (_, i) => dari + i);
  }, [bulanLihat, dipilih]);

  function diizinkan(d: Date) {
    const s = iso(d);
    if (min && s < min) return false;
    if (max && s > max) return false;
    return true;
  }

  const hariIni = iso(new Date());

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={nilai} />}

      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setBuka((v) => !v);
        }}
        className="input flex w-full items-center gap-2 text-left disabled:opacity-60"
      >
        <CalendarDays size={15} className="shrink-0 text-slate-400" />
        <span
          className={`min-w-0 flex-1 truncate ${
            dipilih ? "text-slate-900" : "text-slate-400"
          }`}
        >
          {dipilih ? tanggalIndonesia(nilai) : placeholder}
        </span>
        {dipilih && !required && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            title="Kosongkan tanggal"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              pilih("");
            }}
            className="shrink-0 rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
          >
            <X size={13} />
          </span>
        )}
      </button>

      {buka && (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute left-0 z-50 mt-1 w-[19rem] rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setBulanLihat((d) => addMonths(d, -1))}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex flex-1 items-center justify-center gap-1">
              <select
                value={bulanLihat.getMonth()}
                onChange={(e) =>
                  setBulanLihat(
                    new Date(
                      bulanLihat.getFullYear(),
                      Number(e.target.value),
                      1,
                    ),
                  )
                }
                className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs font-semibold text-slate-700"
              >
                {NAMA_BULAN.map((b, i) => (
                  <option key={b} value={i}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                value={bulanLihat.getFullYear()}
                onChange={(e) =>
                  setBulanLihat(
                    new Date(Number(e.target.value), bulanLihat.getMonth(), 1),
                  )
                }
                className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs font-semibold text-slate-700"
              >
                {tahunOpsi.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setBulanLihat((d) => addMonths(d, 1))}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {NAMA_HARI.map((h) => (
              <span
                key={h}
                className="py-1 text-center text-[10px] font-semibold uppercase text-slate-400"
              >
                {h}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {sel.map((d) => {
              const s = iso(d);
              const lainBulan = d.getMonth() !== bulanLihat.getMonth();
              const terpilih = s === nilai;
              const boleh = diizinkan(d);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!boleh}
                  onClick={() => pilih(s)}
                  className={`h-8 rounded-lg text-xs transition ${
                    terpilih
                      ? "bg-emerald-600 font-semibold text-white"
                      : lainBulan
                        ? "text-slate-300 hover:bg-slate-50"
                        : "text-slate-700 hover:bg-slate-100"
                  } ${!boleh ? "cursor-not-allowed opacity-40 hover:bg-transparent" : ""} ${
                    s === hariIni && !terpilih
                      ? "ring-1 ring-inset ring-emerald-400"
                      : ""
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => pilih(hariIni)}
              disabled={!diizinkan(new Date())}
              className="text-xs font-medium text-emerald-700 hover:underline disabled:opacity-40"
            >
              Hari ini
            </button>
            {!required && (
              <button
                type="button"
                onClick={() => pilih("")}
                className="text-xs font-medium text-slate-500 hover:underline"
              >
                Kosongkan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
