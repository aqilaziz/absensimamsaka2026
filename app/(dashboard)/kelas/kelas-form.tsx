"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createKelas, updateKelas } from "./actions";
import { formatTanggal } from "@/lib/periode";
import type { Kelas, Semester } from "@/lib/types";

export function KelasForm({
  kelas,
  semesters,
  semesterAwal,
}: {
  kelas?: Kelas;
  semesters: Semester[];
  semesterAwal?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      nama: String(fd.get("nama")),
      semester_id: String(fd.get("semester_id")),
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
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        Edit
      </button>
    ) : (
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Buat Kelas
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
    >
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">
          Nama kelas (mis. XII IPA 1)
        </span>
        <input
          name="nama"
          required
          defaultValue={kelas?.nama}
          className="input w-56"
          placeholder="XII IPA 1"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">
          Semester
        </span>
        <select
          name="semester_id"
          required
          defaultValue={kelas?.semester_id ?? semesterAwal ?? ""}
          className="input w-64"
        >
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama === "genap" ? "Genap" : "Ganjil"} · {formatTanggal(s.tgl_mulai)} –{" "}
              {formatTanggal(s.tgl_selesai)}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Menyimpan…" : "Simpan"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
        Batal
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
