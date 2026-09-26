/**
 * Kerangka pemuatan (loading skeleton) global untuk area dashboard.
 *
 * Tanpa file ini, Next.js menahan tampilan lama sampai seluruh query Supabase
 * selesai sehingga navigasi terasa "menggantung". Dengan Suspense boundary di
 * level segmen, kerangka ini langsung tampil saat menu diklik.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-slate-200 sm:w-64" />
        <div className="h-4 w-40 rounded bg-slate-100 sm:w-52" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"
          >
            <div className="h-3 w-20 rounded bg-slate-100" />
            <div className="mt-3 h-6 w-12 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="h-10 w-full max-w-md rounded-xl bg-white shadow-sm ring-1 ring-slate-200" />

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="space-y-3 p-4 sm:p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 flex-1 rounded bg-slate-100" />
              <div className="h-4 w-16 rounded bg-slate-100" />
              <div className="h-4 w-10 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
