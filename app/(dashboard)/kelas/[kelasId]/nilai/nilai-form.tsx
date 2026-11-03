"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { InputTanggal } from "@/components/input-tanggal";
import { NamaSantriLink } from "@/components/nama-santri-link";
import { konfirmasiHapus } from "@/lib/swal";
import { JENIS_NILAI } from "@/lib/nilai";
import { hapusNilai, simpanNilai } from "./actions";
import type { NilaiHarian, Siswa } from "@/lib/types";

interface MapelOpsi {
  id: string;
  nama: string;
}

/** Pemilih tanggal + mapel + jenis penilaian. */
export function PemilihNilai({
  kelasId,
  tanggal,
  mapelId,
  jenis,
  mapelList,
  min,
  max,
}: {
  kelasId: string;
  tanggal: string;
  mapelId: string;
  jenis: string;
  mapelList: MapelOpsi[];
  min?: string;
  max?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nilaiTanggal, setNilaiTanggal] = useState(tanggal);

  useEffect(() => setNilaiTanggal(tanggal), [tanggal]);

  function pergi(next: { tanggal?: string; mapel?: string; jenis?: string }) {
    const t = next.tanggal ?? tanggal;
    const m = next.mapel ?? mapelId;
    const j = next.jenis ?? jenis;
    if (t === tanggal && m === mapelId && j === jenis) {
      setNilaiTanggal(tanggal);
      return;
    }
    setNilaiTanggal(t);
    startTransition(() => {
      router.push(
        `/kelas/${kelasId}/nilai?tanggal=${t}&mapel=${m}&jenis=${encodeURIComponent(j)}`,
      );
    });
  }

  function geser(hari: number) {
    const target = format(
      new Date(new Date(tanggal + "T00:00:00").getTime() + hari * 86400000),
      "yyyy-MM-dd",
    );
    if (min && target < min) return;
    if (max && target > max) return;
    pergi({ tanggal: target });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => geser(-1)}
          disabled={pending}
          title="Hari sebelumnya"
          aria-label="Hari sebelumnya"
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <InputTanggal
          value={nilaiTanggal}
          onChange={(v) => pergi({ tanggal: v })}
          min={min}
          max={max}
          required
          disabled={pending}
          className="w-[17.5rem] max-w-full"
        />
        <button
          type="button"
          onClick={() => geser(1)}
          disabled={pending}
          title="Hari berikutnya"
          aria-label="Hari berikutnya"
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
        {pending && <Loader2 size={14} className="animate-spin text-emerald-600" />}
      </div>

      {mapelList.length > 1 && (
        <select
          value={mapelId}
          onChange={(e) => pergi({ mapel: e.target.value })}
          disabled={pending}
          aria-label="Mata pelajaran"
          className="input w-full py-1.5 sm:w-auto"
        >
          {mapelList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama}
            </option>
          ))}
        </select>
      )}

      <select
        value={jenis}
        onChange={(e) => pergi({ jenis: e.target.value })}
        disabled={pending}
        aria-label="Jenis penilaian"
        className="input w-full py-1.5 sm:w-auto"
      >
        {JENIS_NILAI.map((j) => (
          <option key={j} value={j}>
            {j}
          </option>
        ))}
      </select>
    </div>
  );
}

interface Baris {
  nilai: string;
  catatan: string;
}

