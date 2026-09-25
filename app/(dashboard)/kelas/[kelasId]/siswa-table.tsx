"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hapusSiswa, updateSiswa } from "./actions";
import { NamaSantriLink } from "@/components/nama-santri-link";
import type { Siswa } from "@/lib/types";

export function SiswaTable({
  siswaList,
  aktif,
}: {
  siswaList: Siswa[];
  aktif: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full min-w-[480px]">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="th w-12">No</th>
            <th className="th">Nama Santri</th>
            <th className="th w-40">NIS</th>
            {aktif && <th className="th w-40">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {siswaList.map((s, i) => (
            <SiswaRow key={s.id} siswa={s} no={i + 1} aktif={aktif} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SiswaRow({
  siswa,
  no,
  aktif,
}: {
  siswa: Siswa;
  no: number;
  aktif: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      siswa_id: siswa.id,
      nama: String(fd.get("nama")),
      nis: String(fd.get("nis") ?? ""),
    };
    setError(null);
    startTransition(async () => {
      const res = await updateSiswa(input);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function onDelete() {
    if (!confirm(`Hapus ${siswa.nama} beserta seluruh absensi dan nilainya?`))
      return;
    setError(null);
    startTransition(async () => {
      const res = await hapusSiswa(siswa.id);
      if (!res.ok) setError(res.error ?? "Gagal menghapus");
      router.refresh();
    });
  }

  if (editing) {
    return (
      <tr className="bg-emerald-50/40">
        <td className="td">{no}</td>
        <td className="td" colSpan={aktif ? 1 : 2}>
          <form onSubmit={onSave} className="flex flex-wrap items-center gap-2">
            <input
              name="nama"
              defaultValue={siswa.nama}
              required
              className="input w-56 py-1.5"
            />
            <input
              name="nis"
              defaultValue={siswa.nis ?? ""}
              placeholder="NIS (opsional)"
              className="input w-36 py-1.5"
            />
            <button type="submit" disabled={pending} className="btn-primary py-1.5">
              Simpan
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn-secondary py-1.5"
            >
              Batal
            </button>
          </form>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </td>
        {aktif && <td className="td" />}
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50/60">
      <td className="td text-slate-400">{no}</td>
      <td className="td">
        <NamaSantriLink id={siswa.id} nama={siswa.nama} />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </td>
      <td className="td text-slate-500">{siswa.nis ?? "—"}</td>
      {aktif && (
        <td className="td">
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              disabled={pending}
              className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Hapus
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}
