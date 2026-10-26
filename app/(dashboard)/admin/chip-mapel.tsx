"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { temaMapel } from "@/lib/mapel";
import { pengampuKelas, type MapelPengampu } from "./actions";

function Chip({ m }: { m: MapelPengampu }) {
  const tema = temaMapel(m.warna);
  const daftarGuru =
    m.guru.length > 2
      ? `${m.guru.slice(0, 2).join(", ")} +${m.guru.length - 2}`
      : m.guru.join(", ");

  return (
    <span
      title={`${m.nama} — ${m.guru.join(", ")}`}
      className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${tema.badge}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tema.dot}`} />
      <span className="shrink-0">{m.nama}</span>
      <span className="truncate font-normal opacity-70">· {daftarGuru}</span>
    </span>
  );
}

/**
 * Chip mapel + guru pengampu pada kartu rekap admin.
 *
 * Hanya beberapa chip pertama yang dikirim bersama halaman; sisanya baru
 * diambil dari server saat tombol "+N mapel lainnya" diklik. Ini memangkas
 * ukuran halaman karena satu kelas bisa punya ~20 mapel.
 */
export function ChipMapel({
  kelasId,
  awal,
  total,
}: {
  kelasId: string;
  awal: MapelPengampu[];
  total: number;
}) {
  const [semua, setSemua] = useState<MapelPengampu[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function buka() {
    setGalat(null);
    startTransition(async () => {
      const res = await pengampuKelas(kelasId);
      if (!res.ok) {
        setGalat(res.error);
        return;
      }
      setSemua(res.mapel);
    });
  }

  const daftar = semua ?? awal;
  const sisa = total - awal.length;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {daftar.map((m) => (
        <Chip key={m.nama} m={m} />
      ))}

      {semua === null && sisa > 0 && (
        <button
          type="button"
          onClick={buka}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-200 disabled:opacity-60"
        >
          {pending && <Loader2 size={11} className="animate-spin" />}
          {pending ? "Memuat…" : `+${sisa} mapel lainnya`}
        </button>
      )}

      {galat && <span className="text-[11px] text-red-600">{galat}</span>}
    </div>
  );
}
