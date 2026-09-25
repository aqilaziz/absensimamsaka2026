import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NamaSantriLink } from "@/components/nama-santri-link";
import { formatTanggal } from "@/lib/periode";
import type { Kelas, Siswa, TahunPelajaran } from "@/lib/types";
import { Lock } from "lucide-react";

export default async function ArsipDetailPage({
  params,
}: {
  params: Promise<{ tahunId: string }>;
}) {
  const { tahunId } = await params;
  const supabase = await createClient();

  const { data: tahunData } = await supabase
    .from("tahun_pelajaran")
    .select("*")
    .eq("id", tahunId)
    .maybeSingle();

  if (!tahunData) notFound();
  const tahun = tahunData as TahunPelajaran;

  const { data: kelasData } = await supabase
    .from("kelas")
    .select("*")
    .eq("tahun_pelajaran_id", tahunId)
    .order("nama");

  const kelasList = (kelasData ?? []) as Kelas[];

  const kelasIds = kelasList.map((k) => k.id);
  let siswaList: Siswa[] = [];
  if (kelasIds.length > 0) {
    const { data } = await supabase
      .from("siswa")
      .select("*")
      .in("kelas_id", kelasIds)
      .order("urutan");
    siswaList = (data ?? []) as Siswa[];
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <Link href="/arsip" className="text-sm text-slate-400 hover:text-slate-600">
          ← Arsip
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{tahun.nama}</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            <Lock size={12} /> Terkunci
          </span>
        </div>
        <p className="text-sm text-slate-500">
          {formatTanggal(tahun.tgl_mulai)} — {formatTanggal(tahun.tgl_selesai)} ·
          batas semester {formatTanggal(tahun.batas_semester)}
        </p>
      </div>

      {kelasList.length === 0 ? (
        <p className="card text-sm text-slate-500">
          Tidak ada kelas di tahun ini.
        </p>
      ) : (
        <div className="space-y-4">
          {kelasList.map((k) => {
            const santriKelas = siswaList.filter((s) => s.kelas_id === k.id);
            return (
              <div key={k.id} className="card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-slate-900">
                    {k.nama}
                  </h2>
                  <div className="flex gap-2 text-xs">
                    <Link
                      href={`/kelas/${k.id}/absensi`}
                      className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      Absensi
                    </Link>
                    <Link
                      href={`/kelas/${k.id}/tugas`}
                      className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700 hover:bg-sky-100"
                    >
                      Tugas
                    </Link>
                    <Link
                      href={`/kelas/${k.id}/rekap`}
                      className="rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700 hover:bg-violet-100"
                    >
                      Rekap
                    </Link>
                  </div>
                </div>
                {santriKelas.length === 0 ? (
                  <p className="text-xs text-slate-400">Tidak ada santri.</p>
                ) : (
                  <ol className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                    {santriKelas.map((s) => (
                      <li key={s.id} className="flex items-baseline gap-2">
                        <span className="w-6 shrink-0 text-right text-xs text-slate-300">
                          {s.urutan}.
                        </span>
                        <NamaSantriLink
                          id={s.id}
                          nama={s.nama}
                          className="text-slate-700 underline decoration-slate-200 underline-offset-2 hover:text-emerald-700"
                        />
                        {s.nis && (
                          <span className="text-xs text-slate-400">{s.nis}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
