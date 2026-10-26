import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { mapelSaya } from "@/lib/kelas";
import { KelasHeader } from "@/components/kelas-header";
import { PengumpulanGrid, type PengumpulanRow } from "./pengumpulan-grid";
import { EditTugasToggle } from "./edit-tugas-toggle";
import { formatTanggal } from "@/lib/periode";
import { Paperclip } from "lucide-react";
import type { KelasDetail, Lampiran, Tugas } from "@/lib/types";

function ukuranTeks(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function TugasDetailPage({
  params,
}: {
  params: Promise<{ kelasId: string; tugasId: string }>;
}) {
  const { kelasId, tugasId } = await params;
  const supabase = await createClient();

  const [{ data: kelasData }, { data: tugasData }, mapel] =
    await Promise.all([
    supabase
      .from("kelas")
      .select(
        "*, tahun_pelajaran(*), semester:semester!kelas_semester_id_fkey(*)",
      )
      .eq("id", kelasId)
      .maybeSingle(),
    supabase.from("tugas").select("*").eq("id", tugasId).maybeSingle(),
    mapelSaya(supabase, kelasId),
  ]);

  if (!kelasData || !tugasData) notFound();
  const kelas = kelasData as unknown as KelasDetail;
  kelas.mapel = mapel;
  const tugas = tugasData as Tugas;

  // Lampiran disimpan di bucket privat → buat tautan bertanda tangan (1 jam).
  const lampiran = (tugas.lampiran ?? []) as Lampiran[];
  const lampiranUrl = await Promise.all(
    lampiran.map(async (l) => {
      const { data } = await supabase.storage
        .from("tugas")
        .createSignedUrl(l.path, 60 * 60);
      return { ...l, url: data?.signedUrl ?? null };
    }),
  );
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
            <p className="mt-2 max-w-2xl whitespace-pre-line text-sm text-slate-600">
              {tugas.deskripsi}
            </p>
          )}

          {lampiranUrl.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Lampiran
              </p>
              <ul className="flex flex-wrap gap-2">
                {lampiranUrl.map((l) => (
                  <li key={l.path}>
                    <a
                      href={l.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200"
                    >
                      <Paperclip size={13} className="shrink-0" />
                      <span className="truncate">{l.nama}</span>
                      <span className="shrink-0 text-[10px] font-normal text-slate-400">
                        {ukuranTeks(l.ukuran)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
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
