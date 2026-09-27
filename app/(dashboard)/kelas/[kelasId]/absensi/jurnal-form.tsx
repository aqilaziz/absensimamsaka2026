"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronDown } from "lucide-react";
import { hapusJurnal, simpanJurnal } from "./jurnal-actions";
import { konfirmasiHapus } from "@/lib/swal";
import type { Jurnal } from "@/lib/types";

export function JurnalForm({
  kelasId,
  tanggal,
  existing,
  aktif,
}: {
  kelasId: string;
  tanggal: string;
  existing: Jurnal | null;
  aktif: boolean;
}) {
  const sudahAda = Boolean(existing);
  const [buka, setBuka] = useState(sudahAda);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pertemuanRaw = String(fd.get("pertemuan") ?? "").trim();
    const input = {
      kelas_id: kelasId,
      tanggal,
      pertemuan: pertemuanRaw === "" ? undefined : Number(pertemuanRaw),
      materi: String(fd.get("materi") ?? "").trim() || undefined,
      tujuan: String(fd.get("tujuan") ?? "").trim() || undefined,
      kegiatan: String(fd.get("kegiatan") ?? "").trim() || undefined,
      catatan: String(fd.get("catatan") ?? "").trim() || undefined,
    };
    setPesan(null);
    startTransition(async () => {
      const res = await simpanJurnal(input);
      if (!res.ok) {
        setPesan({ ok: false, teks: res.error ?? "Gagal menyimpan jurnal" });
        return;
      }
      setPesan({ ok: true, teks: "Jurnal tersimpan." });
      router.refresh();
    });
  }

  async function onHapus() {
    const yakin = await konfirmasiHapus({
      teks: "Hapus jurnal untuk tanggal ini?",
    });
    if (!yakin) return;
    setPesan(null);
    startTransition(async () => {
      const res = await hapusJurnal({ kelas_id: kelasId, tanggal });
      if (!res.ok) {
        setPesan({ ok: false, teks: res.error ?? "Gagal menghapus jurnal" });
        return;
      }
      setPesan({ ok: true, teks: "Jurnal dihapus." });
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={buka}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <BookOpen size={16} className="text-emerald-600" />
          Jurnal Mengajar
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
            {sudahAda ? "sudah diisi" : "opsional"}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${buka ? "rotate-180" : ""}`}
        />
      </button>

      {buka && (
        <form
          key={existing?.updated_at ?? "kosong"}
          onSubmit={onSubmit}
          className="space-y-4 border-t border-slate-100 px-4 py-4"
        >
          <p className="text-xs text-slate-500">
            Catat pokok bahasan dan kegiatan hari ini. Bagian ini opsional —
            cukup isi yang perlu saja.
          </p>

          <label className="block sm:max-w-[10rem]">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Pertemuan ke- (opsional)
            </span>
            <input
              name="pertemuan"
              type="number"
              min={1}
              disabled={!aktif}
              defaultValue={existing?.pertemuan ?? ""}
              className="input py-1.5"
              placeholder="mis. 12"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Pokok bahasan / materi
            </span>
            <input
              name="materi"
              disabled={!aktif}
              defaultValue={existing?.materi ?? ""}
              className="input"
              placeholder="mis. Bab 3 — Fungsi Kuadrat"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Tujuan pembelajaran
              </span>
              <textarea
                name="tujuan"
                rows={3}
                disabled={!aktif}
                defaultValue={existing?.tujuan ?? ""}
                className="input resize-y"
                placeholder="Apa yang diharapkan dikuasai santri hari ini?"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Kegiatan pembelajaran
              </span>
              <textarea
                name="kegiatan"
                rows={3}
                disabled={!aktif}
                defaultValue={existing?.kegiatan ?? ""}
                className="input resize-y"
                placeholder="mis. Diskusi kelompok, latihan soal, presentasi…"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Catatan / refleksi guru (opsional)
            </span>
            <textarea
              name="catatan"
              rows={3}
              disabled={!aktif}
              defaultValue={existing?.catatan ?? ""}
              className="input resize-y"
              placeholder="Kendala, hal yang perlu diperbaiki, santri yang perlu perhatian…"
            />
          </label>

          {aktif && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button type="submit" disabled={pending} className="btn-primary">
                {pending ? "Menyimpan..." : "Simpan Jurnal"}
              </button>
              {sudahAda && (
                <button
                  type="button"
                  onClick={onHapus}
                  disabled={pending}
                  className="btn-secondary text-red-600"
                >
                  Hapus Jurnal
                </button>
              )}
              {pesan && (
                <p
                  className={`text-sm ${pesan.ok ? "text-emerald-600" : "text-red-600"}`}
                >
                  {pesan.teks}
                </p>
              )}
            </div>
          )}
        </form>
      )}
    </section>
  );
}