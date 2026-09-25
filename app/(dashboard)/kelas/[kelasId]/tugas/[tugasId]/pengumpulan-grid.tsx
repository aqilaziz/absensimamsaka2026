"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { simpanPengumpulan } from "../actions";
import { NamaSantriLink } from "@/components/nama-santri-link";
import type {
  Pengumpulan,
  Siswa,
  StatusKumpul,
  Tugas,
} from "@/lib/types";

export type PengumpulanRow = Pengumpulan & { siswa: Siswa };

interface RowState {
  status: StatusKumpul;
  nilai: string;
  catatan: string;
}

export function PengumpulanGrid({
  tugas,
  rows,
  aktif,
  lewatTenggat,
}: {
  tugas: Tugas;
  rows: PengumpulanRow[];
  aktif: boolean;
  lewatTenggat: boolean;
}) {
  const [state, setState] = useState<Record<string, RowState>>(() => {
    const map: Record<string, RowState> = {};
    for (const r of rows) {
      map[r.siswa_id] = {
        status: r.status,
        nilai: r.nilai != null ? String(r.nilai) : "",
        catatan: r.catatan ?? "",
      };
    }
    return map;
  });
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const nilaiRefs = useRef<(HTMLInputElement | null)[]>([]);

  const tipeNilai = tugas.tipe === "nilai";

  function update(siswaId: string, patch: Partial<RowState>) {
    setState((prev) => ({ ...prev, [siswaId]: { ...prev[siswaId], ...patch } }));
    setPesan(null);
  }

  function toggleSudah(siswaId: string) {
    const cur = state[siswaId];
    if (cur.status === "belum") {
      update(siswaId, { status: lewatTenggat ? "terlambat" : "sudah" });
    } else {
      update(siswaId, { status: "belum", nilai: "" });
    }
  }

  function toggleTerlambat(siswaId: string) {
    const cur = state[siswaId];
    if (cur.status === "sudah") update(siswaId, { status: "terlambat" });
    else if (cur.status === "terlambat") update(siswaId, { status: "sudah" });
  }

  function onNilaiChange(siswaId: string, nilai: string) {
    const patch: Partial<RowState> = { nilai };
    if (nilai !== "" && state[siswaId].status === "belum") {
      patch.status = lewatTenggat ? "terlambat" : "sudah";
    }
    update(siswaId, patch);
  }

  function tandaiSemua(status: StatusKumpul) {
    setState((prev) => {
      const next: Record<string, RowState> = {};
      for (const id of Object.keys(prev)) {
        next[id] =
          status === "belum"
            ? { ...prev[id], status, nilai: "" }
            : { ...prev[id], status };
      }
      return next;
    });
    setPesan(null);
  }

  function onSimpan() {
    for (const r of rows) {
      const st = state[r.siswa_id];
      if (
        tipeNilai &&
        st.nilai !== "" &&
        tugas.nilai_maks != null &&
        Number(st.nilai) > tugas.nilai_maks
      ) {
        setPesan({
          ok: false,
          teks: `Nilai ${r.siswa.nama} melebihi maksimal (${tugas.nilai_maks}).`,
        });
        return;
      }
      if (tipeNilai && st.nilai !== "" && Number(st.nilai) < 0) {
        setPesan({ ok: false, teks: `Nilai ${r.siswa.nama} tidak valid.` });
        return;
      }
    }

    startTransition(async () => {
      const res = await simpanPengumpulan({
        tugas_id: tugas.id,
        items: rows.map((r) => ({
          siswa_id: r.siswa_id,
          status: state[r.siswa_id].status,
          nilai:
            tipeNilai && state[r.siswa_id].nilai !== ""
              ? Number(state[r.siswa_id].nilai)
              : null,
          catatan: state[r.siswa_id].catatan || undefined,
        })),
      });
      if (!res.ok) {
        setPesan({ ok: false, teks: res.error ?? "Gagal menyimpan" });
        return;
      }
      setPesan({ ok: true, teks: "Pengumpulan tersimpan." });
      router.refresh();
    });
  }

  const jumlahSudah = rows.filter((r) => state[r.siswa_id].status !== "belum").length;
  const nilaiTerisi = rows
    .map((r) => state[r.siswa_id].nilai)
    .filter((n) => n !== "")
    .map(Number);
  const rataNilai =
    nilaiTerisi.length > 0
      ? Math.round((nilaiTerisi.reduce((a, b) => a + b, 0) / nilaiTerisi.length) * 10) / 10
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          <b className="text-slate-900">{jumlahSudah}</b>/{rows.length} sudah
          {tipeNilai && rataNilai != null && (
            <>
              {" "}
              · rata-rata <b className="text-slate-900">{rataNilai}</b>
            </>
          )}
        </p>
        {aktif && (
          <div className="flex gap-2">
            <button
              onClick={() => tandaiSemua(lewatTenggat ? "terlambat" : "sudah")}
              className="btn-secondary"
            >
              Tandai semua Sudah
            </button>
            <button onClick={() => tandaiSemua("belum")} className="btn-secondary">
              Reset
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[680px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th w-12">No</th>
              <th className="th">Nama Santri</th>
              <th className="th w-40">Sudah?</th>
              {tipeNilai && <th className="th w-28">Nilai</th>}
              <th className="th">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => {
              const st = state[r.siswa_id];
              const sudah = st.status !== "belum";
              return (
                <tr key={r.siswa_id} className="hover:bg-slate-50/60">
                  <td className="td text-slate-400">{i + 1}</td>
                  <td className="td">
                    <NamaSantriLink id={r.siswa_id} nama={r.siswa.nama} />
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sudah}
                        disabled={!aktif}
                        onChange={() => toggleSudah(r.siswa_id)}
                        className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                      />
                      {st.status === "terlambat" && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          terlambat
                        </span>
                      )}
                      {sudah && aktif && (
                        <button
                          type="button"
                          onClick={() => toggleTerlambat(r.siswa_id)}
                          className="text-[11px] text-slate-400 underline decoration-dotted hover:text-slate-600"
                        >
                          {st.status === "terlambat" ? "tepat waktu" : "tandai terlambat"}
                        </button>
                      )}
                    </div>
                  </td>
                  {tipeNilai && (
                    <td className="td">
                      <input
                        ref={(el) => {
                          nilaiRefs.current[i] = el;
                        }}
                        type="number"
                        min={0}
                        max={tugas.nilai_maks ?? undefined}
                        step="any"
                        value={st.nilai}
                        disabled={!aktif}
                        onChange={(e) => onNilaiChange(r.siswa_id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            nilaiRefs.current[i + 1]?.focus();
                          }
                        }}
                        className={`input w-24 py-1.5 ${
                          st.nilai !== "" &&
                          tugas.nilai_maks != null &&
                          Number(st.nilai) > tugas.nilai_maks
                            ? "border-red-400 bg-red-50"
                            : ""
                        }`}
                      />
                    </td>
                  )}
                  <td className="td">
                    <input
                      value={st.catatan}
                      disabled={!aktif}
                      onChange={(e) => update(r.siswa_id, { catatan: e.target.value })}
                      placeholder="opsional"
                      className="input py-1.5"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {aktif && rows.length > 0 && (
        <div className="flex items-center gap-3">
          <button onClick={onSimpan} disabled={pending} className="btn-primary">
            {pending ? "Menyimpan…" : "Simpan"}
          </button>
          {pesan && (
            <p className={`text-sm ${pesan.ok ? "text-emerald-600" : "text-red-600"}`}>
              {pesan.teks}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
