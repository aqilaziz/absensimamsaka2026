"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatTanggalPanjang } from "@/lib/periode";
import type { StatusAbsensi } from "@/lib/types";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";

export interface HariAbsensi {
  tanggal: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  total: number;
}

const WARNA: Record<StatusAbsensi, string> = {
  hadir: "bg-emerald-100 text-emerald-700",
  sakit: "bg-amber-100 text-amber-700",
  izin: "bg-sky-100 text-sky-700",
  alpha: "bg-red-100 text-red-700",
};

const LABEL: Record<StatusAbsensi, string> = {
  hadir: "H",
  sakit: "S",
  izin: "I",
  alpha: "A",
};

/**
 * Riwayat tanggal yang sudah pernah diisi absen untuk satu kelas.
 *
 * Berguna untuk memperbaiki kesalahan absen beberapa hari lalu: klik tanggal
 * akan membuka grid absensi hari itu (bisa juga diedit, termasuk hari lampau).
 */
export function RiwayatAbsensi({
  kelasId,
  hariList,
  tanggalAktif,
}: {
  kelasId: string;
  hariList: HariAbsensi[];
  tanggalAktif: string;
}) {
  const [terbuka, setTerbuka] = useState(true);
  const [batas, setBatas] = useState(12);

  const ditampilkan = useMemo(
    () => hariList.slice(0, batas),
    [hariList, batas],
  );
  const adaAlpha = useMemo(() => hariList.some((h) => h.alpha > 0), [hariList]);

  if (hariList.length === 0) {
    return (
      <p className="card flex items-start gap-2 text-sm text-slate-500">
        <CalendarDays className="mt-0.5 shrink-0 text-slate-400" size={16} />
        Belum ada absensi yang tercatat untuk kelas ini. Tanggal akan muncul di
        sini setelah Anda menyimpan absensi pertama.
      </p>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <button
        type="button"
        onClick={() => setTerbuka((v) => !v)}
        aria-expanded={terbuka}
        className="flex w-full items-center gap-2 px-4 py-3 text-left sm:px-5"
      >
        <CalendarDays className="shrink-0 text-emerald-600" size={16} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">
            Riwayat Absensi ({hariList.length} hari)
          </span>
          <span className="block text-xs text-slate-500">
            {adaAlpha
              ? "Klik tanggal untuk melihat atau memperbaiki absensi hari itu."
              : "Klik tanggal untuk melihat atau memperbaiki absensi hari itu."}
          </span>
        </span>
        {terbuka ? (
          <ChevronUp className="shrink-0 text-slate-400" size={16} />
        ) : (
          <ChevronDown className="shrink-0 text-slate-400" size={16} />
        )}
      </button>

      {terbuka && (
        <div className="border-t border-slate-100 p-3 sm:p-4">
          <ul className="space-y-1.5">
            {ditampilkan.map((h) => {
              const aktif = h.tanggal === tanggalAktif;
              return (
                <li key={h.tanggal}>
                  <Link
                    href={`/kelas/${kelasId}/absensi?tanggal=${h.tanggal}`}
                    aria-current={aktif ? "date" : undefined}
                    className={
                      "flex flex-col gap-2 rounded-lg px-3 py-2 transition sm:flex-row sm:flex-wrap sm:items-center sm:justify-between " +
                      (aktif
                        ? "bg-emerald-50 ring-1 ring-emerald-200"
                        : "hover:bg-slate-50")
                    }
                  >
                    <span className="min-w-0 truncate text-sm font-medium text-slate-800">
                      {formatTanggalPanjang(h.tanggal)}
                      {aktif && (
                        <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                          sedang dibuka
                        </span>
                      )}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                      {(["hadir", "sakit", "izin", "alpha"] as StatusAbsensi[])
                        .filter((s) => h[s] > 0)
                        .map((s) => (
                          <span
                            key={s}
                            className={`rounded px-1.5 py-0.5 ${WARNA[s]}`}
                          >
                            {LABEL[s]} {h[s]}
                          </span>
                        ))}
                      <span className="text-slate-400">/ {h.total} santri</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {hariList.length > batas && (
            <button
              type="button"
              onClick={() => setBatas((b) => b + 30)}
              className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Tampilkan {Math.min(30, hariList.length - batas)} hari lagi
            </button>
          )}
        </div>
      )}
    </div>
  );
}
