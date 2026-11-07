"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";

export type RekapTab = "absensi" | "nilai" | "tugas" | "jurnal";
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

  function go(next: {
    tab?: RekapTab;
    periode?: RekapPeriode;
    nilai?: string;
  }) {
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
    <div className="flex max-w-full flex-wrap items-center gap-2 sm:gap-3">
      {/* Tab absensi/tugas */}
      <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 p-1">
        {(
          [
            { key: "absensi", label: "Absensi" },
            { key: "nilai", label: "Nilai" },
            { key: "tugas", label: "Tugas" },
            { key: "jurnal", label: "Jurnal" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => go({ tab: t.key })}
            className={
              tab === t.key
                ? "shrink-0 whitespace-nowrap rounded-xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm"
                : "shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition active:bg-white/60"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Periode */}
      <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 p-1">
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
                ? "shrink-0 whitespace-nowrap rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                : "shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition active:bg-white/60"
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
          className="input w-full py-1.5 sm:w-auto"
        />
      )}
      {periode === "semester" && (
        <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 p-1">
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
                  ? "shrink-0 whitespace-nowrap rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white"
                  : "shrink-0 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
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
