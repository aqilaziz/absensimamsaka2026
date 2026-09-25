import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TahunForm } from "./tahun-form";
import { TahunRowActions } from "./tahun-row-actions";
import { formatTanggal, labelSemester } from "@/lib/periode";
import type { Semester, TahunPelajaran } from "@/lib/types";

interface TahunDenganKelas extends TahunPelajaran {
  kelas: { count: number }[];
  semester: (Semester & { kelas: { count: number }[] })[];
}

export default async function TahunPelajaranPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tahun_pelajaran")
    .select("*, kelas(count), semester(*, kelas(count))")
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
          Belum ada tahun pelajaran. Klik <b>Buat Tahun Pelajaran</b> untuk
          memulai.
        </p>
      )}

      <div className="space-y-3">
        {tahunList.map((t) => (
          <div key={t.id} className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-slate-900">
                  {t.nama}
                </span>
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
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>
                <span className="text-slate-400">Ganjil:</span>{" "}
                {formatTanggal(`${t.nama.slice(0, 4)}-07-01`)} –{" "}
                {formatTanggal(`${t.nama.slice(0, 4)}-12-31`)}
              </p>
              <p>
                <span className="text-slate-400">Genap:</span>{" "}
                {formatTanggal(`${t.nama.slice(5, 9)}-01-01`)} –{" "}
                {formatTanggal(`${t.nama.slice(5, 9)}-06-30`)}
              </p>
            </div>

            {/* Dua semester otomatis dari tanggal di atas */}
            <div className="grid gap-2 sm:grid-cols-2">
              {(t.semester ?? [])
                .slice()
                .sort((a, b) => a.urutan - b.urutan)
                .map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 ring-1 ring-emerald-100"
                  >
                    <p className="font-semibold">{labelSemester(s.nama)}</p>
                    <p className="text-emerald-700/80">
                      {formatTanggal(s.tgl_mulai)} –{" "}
                      {formatTanggal(s.tgl_selesai)} · {s.kelas[0]?.count ?? 0}{" "}
                      kelas
                    </p>
                  </div>
                ))}
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
