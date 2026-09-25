import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TahunForm } from "./tahun-form";
import { TahunRowActions } from "./tahun-row-actions";
import { formatTanggal } from "@/lib/periode";
import type { TahunPelajaran } from "@/lib/types";

interface TahunDenganKelas extends TahunPelajaran {
  kelas: { count: number }[];
}

export default async function TahunPelajaranPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tahun_pelajaran")
    .select("*, kelas(count)")
    .order("tgl_mulai", { ascending: false });

  const tahunList = (data ?? []) as unknown as TahunDenganKelas[];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tahun Pelajaran</h1>
          <p className="text-sm text-slate-500">
            Satu tahun aktif; tahun lama tersimpan sebagai arsip.
          </p>
        </div>
        <TahunForm />
      </div>

      {tahunList.length === 0 && (
        <p className="card text-sm text-slate-500">
          Belum ada tahun pelajaran. Klik <b>Buat Tahun Pelajaran</b> untuk memulai.
        </p>
      )}

      <div className="space-y-3">
        {tahunList.map((t) => (
          <div key={t.id} className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-slate-900">{t.nama}</span>
                {t.status === "aktif" ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Aktif
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                    Arsip
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <TahunForm tahun={t} />
                <TahunRowActions id={t.id} status={t.status} nama={t.nama} />
                {t.status === "arsip" && (
                  <Link
                    href={`/arsip/${t.id}`}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Buka Arsip
                  </Link>
                )}
              </div>
            </div>
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <p>
                <span className="text-slate-400">Mulai:</span> {formatTanggal(t.tgl_mulai)}
              </p>
              <p>
                <span className="text-slate-400">Batas semester:</span>{" "}
                {formatTanggal(t.batas_semester)}
              </p>
              <p>
                <span className="text-slate-400">Selesai:</span> {formatTanggal(t.tgl_selesai)}
              </p>
            </div>
            <p className="text-xs text-slate-400">
              {t.kelas[0]?.count ?? 0} kelas
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
