import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { BulananSiswa } from "@/lib/types";

export function GrafikBulanan({ data }: { data: BulananSiswa[] }) {
  if (data.length === 0) {
    return (
      <p className="card text-sm text-slate-500">Belum ada data absensi.</p>
    );
  }

  return (
    <div className="card">
      <p className="mb-4 text-sm font-semibold text-slate-900">
        Persentase hadir per bulan
      </p>
      <div className="no-scrollbar -mx-1 flex h-36 items-end gap-3 overflow-x-auto px-1">
        {data.map((b) => {
          const total = Number(b.total_hari) || 1;
          const segmen = [
            { n: Number(b.hadir), cls: "bg-emerald-500" },
            { n: Number(b.sakit), cls: "bg-amber-400" },
            { n: Number(b.izin), cls: "bg-sky-400" },
            { n: Number(b.alpha), cls: "bg-red-500" },
          ];
          return (
            <div
              key={b.bulan}
              className="flex min-w-10 flex-1 flex-col items-center gap-1"
              title={`Hadir ${b.hadir} · Sakit ${b.sakit} · Izin ${b.izin} · Alpha ${b.alpha}`}
            >
              <span className="text-[11px] font-semibold text-slate-600">
                {b.persen_hadir}%
              </span>
              <div className="flex h-24 w-full max-w-12 flex-col-reverse overflow-hidden rounded-md bg-slate-100">
                {segmen.map(
                  (s, i) =>
                    s.n > 0 && (
                      <div
                        key={i}
                        className={s.cls}
                        style={{ height: `${(s.n / total) * 100}%` }}
                      />
                    ),
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                {format(new Date(b.bulan + "T00:00:00"), "MMM yy", {
                  locale: localeId,
                })}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate-500">
        <Legend cls="bg-emerald-500" label="Hadir" />
        <Legend cls="bg-amber-400" label="Sakit" />
        <Legend cls="bg-sky-400" label="Izin" />
        <Legend cls="bg-red-500" label="Alpha" />
      </div>
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${cls}`} />
      {label}
    </span>
  );
}