export function NilaiGrid({
  kelasId,
  mapelId,
  tanggal,
  jenis,
  siswaList,
  existing,
  bisaEdit,
}: {
  kelasId: string;
  mapelId: string;
  tanggal: string;
  jenis: string;
  siswaList: Siswa[];
  existing: NilaiHarian[];
  bisaEdit: boolean;
}) {
  const [state, setState] = useState<Record<string, Baris>>(() => {
    const map: Record<string, Baris> = {};
    const byId = new Map(existing.map((n) => [n.siswa_id, n]));
    for (const s of siswaList) {
      const ex = byId.get(s.id);
      map[s.id] = {
        nilai: ex ? String(ex.nilai) : "",
        catatan: ex?.catatan ?? "",
      };
    }
    return map;
  });
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const terisi = siswaList.filter((s) => state[s.id]?.nilai.trim() !== "");
  const rata =
    terisi.length > 0
      ? Math.round(
          (terisi.reduce((a, s) => a + Number(state[s.id].nilai), 0) /
            terisi.length) *
            10,
        ) / 10
      : null;

  function ubah(siswaId: string, patch: Partial<Baris>) {
    setState((prev) => ({ ...prev, [siswaId]: { ...prev[siswaId], ...patch } }));
    setPesan(null);
  }

  function onSimpan() {
    const salah = siswaList.find((s) => {
      const v = state[s.id].nilai.trim();
      if (v === "") return false;
      const n = Number(v);
      return Number.isNaN(n) || n < 0 || n > 100;
    });
    if (salah) {
      setPesan({
        ok: false,
        teks: `Nilai ${salah.nama} harus berupa angka 0–100.`,
      });
      return;
    }

    startTransition(async () => {
      const res = await simpanNilai({
        kelas_id: kelasId,
        mapel_id: mapelId,
        tanggal,
        jenis,
        items: siswaList.map((s) => {
          const v = state[s.id].nilai.trim();
          return {
            siswa_id: s.id,
            nilai: v === "" ? null : Number(v),
            catatan: state[s.id].catatan || undefined,
          };
        }),
      });
      if (!res.ok) {
        setPesan({ ok: false, teks: res.error ?? "Gagal menyimpan" });
        return;
      }
      setPesan({
        ok: true,
        teks: terisi.length > 0 ? "Nilai tersimpan." : "Nilai dikosongkan.",
      });
      router.refresh();
    });
  }

  async function onHapus() {
    const yakin = await konfirmasiHapus({
      teks: `Hapus semua nilai ${jenis} pada tanggal ini? Nilai yang sudah tersimpan akan hilang.`,
    });
    if (!yakin) return;
    startTransition(async () => {
      const res = await hapusNilai({
        kelas_id: kelasId,
        mapel_id: mapelId,
        tanggal,
        jenis,
      });
      if (!res.ok) {
        setPesan({ ok: false, teks: res.error ?? "Gagal menghapus" });
        return;
      }
      setState((prev) => {
        const next: Record<string, Baris> = {};
        for (const id of Object.keys(prev)) next[id] = { nilai: "", catatan: "" };
        return next;
      });
      setPesan({ ok: true, teks: "Nilai tanggal ini dihapus." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>
          <b className="text-slate-900">{terisi.length}</b>/{siswaList.length}{" "}
          dinilai
        </span>
        {rata != null && (
          <span>
            rata-rata <b className="text-slate-900">{rata}</b>
          </span>
        )}
        {!bisaEdit && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            hanya lihat
          </span>
        )}
      </div>

      {/* ===== HP: kartu per santri ===== */}
      <div className="space-y-2 sm:hidden">
        {siswaList.map((s, i) => (
          <div
            key={s.id}
            className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="flex min-w-0 items-baseline gap-1.5 text-sm font-medium leading-snug">
                <span className="shrink-0 text-[11px] font-normal text-slate-400">
                  {i + 1}
                </span>
                <NamaSantriLink id={s.id} nama={s.nama} />
              </p>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step={0.5}
                value={state[s.id].nilai}
                disabled={!bisaEdit}
                onChange={(e) => ubah(s.id, { nilai: e.target.value })}
                placeholder="—"
                aria-label={`Nilai ${s.nama}`}
                className="input w-20 shrink-0 py-1.5 text-center text-sm font-semibold"
              />
            </div>
            {bisaEdit && (
              <input
                value={state[s.id].catatan}
                onChange={(e) => ubah(s.id, { catatan: e.target.value })}
                placeholder="Catatan (opsional)"
                className="input mt-2 py-1.5 text-xs"
              />
            )}
          </div>
        ))}
      </div>

      {/* ===== Tablet/desktop: tabel ===== */}
      <div className="hidden overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200 sm:block">
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th w-12">No</th>
              <th className="th">Nama Santri</th>
              <th className="th w-28 text-center">Nilai</th>
              <th className="th">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {siswaList.map((s, i) => (
              <tr key={s.id} className="hover:bg-slate-50/60">
                <td className="td text-slate-400">{i + 1}</td>
                <td className="td">
                  <NamaSantriLink id={s.id} nama={s.nama} />
                </td>
                <td className="td">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step={0.5}
                    value={state[s.id].nilai}
                    disabled={!bisaEdit}
                    onChange={(e) => ubah(s.id, { nilai: e.target.value })}
                    placeholder="—"
                    aria-label={`Nilai ${s.nama}`}
                    className="input w-24 py-1.5 text-center font-semibold"
                  />
                </td>
                <td className="td">
                  <input
                    value={state[s.id].catatan}
                    disabled={!bisaEdit}
                    onChange={(e) => ubah(s.id, { catatan: e.target.value })}
                    placeholder="Opsional"
                    className="input py-1.5"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bisaEdit && siswaList.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <button
            onClick={onSimpan}
            disabled={pending}
            className="btn-primary w-full sm:w-auto"
          >
            {pending ? "Menyimpan…" : "Simpan Nilai"}
          </button>
          {existing.length > 0 && (
            <button
              onClick={onHapus}
              disabled={pending}
              className="btn-secondary w-full text-red-600 sm:w-auto"
            >
              Hapus Nilai Tanggal Ini
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
    </div>
  );
}
