"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hapusBanyakSiswa, hapusSiswa, updateSiswa } from "./actions";
import { NamaSantriLink } from "@/components/nama-santri-link";
import { konfirmasiHapus, toastGagal, toastSukses } from "@/lib/swal";
import type { Siswa } from "@/lib/types";

export function SiswaTable({
  siswaList,
  aktif,
}: {
  siswaList: Siswa[];
  aktif: boolean;
}) {
  const [terpilih, setTerpilih] = useState<string[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [pendingBulk, startBulk] = useTransition();
  const router = useRouter();

  const semuaTerpilih =
    siswaList.length > 0 && terpilih.length === siswaList.length;

  function toggleSemua() {
    setTerpilih(semuaTerpilih ? [] : siswaList.map((s) => s.id));
  }

  function toggleSatu(id: string) {
    setTerpilih((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function onHapusTerpilih() {
    if (terpilih.length === 0) return;
    const yakin = await konfirmasiHapus({
      teks: `Hapus ${terpilih.length} santri terpilih beserta seluruh absensi dan nilainya?`,
      tombol: `Ya, hapus ${terpilih.length}`,
    });
    if (!yakin) return;
    setBulkError(null);
    startBulk(async () => {
      const res = await hapusBanyakSiswa({ siswa_ids: terpilih });
      if (!res.ok) {
        const pesan = res.error ?? "Gagal menghapus";
        setBulkError(pesan);
        toastGagal(pesan);
        return;
      }
      setTerpilih([]);
      toastSukses(`${terpilih.length} santri dihapus`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {aktif && terpilih.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 px-4 py-2.5 ring-1 ring-red-200">
          <p className="text-sm font-medium text-red-700">
            {terpilih.length} santri dipilih
          </p>
          <button
            onClick={onHapusTerpilih}
            disabled={pendingBulk}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pendingBulk ? "Menghapus…" : `Hapus ${terpilih.length} terpilih`}
          </button>
          <button
            onClick={() => setTerpilih([])}
            className="text-xs text-slate-500 hover:underline"
          >
            Batalkan pilihan
          </button>
          {bulkError && <p className="text-xs text-red-600">{bulkError}</p>}
        </div>
      )}
      {/* ===== Tampilan HP: daftar kartu ===== */}
      <ul className="space-y-2 sm:hidden">
        {siswaList.map((s, i) => (
          <SiswaCard
            key={s.id}
            siswa={s}
            no={i + 1}
            aktif={aktif}
            checked={terpilih.includes(s.id)}
            onToggle={() => toggleSatu(s.id)}
          />
        ))}
      </ul>

      {/* ===== Tampilan tablet/desktop: tabel ===== */}
      <div className="hidden overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200 sm:block">
        <table className="w-full min-w-[480px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {aktif && (
                <th className="th w-10">
                  <input
                    type="checkbox"
                    checked={semuaTerpilih}
                    onChange={toggleSemua}
                    aria-label="Pilih semua"
                    className="h-4 w-4 accent-emerald-600"
                  />
                </th>
              )}
              <th className="th w-12">No</th>
              <th className="th">Nama Santri</th>
              <th className="th w-40">NIS</th>
              {aktif && <th className="th w-40">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {siswaList.map((s, i) => (
              <SiswaRow
                key={s.id}
                siswa={s}
                no={i + 1}
                aktif={aktif}
                checked={terpilih.includes(s.id)}
                onToggle={() => toggleSatu(s.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Logika ubah/hapus satu santri, dipakai tabel (desktop) & kartu (HP). */
function useSiswaAksi(siswa: Siswa) {
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

  async function onDelete() {
    const yakin = await konfirmasiHapus({
      teks: `Hapus ${siswa.nama} beserta seluruh absensi dan nilainya?`,
    });
    if (!yakin) return;
    setError(null);
    startTransition(async () => {
      const res = await hapusSiswa(siswa.id);
      if (!res.ok) {
        const pesan = res.error ?? "Gagal menghapus";
        setError(pesan);
        toastGagal(pesan);
        return;
      }
      toastSukses(`${siswa.nama} dihapus`);
      router.refresh();
    });
  }

  return { editing, setEditing, error, pending, onSave, onDelete };
}

function SiswaRow({
  siswa,
  no,
  aktif,
  checked,
  onToggle,
}: {
  siswa: Siswa;
  no: number;
  aktif: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  const { editing, setEditing, error, pending, onSave, onDelete } =
    useSiswaAksi(siswa);

  if (editing) {
    return (
      <tr className="bg-emerald-50/40">
        {aktif && <td className="td" />}
        <td className="td">{no}</td>
        <td className="td" colSpan={2}>
          <form
            onSubmit={onSave}
            className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <input
              name="nama"
              defaultValue={siswa.nama}
              required
              className="input w-full py-1.5 sm:w-56"
            />
            <input
              name="nis"
              defaultValue={siswa.nis ?? ""}
              placeholder="NIS (opsional)"
              className="input w-full py-1.5 sm:w-36"
            />
            <button
              type="submit"
              disabled={pending}
              className="btn-primary py-1.5"
            >
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
    <tr className={`hover:bg-slate-50/60 ${checked ? "bg-red-50/40" : ""}`}>
      {aktif && (
        <td className="td">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            aria-label={`Pilih ${siswa.nama}`}
            className="h-4 w-4 accent-emerald-600"
          />
        </td>
      )}
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

/** Kartu santri untuk layar HP (tanpa tabel yang harus digeser). */
function SiswaCard({
  siswa,
  no,
  aktif,
  checked,
  onToggle,
}: {
  siswa: Siswa;
  no: number;
  aktif: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  const { editing, setEditing, error, pending, onSave, onDelete } =
    useSiswaAksi(siswa);

  if (editing) {
    return (
      <li className="rounded-xl bg-emerald-50/60 p-3 ring-1 ring-emerald-200">
        <form onSubmit={onSave} className="space-y-2">
          <input
            name="nama"
            defaultValue={siswa.nama}
            required
            className="input py-2 text-sm"
          />
          <input
            name="nis"
            defaultValue={siswa.nis ?? ""}
            placeholder="NIS (opsional)"
            className="input py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="btn-primary flex-1 py-2 text-sm"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn-secondary flex-1 py-2 text-sm"
            >
              Batal
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      </li>
    );
  }

  return (
    <li
      className={`rounded-xl p-3 shadow-sm ring-1 ring-slate-200 ${
        checked ? "bg-red-50/50" : "bg-white"
      }`}
    >
      <div className="flex items-start gap-2">
        {aktif && (
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            aria-label={`Pilih ${siswa.nama}`}
            className="mt-1 h-5 w-5 shrink-0 accent-emerald-600"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1.5 text-sm font-medium leading-snug">
            <span className="shrink-0 text-[11px] font-normal text-slate-400">
              {no}
            </span>
            <NamaSantriLink id={siswa.id} nama={siswa.nama} />
          </p>
          <p className="text-xs text-slate-500">NIS: {siswa.nis ?? "—"}</p>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        {aktif && (
          <div className="flex shrink-0 flex-col gap-1.5">
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 active:bg-slate-50"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              disabled={pending}
              className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-600 active:bg-red-50 disabled:opacity-50"
            >
              Hapus
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
