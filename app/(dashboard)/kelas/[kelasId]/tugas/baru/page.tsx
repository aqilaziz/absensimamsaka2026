import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KelasHeader } from "@/components/kelas-header";
import { TugasForm } from "../tugas-form";
import type { KelasDetail } from "@/lib/types";

export default async function TugasBaruPage({
  params,
}: {
  params: Promise<{ kelasId: string }>;
}) {
  const { kelasId } = await params;
  const supabase = await createClient();

  const { data: kelasData } = await supabase
    .from("kelas")
    .select("*, tahun_pelajaran(*), semester(*)")
    .eq("id", kelasId)
    .maybeSingle();

  if (!kelasData) notFound();
  const kelas = kelasData as unknown as KelasDetail;

  if (kelas.tahun_pelajaran.status !== "aktif") {
    return (
      <p className="card max-w-lg text-sm text-slate-500">
        Tahun pelajaran sudah diarsipkan, tugas tidak dapat dibuat.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <KelasHeader kelas={kelas} active="tugas" />
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/kelas/${kelasId}/tugas`}
            className="text-sm text-slate-400 hover:text-slate-600"
          >
            ← Daftar tugas
          </Link>
          <h2 className="text-lg font-semibold text-slate-900">Tugas Baru</h2>
        </div>
        <TugasForm kelasId={kelasId} />
      </div>
    </div>
  );
}
