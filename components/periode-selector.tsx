"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";

export type RekapTab = "absensi" | "tugas";
export type RekapPeriode = "bulan" | "semester" | "tahun";

export function PeriodeSelector({
  kelasId,
  tab,
  periode,
  nilai,
}: {
  kelasId: string;
  tab: RekapTab;
  periode: RekapPeriode;
  nilai?: string;
}) {
  const router = useRouter();

  function go(next: { tab?: RekapTab; periode?: RekapPeriode; nilai?: string }) {
    const t = next.tab ?? tab;
    const p = next.periode ?? periode;
    let n = next.nilai ?? nilai;
    if (next.periode && next.periode !== periode) {
      // reset nilai default saat ganti periode
      n =
        next.periode === "bulan"
          ? format(new Date(), "yyyy-MM")
          : next.periode === "semester"
            ? "ganjil"
            : undefined;
    }
    const params = new URLSearchParams({ tab: t, periode: p });
    if (n) params.set("nilai", n);
    router.push(`/kelas/${kelasId}/rekap?${params.toString()}`);
  }

  const bulanIni = format(new Date(), "yyyy-MM");

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Tab absensi/tugas */}
      <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200">
        {(
          [
            { key: "absensi", label: "Absensi" },
            { key: "tugas", label: "Tugas" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => go({ tab: t.key })}
            className={
              tab === t.key
                ? "rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white"
                : "rounded-lg px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Periode */}
      <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200">
        {(
          [
            { key: "bulan", label: "Bulan" },
            { key: "semester", label: "Semester" },
            { key: "tahun", label: "Tahun" },
          ] as const
        ).map((p) => (
          <button
            key={p.key}
            onClick={() => go({ periode: p.key })}
            className={
              periode === p.key
                ? "rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white"
                : "rounded-lg px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Nilai periode */}
      {periode === "bulan" && (
        <input
          type="month"
          value={nilai && /^\d{4}-\d{2}$/.test(nilai) ? nilai : bulanIni}
          onChange={(e) => go({ nilai: e.target.value })}
          className="input w-auto py-1.5"
        />
      )}
      {periode === "semester" && (
        <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200">
          {(
            [
              { key: "ganjil", label: "Ganjil" },
              { key: "genap", label: "Genap" },
            ] as const
          ).map((s) => (
            <button
              key={s.key}
              onClick={() => go({ nilai: s.key })}
              className={
                (nilai ?? "ganjil") === s.key
                  ? "rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white"
                  : "rounded-lg px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
