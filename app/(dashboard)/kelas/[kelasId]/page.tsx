import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KelasHeader } from "@/components/kelas-header";
import { SiswaTable } from "./siswa-table";
import type { KelasDetail, Siswa } from "@/lib/types";

export default async function KelasDetailPage({
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
  const aktif = kelas.tahun_pelajaran.status === "aktif";

  const { data: siswaData } = await supabase
    .from("siswa")
    .select("*")
    .eq("kelas_id", kelasId)
    .order("urutan");

  const siswaList = (siswaData ?? []) as Siswa[];

  return (
    <div className="space-y-6">
      <KelasHeader kelas={kelas} active="santri" />

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {siswaList.length} santri · klik nama untuk melihat riwayat
        </p>
        {aktif && (
          <Link
            href={`/kelas/${kelasId}/siswa/import`}
            className="btn-primary"
          >
            Impor dari Excel
          </Link>
        )}
      </div>

      {siswaList.length === 0 ? (
        <p className="card text-sm text-slate-500">
          Belum ada santri.{" "}
          {aktif && (
            <Link
              href={`/kelas/${kelasId}/siswa/import`}
              className="font-semibold text-emerald-700 hover:underline"
            >
              Impor daftar nama dari Excel
            </Link>
          )}
        </p>
      ) : (
        <SiswaTable siswaList={siswaList} aktif={aktif} />
      )}
    </div>
  );
}
