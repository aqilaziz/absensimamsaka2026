"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buatMapel, updateMapel, hapusMapel } from "./actions";
import { konfirmasiHapus, toastGagal, toastSukses } from "@/lib/swal";
import { PALET_MAPEL, WARNA_MAPEL_LIST, temaMapel } from "@/lib/mapel";
import type { Mapel, WarnaMapel } from "@/lib/types";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";

/**
 * Panel mata pelajaran (khusus admin): menambah, mengubah nama & warna,
 * atau menghapus. Menghapus mapel ikut melepas pengampu yang memakainya.
 */
export function MapelKelola({ mapels }: { mapels: Mapel[] }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [warna, setWarna] = useState<WarnaMapel>("emerald");
  const [namaBaru, setNamaBaru] = useState("");
  const [warnaBaru, setWarnaBaru] = useState<WarnaMapel>("emerald");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function tambah(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nama = namaBaru.trim();
    if (!nama) return;
    startTransition(async () => {
      const res = await buatMapel({ nama, warna: warnaBaru });
      if (!res.ok) {
        toastGagal(res.error ?? "Gagal menambah mapel");
        return;
      }
      toastSukses(`Mapel "${nama}" ditambahkan`);
      setNamaBaru("");
      router.refresh();
    });
  }

  function mulaiEdit(m: Mapel) {
    setEditId(m.id);
    setWarna(m.warna);
  }

  function simpan(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = { nama: String(fd.get("nama")), warna };
    startTransition(async () => {
      const res = await updateMapel(id, input);
      if (!res.ok) {
        toastGagal(res.error ?? "Gagal menyimpan");
        return;
      }
      toastSukses("Mata pelajaran diperbarui");
      setEditId(null);
      router.refresh();
    });
  }

  function hapus(m: Mapel) {
    startTransition(async () => {
      const ya = await konfirmasiHapus({
        teks: `Hapus mapel "${m.nama}"? Kelas yang memakainya akan menjadi tanpa mapel.`,
      });
      if (!ya) return;
      const res = await hapusMapel(m.id);
      if (!res.ok) {
        toastGagal(res.error ?? "Gagal menghapus");
        return;
      }
      toastSukses(`Mapel "${m.nama}" dihapus`);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700"
      >
        <span className="flex items-center gap-2">
          Mata pelajaran
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {mapels.length}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-2 border-t border-slate-100 p-3">
          <form
            onSubmit={tambah}
            className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200"
          >
            <input
              value={namaBaru}
              onChange={(e) => setNamaBaru(e.target.value)}
              required
              placeholder="Nama mapel baru, mis. Matematika"
              className="input w-full py-1.5 sm:w-64"
            />
            <div className="flex flex-wrap gap-1">
              {WARNA_MAPEL_LIST.map((w) => (
                <button
                  key={w}
                  type="button"
                  title={PALET_MAPEL[w].label}
                  aria-label={`Warna ${PALET_MAPEL[w].label}`}
                  onClick={() => setWarnaBaru(w)}
                  className={`h-6 w-6 rounded-full ${PALET_MAPEL[w].dot} ${
                    warnaBaru === w
                      ? "ring-2 ring-slate-800 ring-offset-1"
                      : "opacity-60 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={pending || !namaBaru.trim()}
              className="btn-primary py-1 text-xs disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-1">
                <Plus size={13} /> Tambah
              </span>
            </button>
          </form>

          {mapels.length === 0 && (
            <p className="px-1 py-2 text-xs text-slate-400">
              Belum ada mata pelajaran.
            </p>
          )}

          {mapels.map((m) => (
            <div
              key={m.id}
              className="rounded-lg ring-1 ring-slate-100 px-3 py-2"
            >
              {editId === m.id ? (
                <form
                  onSubmit={(e) => simpan(e, m.id)}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input
                    name="nama"
                    defaultValue={m.nama}
                    required
                    className="input w-full sm:w-48"
                  />
                  <div className="flex flex-wrap gap-1">
                    {WARNA_MAPEL_LIST.map((w) => (
                      <button
                        key={w}
                        type="button"
                        title={PALET_MAPEL[w].label}
                        aria-label={`Warna ${PALET_MAPEL[w].label}`}
                        onClick={() => setWarna(w)}
                        className={`h-6 w-6 rounded-full ${PALET_MAPEL[w].dot} ${
                          warna === w
                            ? "ring-2 ring-slate-800 ring-offset-1"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={pending}
                      className="btn-primary py-1 text-xs"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="btn-secondary py-1 text-xs"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span
                      className={`h-3 w-3 rounded-full ${temaMapel(m.warna).dot}`}
                    />
                    {m.nama}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => mulaiEdit(m)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="Ubah nama / warna"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => hapus(m)}
                      disabled={pending}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Hapus mapel"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
