"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTugas, updateTugas, hapusTugas } from "./actions";
import type { Tugas } from "@/lib/types";
import { format } from "date-fns";

export function TugasForm({
  kelasId,
  tugas,
  onClose,
}: {
  kelasId: string;
  tugas?: Tugas;
  onClose?: () => void;
}) {
  const [tipe, setTipe] = useState<"ceklis" | "nilai">(tugas?.tipe ?? "ceklis");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      judul: String(fd.get("judul")),
      deskripsi: String(fd.get("deskripsi") ?? "") || undefined,
      tipe,
      nilai_maks:
        tipe === "nilai" && fd.get("nilai_maks")
          ? Number(fd.get("nilai_maks"))
          : undefined,
      tgl_diberikan: String(fd.get("tgl_diberikan")),
      tgl_tenggat: String(fd.get("tgl_tenggat") ?? "") || undefined,
    };
    setError(null);
    startTransition(async () => {
      if (tugas) {
        const res = await updateTugas(tugas.id, kelasId, input);
        if (!res.ok) {
          setError(res.error ?? "Gagal menyimpan");
          return;
        }
        onClose?.();
        router.refresh();
      } else {
        const res = await createTugas(kelasId, input);
        if (!res.ok) {
          setError(res.error ?? "Gagal menyimpan");
          return;
        }
        router.push(`/kelas/${kelasId}/tugas/${res.tugasId}`);
        router.refresh();
      }
    });
  }

  function onHapus() {
    if (!tugas) return;
    if (!confirm(`Hapus tugas "${tugas.judul}" beserta seluruh pengumpulannya?`))
      return;
    setError(null);
    startTransition(async () => {
      const res = await hapusTugas(tugas.id, kelasId);
      if (!res.ok) {
        setError(res.error ?? "Gagal menghapus");
        return;
      }
      router.push(`/kelas/${kelasId}/tugas`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Judul tugas / kegiatan
          </span>
          <input
            name="judul"
            required
            defaultValue={tugas?.judul}
            className="input"
            placeholder="mis. LKPD Bab 3 - Fungsi"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Deskripsi (opsional)
          </span>
          <textarea
            name="deskripsi"
            rows={2}
            defaultValue={tugas?.deskripsi ?? ""}
            className="input"
          />
        </label>

        <div>
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Tipe penilaian
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTipe("ceklis")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                tipe === "ceklis"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 text-slate-500 hover:border-slate-400"
              }`}
            >
              Ceklis saja
            </button>
            <button
              type="button"
              onClick={() => setTipe("nilai")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                tipe === "nilai"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 text-slate-500 hover:border-slate-400"
              }`}
            >
              Dengan nilai
            </button>
          </div>
        </div>

        {tipe === "nilai" && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Nilai maksimal
            </span>
            <input
              name="nilai_maks"
              type="number"
              min={1}
              step="any"
              required
              defaultValue={tugas?.nilai_maks ?? 100}
              className="input"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Tanggal diberikan
          </span>
          <input
            name="tgl_diberikan"
            type="date"
            required
            defaultValue={
              tugas?.tgl_diberikan ?? format(new Date(), "yyyy-MM-dd")
            }
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Tenggat (opsional)
          </span>
          <input
            name="tgl_tenggat"
            type="date"
            defaultValue={tugas?.tgl_tenggat ?? ""}
            className="input"
          />
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Menyimpan…" : tugas ? "Simpan Perubahan" : "Simpan Tugas"}
        </button>
        {onClose && (
          <button type="button" onClick={onClose} className="btn-secondary">
            Batal
          </button>
        )}
        {tugas && (
          <button
            type="button"
            onClick={onHapus}
            disabled={pending}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            Hapus Tugas
          </button>
        )}
      </div>
    </form>
  );
}
