"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { arsipkanTahun, hapusTahun } from "./actions";
import type { StatusTahun } from "@/lib/types";

export function TahunRowActions({
  id,
  status,
  nama,
}: {
  id: string;
  status: StatusTahun;
  nama: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onArsip() {
    if (!confirm(`Arsipkan tahun ${nama}? Data tidak bisa diubah lagi.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await arsipkanTahun(id);
      if (!res.ok) setError(res.error ?? "Gagal mengarsipkan");
      router.refresh();
    });
  }

  function onHapus() {
    if (
      !confirm(
        `Hapus tahun ${nama} beserta SELURUH data kelas, santri, absensi, dan tugas di dalamnya? Tindakan ini tidak bisa dibatalkan.`,
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await hapusTahun(id);
      if (!res.ok) setError(res.error ?? "Gagal menghapus");
      router.refresh();
    });
  }

  if (status !== "aktif") return null;

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={onArsip}
        disabled={pending}
        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
      >
        Arsipkan
      </button>
      <button
        onClick={onHapus}
        disabled={pending}
        className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
      >
        Hapus
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
