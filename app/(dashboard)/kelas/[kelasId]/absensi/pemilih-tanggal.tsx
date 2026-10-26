"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { InputTanggal } from "@/components/input-tanggal";

/**
 * Pemilih tanggal absensi: begitu tanggal dipilih, halaman langsung dibuka
 * untuk tanggal itu (tanpa tombol "Buka"). Panah kiri/kanan tetap ada untuk
 * berpindah satu hari, berguna saat membetulkan absensi beberapa hari.
 */
export function PemilihTanggal({
  kelasId,
  tanggal,
  min,
  max,
}: {
  kelasId: string;
  tanggal: string;
  min?: string;
  max?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nilai, setNilai] = useState(tanggal);

  useEffect(() => setNilai(tanggal), [tanggal]);

  function pergi(isoBaru: string) {
    if (!isoBaru || isoBaru === tanggal) {
      setNilai(tanggal);
      return;
    }
    setNilai(isoBaru);
    startTransition(() => {
      router.push(`/kelas/${kelasId}/absensi?tanggal=${isoBaru}`);
    });
  }

  function geser(hari: number) {
    const target = format(addDays(new Date(tanggal + "T00:00:00"), hari), "yyyy-MM-dd");
    if (min && target < min) return;
    if (max && target > max) return;
    pergi(target);
  }

  const bisaMundur = !min || format(addDays(new Date(tanggal + "T00:00:00"), -1), "yyyy-MM-dd") >= min;
  const bisaMaju = !max || format(addDays(new Date(tanggal + "T00:00:00"), 1), "yyyy-MM-dd") <= max;

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => geser(-1)}
        disabled={!bisaMundur || pending}
        title="Hari sebelumnya"
        aria-label="Hari sebelumnya"
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>

      <InputTanggal
        value={nilai}
        onChange={pergi}
        min={min}
        max={max}
        required
        disabled={pending}
        className="w-[17.5rem] max-w-full"
      />

      <button
        type="button"
        onClick={() => geser(1)}
        disabled={!bisaMaju || pending}
        title="Hari berikutnya"
        aria-label="Hari berikutnya"
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>

      {pending && (
        <Loader2 size={14} className="animate-spin text-emerald-600" />
      )}
    </div>
  );
}
