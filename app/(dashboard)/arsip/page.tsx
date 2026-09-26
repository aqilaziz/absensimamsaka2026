import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTanggal } from "@/lib/periode";
import type { TahunPelajaran } from "@/lib/types";
import { Archive } from "lucide-react";

interface TahunDenganKelas extends TahunPelajaran {
  kelas: { count: number }[];
}

export default async function ArsipPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tahun_pelajaran")
    .select("*, kelas(count)")
    .eq("status", "arsip")
    .order("tgl_mulai", { ascending: false });

  const tahunList = (data ?? []) as unknown as TahunDenganKelas[];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Arsip</h1>
        <p className="text-sm text-slate-500">
          Tahun pelajaran lama — data terkunci (read-only) namun tetap bisa
          dilihat.
        </p>
      </div>

      {tahunList.length === 0 ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Archive size={18} className="text-slate-400" />
          Belum ada arsip. Tahun pelajaran yang diarsipkan akan muncul di sini.
        </div>
      ) : (
        <div className="space-y-3">
          {tahunList.map((t) => (
            <Link
              key={t.id}
              href={`/arsip/${t.id}`}
              className="card block transition hover:ring-emerald-300"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <span className="break-words text-lg font-semibold text-slate-900">
                    {t.nama}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                    Arsip
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {t.kelas[0]?.count ?? 0} kelas
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {formatTanggal(t.tgl_mulai)} — {formatTanggal(t.tgl_selesai)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
