"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, X } from "lucide-react";
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

  function simpanAmbil(kelasId: string) {
    const mapelId = pilihan[kelasId];
    if (!mapelId) return;
    startTransition(async () => {
      const res = await ambilKelas({ kelas_id: kelasId, mapel_id: mapelId });
      if (!res.ok) {
        const pesan = res.error ?? "Gagal mengambil kelas";
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
      toastSukses("Kelas berhasil diambil");
      router.refresh();
    });
  }

  function lepas(id: string, namaMapel: string) {
    startTransition(async () => {
      const res = await lepasKelas(id);
      if (!res.ok) {
        toastGagal(res.error ?? "Gagal melepas kelas");
        return;
      }
      toastSukses(`Kelas ${namaMapel} dilepas`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {kelasList.map((k) => {
        const semua = pengampu.filter((p) => p.kelas_id === k.id);
        const milikSaya = semua.filter((p) => p.guru_id === uid);
        const terpakai = new Set(semua.map((p) => p.mapel_id));
        const tersedia = mapels.filter((m) => !terpakai.has(m.id));

        return (
          <div
            key={k.id}
            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-slate-900">
                {k.nama}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {k.semester}
              </span>
              {milikSaya.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <Check size={11} /> Anda mengampu
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {milikSaya.map((p) => {
                const m = mapelById.get(p.mapel_id);
                if (!m) return null;
                return (
                  <span
                    key={p.id}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${temaMapel(m.warna).badge}`}
                  >
                    {m.nama}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => lepas(p.id, m.nama)}
                      title="Lepas kelas ini"
                      className="rounded-full p-0.5 transition hover:bg-white/60 disabled:opacity-50"
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })}

              {semua
                .filter((p) => p.guru_id !== uid)
                .map((p) => {
                  const m = mapelById.get(p.mapel_id);
                  if (!m) return null;
                  return (
                    <span
                      key={p.id}
                      title="Sudah diambil guru lain"
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-400"
                    >
                      <Lock size={11} />
                      {m.nama}
                    </span>
                  );
                })}

              {milikSaya.length === 0 && semua.length === 0 && (
                <span className="text-xs text-slate-400">
                  Belum diambil siapa pun
                </span>
              )}
            </div>

            {tersedia.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={pilihan[k.id] ?? ""}
                  onChange={(e) =>
                    setPilihan((p) => ({ ...p, [k.id]: e.target.value }))
                  }
                  className="input w-full py-1.5 text-sm sm:w-64"
                >
                  <option value="" disabled>
                    — pilih mata pelajaran —
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
                  className="btn-primary py-1.5 text-sm disabled:opacity-50"
                >
                  Ambil
                </button>
              </div>
            )}

            {tersedia.length === 0 && milikSaya.length === 0 && (
              <p className="mt-2 text-xs text-amber-700">
                Semua mata pelajaran di kelas ini sudah diambil guru lain.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
