"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hapusKelas } from "./actions";

export function KelasDeleteButton({
  kelasId,
  nama,
}: {
  kelasId: string;
  nama: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onDelete() {
    if (
      !confirm(
        `Hapus kelas ${nama} beserta seluruh santri, absensi, dan tugasnya?`,
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await hapusKelas(kelasId);
      if (!res.ok) setError(res.error ?? "Gagal menghapus");
      router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={onDelete}
        disabled={pending}
        className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
      >
        Hapus
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
