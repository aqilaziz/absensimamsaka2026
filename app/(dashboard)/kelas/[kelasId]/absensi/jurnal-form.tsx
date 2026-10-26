"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { hapusJurnal, simpanJurnal } from "./jurnal-actions";
import { konfirmasiHapus } from "@/lib/swal";
import type { Jurnal } from "@/lib/types";

const JAM = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function judulOtomatis(tanggal: string) {
  return `Pertemuan ${format(new Date(tanggal + "T00:00:00"), "EEEE, dd/MM/yyyy", { locale: localeId })}`;
}

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
    const teks = (k: string) => String(fd.get(k) ?? "").trim() || undefined;
    const angka = (k: string) => {
      const v = String(fd.get(k) ?? "").trim();
      return v === "" ? undefined : Number(v);
    };

    const input = {
      kelas_id: kelasId,
      tanggal,
      judul: teks("judul"),
      jam_mulai: angka("jam_mulai"),
      jam_selesai: angka("jam_selesai"),
      topik: teks("topik"),
      materi: teks("materi"),
      kegiatan: teks("kegiatan"),
      catatan: teks("catatan"),
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
          Jurnal Sesi
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
          {/* ===== Judul + tanggal ===== */}
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Judul pertemuan
              </span>
              <input
                name="judul"
                disabled={!aktif}
                defaultValue={existing?.judul ?? judulOtomatis(tanggal)}
                className="input"
                placeholder="mis. Pertemuan Senin, 26/10/2026"
              />
            </label>
            <div className="pb-2 text-xs text-slate-500">
              {format(new Date(tanggal + "T00:00:00"), "EEEE, d MMMM yyyy", {
                locale: localeId,
              })}
            </div>
          </div>

          {/* ===== Jam pelajaran ===== */}
          <div>
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Jam pelajaran
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                name="jam_mulai"
                disabled={!aktif}
                defaultValue={existing?.jam_mulai ?? ""}
                className="input py-1.5"
              >
                <option value="">— Mulai —</option>
                {JAM.map((j) => (
                  <option key={j} value={j}>
                    Jam ke-{j}
                  </option>
                ))}
              </select>
              <select
                name="jam_selesai"
                disabled={!aktif}
                defaultValue={existing?.jam_selesai ?? ""}
                className="input py-1.5"
              >
                <option value="">— Selesai —</option>
                {JAM.map((j) => (
                  <option key={j} value={j}>
                    Jam ke-{j}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ===== Jurnal guru (opsional) ===== */}
          <div className="space-y-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <BookOpen size={14} className="text-slate-400" />
              Jurnal guru
              <span className="font-normal text-slate-400">(opsional)</span>
            </p>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Topik pembelajaran
              </span>
              <input
                name="topik"
                disabled={!aktif}
                defaultValue={existing?.topik ?? ""}
                className="input py-1.5"
                placeholder="mis. Bab 3 — Persamaan Kuadrat"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Materi / sub-topik
              </span>
              <textarea
                name="materi"
                rows={2}
                disabled={!aktif}
                defaultValue={existing?.materi ?? ""}
                className="input resize-y"
                placeholder="mis. Faktorisasi, rumus ABC, diskriminan…"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Metode pembelajaran
                </span>
                <input
                  name="kegiatan"
                  disabled={!aktif}
                  defaultValue={existing?.kegiatan ?? ""}
                  className="input py-1.5"
                  placeholder="mis. Diskusi kelompok, ceramah"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Catatan / refleksi
                </span>
                <input
                  name="catatan"
                  disabled={!aktif}
                  defaultValue={existing?.catatan ?? ""}
                  className="input py-1.5"
                  placeholder="mis. Siswa antusias, perlu remedial"
                />
              </label>
            </div>
          </div>

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
