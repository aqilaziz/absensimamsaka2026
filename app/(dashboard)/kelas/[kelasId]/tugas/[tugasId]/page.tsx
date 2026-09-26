import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { KelasHeader } from "@/components/kelas-header";
import { PengumpulanGrid, type PengumpulanRow } from "./pengumpulan-grid";
import { EditTugasToggle } from "./edit-tugas-toggle";
import { formatTanggal } from "@/lib/periode";
import type { KelasDetail, Tugas } from "@/lib/types";

export default async function TugasDetailPage({
  params,
}: {
  params: Promise<{ kelasId: string; tugasId: string }>;
}) {
  const { kelasId, tugasId } = await params;
  const supabase = await createClient();

  const [{ data: kelasData }, { data: tugasData }] = await Promise.all([
    supabase
      .from("kelas")
      .select(
        "*, tahun_pelajaran(*), semester:semester!kelas_semester_id_fkey(*)",
      )
      .eq("id", kelasId)
      .maybeSingle(),
    supabase.from("tugas").select("*").eq("id", tugasId).maybeSingle(),
  ]);

  if (!kelasData || !tugasData) notFound();
  const kelas = kelasData as unknown as KelasDetail;
  const tugas = tugasData as Tugas;
  const aktif = kelas.tahun_pelajaran.status === "aktif";

  const { data: pengumpulanData } = await supabase
    .from("pengumpulan")
    .select("*, siswa(*)")
    .eq("tugas_id", tugasId)
    .order("urutan", { referencedTable: "siswa" });

  const rows = (pengumpulanData ?? []) as unknown as PengumpulanRow[];

  const lewatTenggat =
    tugas.tgl_tenggat != null &&
    tugas.tgl_tenggat < format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <KelasHeader kelas={kelas} active="tugas" />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href={`/kelas/${kelasId}/tugas`}
            className="text-sm text-slate-400 hover:text-slate-600"
          >
            ← Daftar tugas
          </Link>
          <h2 className="mt-1 break-words text-lg font-bold text-slate-900 sm:text-xl">
            {tugas.judul}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {tugas.tipe === "nilai" ? (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-700">
                Nilai · maks {tugas.nilai_maks}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                Ceklis
              </span>
            )}
            <span>Diberikan {formatTanggal(tugas.tgl_diberikan)}</span>
            {tugas.tgl_tenggat && (
              <span
                className={lewatTenggat ? "font-semibold text-amber-600" : ""}
              >
                · Tenggat {formatTanggal(tugas.tgl_tenggat)}
                {lewatTenggat && " (lewat)"}
              </span>
            )}
          </div>
          {tugas.deskripsi && (
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              {tugas.deskripsi}
            </p>
          )}
        </div>
        {aktif && <EditTugasToggle kelasId={kelasId} tugas={tugas} />}
      </div>

      {rows.length === 0 ? (
        <p className="card text-sm text-slate-500">
          Belum ada santri di kelas ini.
        </p>
      ) : (
        <PengumpulanGrid
          tugas={tugas}
          rows={rows}
          aktif={aktif}
          lewatTenggat={lewatTenggat}
        />
      )}
    </div>
  );
}
