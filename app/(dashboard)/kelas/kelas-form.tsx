"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createKelas, updateKelas } from "./actions";
import { formatTanggal } from "@/lib/periode";
import { PALET_MAPEL, WARNA_MAPEL_LIST, warnaMapelSaran } from "@/lib/mapel";
import type { Kelas, Mapel, Semester, WarnaMapel } from "@/lib/types";

const BARU = "__baru__";

export function KelasForm({
  kelas,
  semesters,
  mapels,
  semesterAwal,
}: {
  kelas?: Kelas;
  semesters: Semester[];
  mapels: Mapel[];
  semesterAwal?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const saranWarna = useMemo(
    () => warnaMapelSaran(mapels.map((m) => m.warna)),
    [mapels],
  );
  const [mapelId, setMapelId] = useState<string>(kelas?.mapel_id ?? "");
  const [warnaBaru, setWarnaBaru] = useState<WarnaMapel>(saranWarna);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const namaBaru = String(fd.get("mapel_baru") ?? "").trim();
    const input =
      mapelId === BARU
        ? {
            nama: String(fd.get("nama")),
            semester_id: String(fd.get("semester_id")),
            mapel_baru: { nama: namaBaru, warna: warnaBaru },
          }
        : {
            nama: String(fd.get("nama")),
            semester_id: String(fd.get("semester_id")),
            mapel_id: mapelId || undefined,
          };
    setError(null);
    startTransition(async () => {
      const res = kelas
        ? await updateKelas(kelas.id, input)
        : await createKelas(input);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return kelas ? (
      <button
        onClick={() => {
          setMapelId(kelas.mapel_id ?? "");
          setWarnaBaru(saranWarna);
          setOpen(true);
        }}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        Edit
      </button>
    ) : (
      <button
        onClick={() => {
          setMapelId("");
          setWarnaBaru(saranWarna);
          setOpen(true);
        }}
        className="btn-primary"
      >
        + Buat Kelas
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
    >
      <label className="block w-full sm:w-auto">
        <span className="mb-1 block text-xs font-medium text-slate-600">
          Mata pelajaran
        </span>
        <select
          name="mapel_pilih"
          required
          value={mapelId}
          onChange={(e) => setMapelId(e.target.value)}
          className="input w-full sm:w-56"
        >
          <option value="" disabled>
            — Pilih mata pelajaran —
          </option>
          {mapels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama}
            </option>
          ))}
          <option value={BARU}>+ Mata pelajaran baru…</option>
        </select>
      </label>

      {mapelId === BARU && (
        <>
          <label className="block w-full sm:w-auto">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Nama mapel baru
            </span>
            <input
              name="mapel_baru"
              required
              className="input w-full sm:w-56"
              placeholder="mis. Matematika"
            />
          </label>
          <div className="w-full sm:w-auto">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Warna tema
            </span>
            <div className="flex flex-wrap gap-1.5">
              {WARNA_MAPEL_LIST.map((w) => {
                const t = PALET_MAPEL[w];
                return (
                  <button
                    key={w}
                    type="button"
                    title={t.label}
                    aria-label={`Warna ${t.label}`}
                    onClick={() => setWarnaBaru(w)}
                    className={`h-8 w-8 rounded-full ${t.dot} ${
                      warnaBaru === w
                        ? "ring-2 ring-slate-800 ring-offset-2"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      <label className="block w-full sm:w-auto">
        <span className="mb-1 block text-xs font-medium text-slate-600">
          Nama kelas (mis. XII IPA 1)
        </span>
        <input
          name="nama"
          required
          defaultValue={kelas?.nama}
          className="input w-full sm:w-56"
          placeholder="XII IPA 1"
        />
      </label>
      <label className="block w-full sm:w-auto">
        <span className="mb-1 block text-xs font-medium text-slate-600">
          Semester
        </span>
        <select
          name="semester_id"
          required
          defaultValue={kelas?.semester_id ?? semesterAwal ?? ""}
          className="input w-full sm:w-64"
        >
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama === "genap" ? "Genap" : "Ganjil"} ·{" "}
              {formatTanggal(s.tgl_mulai)} – {formatTanggal(s.tgl_selesai)}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Menyimpan…" : "Simpan"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="btn-secondary"
      >
        Batal
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
