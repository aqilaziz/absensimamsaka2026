"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateNis } from "./actions";

export function NisForm({
  siswaId,
  nis,
}: {
  siswaId: string;
  nis: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await updateNis({
        siswa_id: siswaId,
        nis: String(fd.get("nis") ?? ""),
      });
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        {nis ? "Edit NIS" : "Isi NIS"}
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
    >
      <input
        name="nis"
        defaultValue={nis ?? ""}
        placeholder="Nomor Induk Santri"
        className="input w-full py-1.5 sm:w-44"
      />
      <button type="submit" disabled={pending} className="btn-primary py-1.5">
        Simpan
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="btn-secondary py-1.5"
      >
        Batal
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
