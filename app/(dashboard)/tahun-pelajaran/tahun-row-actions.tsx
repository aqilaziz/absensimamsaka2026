"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { arsipkanTahun, hapusTahun } from "./actions";
import { konfirmasiHapus, toastGagal, toastSukses } from "@/lib/swal";
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

  async function onArsip() {
    const yakin = await konfirmasiHapus({
      judul: "Arsipkan tahun ini?",
      teks: `Arsipkan tahun ${nama}? Data tidak bisa diubah lagi.`,
      tombol: "Ya, arsipkan",
    });
    if (!yakin) return;
    setError(null);
    startTransition(async () => {
      const res = await arsipkanTahun(id);
      if (!res.ok) {
        const pesan = res.error ?? "Gagal mengarsipkan";
        setError(pesan);
        toastGagal(pesan);
        return;
      }
      toastSukses(`Tahun ${nama} diarsipkan`);
      router.refresh();
    });
  }

  async function onHapus() {
    const yakin = await konfirmasiHapus({
      teks: `Hapus tahun ${nama} beserta SELURUH data kelas, santri, absensi, dan tugas di dalamnya? Tindakan ini tidak bisa dibatalkan.`,
    });
    if (!yakin) return;
    setError(null);
    startTransition(async () => {
      const res = await hapusTahun(id);
      if (!res.ok) {
        const pesan = res.error ?? "Gagal menghapus";
        setError(pesan);
        toastGagal(pesan);
        return;
      }
      toastSukses(`Tahun ${nama} dihapus`);
      router.refresh();
    });
  }

  if (status !== "aktif") return null;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
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
