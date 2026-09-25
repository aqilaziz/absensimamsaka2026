import { createClient } from "@/lib/supabase/server";
import { NamaSantriLink } from "@/components/nama-santri-link";
import type { KelasDetail, Siswa } from "@/lib/types";
import { Search } from "lucide-react";

type HasilCari = Siswa & { kelas: KelasDetail };

export default async function CariSantriPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; arsip?: string }>;
}) {
  const { q, arsip } = await searchParams;
  const query = (q ?? "").trim();
  const termasukArsip = arsip === "1";

  const supabase = await createClient();
  let hasil: HasilCari[] = [];

  if (query.length >= 2) {
    const pola = `%${query.replace(/[%_]/g, "")}%`;
    let req = supabase
      .from("siswa")
      .select("*, kelas!inner(*, tahun_pelajaran!inner(*))")
      .or(`nama.ilike.${pola},nis.ilike.${pola}`)
      .order("nama")
      .limit(20);

    if (!termasukArsip) {
      req = req.eq("kelas.tahun_pelajaran.status", "aktif");
    }

    const { data } = await req;
    hasil = (data ?? []) as unknown as HasilCari[];
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cari Santri</h1>
        <p className="text-sm text-slate-500">
          Berdasarkan nama atau Nomor Induk Santri (NIS).
        </p>
      </div>

      <form className="card flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            name="q"
            defaultValue={query}
            placeholder="Ketik nama atau NIS…"
            className="input pl-9"
            autoFocus
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="arsip"
            value="1"
            defaultChecked={termasukArsip}
            className="h-4 w-4 accent-emerald-600"
          />
          Termasuk arsip
        </label>
        <button type="submit" className="btn-primary">
          Cari
        </button>
      </form>

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-amber-600">Ketik minimal 2 karakter.</p>
      )}

      {query.length >= 2 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-500">
            {hasil.length} hasil untuk &quot;{query}&quot;
          </p>
          {hasil.length > 0 && (
            <div className="divide-y divide-slate-100 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              {hasil.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div>
                    <NamaSantriLink id={s.id} nama={s.nama} />
                    {s.nis && (
                      <span className="ml-2 text-xs text-slate-400">{s.nis}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>
                      {s.kelas.nama} · {s.kelas.tahun_pelajaran.nama}
                    </span>
                    {s.kelas.tahun_pelajaran.status === "arsip" && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">
                        Arsip
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
