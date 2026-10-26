/** Kerangka pemuatan dashboard admin (halaman ini memuat banyak baris rekap). */
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded-lg bg-slate-200" />
          <div className="h-4 w-64 rounded bg-slate-100" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-slate-200" />
      </div>

      <div className="h-10 w-full rounded-xl bg-white ring-1 ring-slate-200" />
      <div className="h-10 w-64 rounded-lg bg-white ring-1 ring-slate-200" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <div className="h-3 w-20 rounded bg-slate-100" />
            <div className="mt-3 h-7 w-12 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {Array.from({ length: 2 }).map((_, s) => (
        <div key={s} className="space-y-3">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
