"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { ambilKelas, lepasKelas } from "./actions";
import { temaMapel } from "@/lib/mapel";
import { toastGagal, toastSukses } from "@/lib/swal";
import type { WarnaMapel } from "@/lib/types";

interface KelasItem {
  id: string;
  nama: string;
  semester: string;
}

interface MapelItem {
  id: string;
  nama: string;
  warna: WarnaMapel;
}

interface Pengampu {
  id: string;
  kelas_id: string;
  mapel_id: string;
  guru_id: string;
}

/**
 * Daftar kelas + centang mapel yang diampu.
 *
 * Mapel TIDAK dikunci: satu mapel di satu kelas boleh diampu beberapa guru,
 * jadi setiap guru hanya melihat mapel yang sudah ia ambil (chip) dan bisa
 * menambah mapel lain kapan saja. Mapel milik guru lain tidak ditampilkan
 * agar kartu tetap ringkas.
 */
export function AmbilKelasGrid({
  uid,
  kelasList,
  mapels,
  pengampu,
}: {
  uid: string;
  kelasList: KelasItem[];
  mapels: MapelItem[];
  pengampu: Pengampu[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pilihan, setPilihan] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const mapelById = new Map(mapels.map((m) => [m.id, m]));
  const milikSayaPer = new Map<string, Pengampu[]>();
  for (const p of pengampu) {
    if (p.guru_id !== uid) continue;
    const arr = milikSayaPer.get(p.kelas_id) ?? [];
    arr.push(p);
    milikSayaPer.set(p.kelas_id, arr);
  }

  function simpanAmbil(kelasId: string) {
    const mapelId = pilihan[kelasId];
    if (!mapelId) return;
    startTransition(async () => {
      const res = await ambilKelas({ kelas_id: kelasId, mapel_id: mapelId });
      if (!res.ok) {
        const pesan = res.error ?? "Gagal mengambil mapel";
        setError(pesan);
        toastGagal(pesan);
        return;
      }
      setError(null);
      setPilihan((p) => {
        const next = { ...p };
        delete next[kelasId];
        return next;
      });
      toastSukses("Mapel berhasil diambil");
      router.refresh();
    });
  }

  function lepas(id: string, namaMapel: string) {
    startTransition(async () => {
      const res = await lepasKelas(id);
      if (!res.ok) {
        toastGagal(res.error ?? "Gagal melepas mapel");
        return;
      }
      toastSukses(`Mapel ${namaMapel} dilepas`);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 md:col-span-2">
          {error}
        </p>
      )}

      {kelasList.map((k) => {
        const milikSaya = milikSayaPer.get(k.id) ?? [];
        const terpakaiSaya = new Set(milikSaya.map((p) => p.mapel_id));
        const tersedia = mapels.filter((m) => !terpakaiSaya.has(m.id));

        return (
          <div
            key={k.id}
            className="flex flex-col gap-2 rounded-xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-900">
                {k.nama}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {k.semester}
              </span>
            </div>

            {milikSaya.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {milikSaya.map((p) => {
                  const m = mapelById.get(p.mapel_id);
                  if (!m) return null;
                  return (
                    <span
                      key={p.id}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${temaMapel(m.warna).badge}`}
                    >
                      {m.nama}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => lepas(p.id, m.nama)}
                        title="Lepas mapel ini"
                        className="rounded-full p-0.5 transition hover:bg-white/60 disabled:opacity-50"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {tersedia.length > 0 && (
              <div className="flex items-center gap-1.5">
                <select
                  value={pilihan[k.id] ?? ""}
                  onChange={(e) =>
                    setPilihan((p) => ({ ...p, [k.id]: e.target.value }))
                  }
                  className="input min-w-0 flex-1 py-1 text-sm"
                >
                  <option value="" disabled>
                    — pilih mapel —
                  </option>
                  {tersedia.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={pending || !pilihan[k.id]}
                  onClick={() => simpanAmbil(k.id)}
                  className="btn-primary shrink-0 py-1 text-sm disabled:opacity-50"
                >
                  Ambil
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
