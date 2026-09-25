"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTahun, updateTahun } from "./actions";
import type { TahunPelajaran } from "@/lib/types";

export function TahunForm({ tahun }: { tahun?: TahunPelajaran }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      nama: String(fd.get("nama")),
      tgl_mulai: String(fd.get("tgl_mulai")),
      tgl_selesai: String(fd.get("tgl_selesai")),
      batas_semester: String(fd.get("batas_semester")),
    };
    setError(null);
    startTransition(async () => {
      const res = tahun
        ? await updateTahun(tahun.id, input)
        : await createTahun(input);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return tahun ? (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        Edit
      </button>
    ) : (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        + Buat Tahun Pelajaran
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
    >
      <h3 className="text-sm font-semibold text-slate-900">
        {tahun ? `Edit ${tahun.nama}` : "Tahun Pelajaran Baru"}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama (mis. 2026/2027)">
          <input
            name="nama"
            required
            defaultValue={tahun?.nama}
            className="input"
            placeholder="2026/2027"
          />
        </Field>
        <Field label="Batas akhir semester ganjil">
          <input
            name="batas_semester"
            type="date"
            required
            defaultValue={tahun?.batas_semester}
            className="input"
          />
        </Field>
        <Field label="Tanggal mulai">
          <input
            name="tgl_mulai"
            type="date"
            required
            defaultValue={tahun?.tgl_mulai}
            className="input"
          />
        </Field>
        <Field label="Tanggal selesai">
          <input
            name="tgl_selesai"
            type="date"
            required
            defaultValue={tahun?.tgl_selesai}
            className="input"
          />
        </Field>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
