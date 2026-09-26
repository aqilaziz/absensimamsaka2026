import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KelasHeader } from "@/components/kelas-header";
import { formatTanggal } from "@/lib/periode";
import type { KelasDetail, RingkasanTugas } from "@/lib/types";

export default async function TugasListPage({
  params,
}: {
  params: Promise<{ kelasId: string }>;
}) {
  const { kelasId } = await params;
  const supabase = await createClient();

  const [{ data: kelasData }, { data: tugasData }] = await Promise.all([
    supabase
      .from("kelas")
      .select(
        "*, tahun_pelajaran(*), semester:semester!kelas_semester_id_fkey(*)",
      )
      .eq("id", kelasId)
      .maybeSingle(),
    supabase
      .from("v_ringkasan_tugas")
      .select("*")
      .eq("kelas_id", kelasId)
      .order("tgl_diberikan", { ascending: false }),
  ]);

  if (!kelasData) notFound();
  const kelas = kelasData as unknown as KelasDetail;
  const aktif = kelas.tahun_pelajaran.status === "aktif";

  const tugasList = (tugasData ?? []) as RingkasanTugas[];

  return (
    <div className="space-y-6">
      <KelasHeader kelas={kelas} active="tugas" />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {tugasList.length} tugas/kegiatan
        </p>
        {aktif && (
          <Link
            href={`/kelas/${kelasId}/tugas/baru`}
            className="btn-primary w-full text-center sm:w-auto"
          >
            + Buat Tugas
          </Link>
        )}
      </div>

      {tugasList.length === 0 ? (
        <p className="card text-sm text-slate-500">
          Belum ada tugas.{" "}
          {aktif && (
            <Link
              href={`/kelas/${kelasId}/tugas/baru`}
              className="font-semibold text-emerald-700 hover:underline"
            >
              Buat tugas pertama
            </Link>
          )}
        </p>
      ) : (
        <div className="space-y-3">
          {tugasList.map((t) => (
            <Link
              key={t.tugas_id}
              href={`/kelas/${kelasId}/tugas/${t.tugas_id}`}
              className="card block transition hover:ring-emerald-300"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words font-semibold text-slate-900">
                      {t.judul}
                    </p>
                    {t.tipe === "nilai" ? (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                        Nilai · maks {t.nilai_maks}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        Ceklis
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Diberikan {formatTanggal(t.tgl_diberikan)}
                    {t.tgl_tenggat &&
                      ` · Tenggat ${formatTanggal(t.tgl_tenggat)}`}
                  </p>
                </div>
                <div className="text-left text-sm sm:text-right">
                  <p className="font-semibold text-slate-900">
                    {t.sudah}/{t.total_siswa}{" "}
                    <span className="font-normal text-slate-400">
                      ({t.persen_kumpul}%)
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {t.terlambat > 0 && `${t.terlambat} terlambat · `}
                    {t.tipe === "nilai" && t.rata_nilai != null
                      ? `Rata-rata ${t.rata_nilai}`
                      : `${t.belum} belum`}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, t.persen_kumpul)}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
