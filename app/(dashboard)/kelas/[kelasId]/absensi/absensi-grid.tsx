"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { simpanAbsensi } from "./actions";
import { NamaSantriLink } from "@/components/nama-santri-link";
import type { Absensi, Siswa, StatusAbsensi } from "@/lib/types";

interface AbsenState {
  status: StatusAbsensi;
  keterangan: string;
}

const STATUS_LIST: {
  key: StatusAbsensi;
  label: string;
  aktifClass: string;
}[] = [
  {
    key: "hadir",
    label: "Hadir",
    aktifClass: "bg-emerald-600 text-white border-emerald-600",
  },
  {
    key: "sakit",
    label: "Sakit",
    aktifClass: "bg-amber-500 text-white border-amber-500",
  },
  {
    key: "izin",
    label: "Izin",
    aktifClass: "bg-sky-500 text-white border-sky-500",
  },
  {
    key: "alpha",
    label: "Alpha",
    aktifClass: "bg-red-600 text-white border-red-600",
  },
];

export function AbsensiGrid({
  kelasId,
  tanggal,
  siswaList,
  existing,
  aktif,
}: {
  kelasId: string;
  tanggal: string;
  siswaList: Siswa[];
  existing: Absensi[];
  aktif: boolean;
}) {
  const [state, setState] = useState<Record<string, AbsenState>>(() => {
    const map: Record<string, AbsenState> = {};
    const byId = new Map(existing.map((a) => [a.siswa_id, a]));
    for (const s of siswaList) {
      const ex = byId.get(s.id);
      map[s.id] = ex
        ? { status: ex.status, keterangan: ex.keterangan ?? "" }
        : { status: "hadir", keterangan: "" };
    }
    return map;
  });
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function setStatus(siswaId: string, status: StatusAbsensi) {
    setState((prev) => ({
      ...prev,
      [siswaId]: {
        status,
        keterangan:
          status === "sakit" || status === "izin"
            ? (prev[siswaId]?.keterangan ?? "")
            : "",
      },
    }));
    setPesan(null);
  }

  function setKeterangan(siswaId: string, keterangan: string) {
    setState((prev) => ({
      ...prev,
      [siswaId]: { ...prev[siswaId], keterangan },
    }));
  }

  function tandaiSemuaHadir() {
    setState((prev) => {
      const next: Record<string, AbsenState> = {};
      for (const id of Object.keys(prev)) {
        next[id] = { status: "hadir", keterangan: "" };
      }
      return next;
    });
    setPesan(null);
  }

  function onSimpan() {
    // Validasi keterangan wajib untuk sakit/izin
    const kurang = siswaList.find((s) => {
      const st = state[s.id];
      return (
        (st.status === "sakit" || st.status === "izin") &&
        st.keterangan.trim().length === 0
      );
    });
    if (kurang) {
      setPesan({
        ok: false,
        teks: `Keterangan wajib diisi untuk ${kurang.nama} (sakit/izin).`,
      });
      return;
    }

    startTransition(async () => {
      const res = await simpanAbsensi({
        kelas_id: kelasId,
        tanggal,
        items: siswaList.map((s) => ({
          siswa_id: s.id,
          status: state[s.id].status,
          keterangan: state[s.id].keterangan || undefined,
        })),
      });
      if (!res.ok) {
        setPesan({ ok: false, teks: res.error ?? "Gagal menyimpan" });
        return;
      }
      setPesan({ ok: true, teks: "Absensi tersimpan." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {aktif && (
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={tandaiSemuaHadir} className="btn-secondary">
            Tandai semua Hadir
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th w-12">No</th>
              <th className="th">Nama Santri</th>
              <th className="th">Status</th>
              <th className="th w-64">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {siswaList.map((s, i) => {
              const st = state[s.id];
              const butuhKeterangan =
                st.status === "sakit" || st.status === "izin";
              return (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="td text-slate-400">{i + 1}</td>
                  <td className="td">
                    <NamaSantriLink id={s.id} nama={s.nama} />
                  </td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_LIST.map((opt) => {
                        const selected = st.status === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            disabled={!aktif}
                            onClick={() => setStatus(s.id, opt.key)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed ${
                              selected
                                ? opt.aktifClass
                                : "border-slate-300 text-slate-500 hover:border-slate-400"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="td">
                    {butuhKeterangan ? (
                      <input
                        value={st.keterangan}
                        disabled={!aktif}
                        onChange={(e) => setKeterangan(s.id, e.target.value)}
                        placeholder="Wajib diisi…"
                        className={`input py-1.5 ${
                          st.keterangan.trim() === ""
                            ? "border-amber-400 bg-amber-50"
                            : ""
                        }`}
                      />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {aktif && siswaList.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <button
            onClick={onSimpan}
            disabled={pending}
            className="btn-primary w-full sm:w-auto"
          >
            {pending ? "Menyimpan…" : "Simpan Absensi"}
          </button>
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
