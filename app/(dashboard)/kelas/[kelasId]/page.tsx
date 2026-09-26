import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KelasHeader } from "@/components/kelas-header";
import { SiswaTable } from "./siswa-table";
import { SalinSantriButton } from "./salin-santri-button";
import { cariSemesterSumber } from "@/lib/santri";
import type { KelasDetail, Siswa } from "@/lib/types";

export default async function KelasDetailPage({
  params,
}: {
  params: Promise<{ kelasId: string }>;
}) {
  const { kelasId } = await params;
  const supabase = await createClient();

  const [{ data: kelasData }, { data: siswaData }] = await Promise.all([
    supabase
      .from("kelas")
      .select(
        "*, tahun_pelajaran(*), semester:semester!kelas_semester_id_fkey(*)",
      )
      .eq("id", kelasId)
      .maybeSingle(),
    supabase.from("siswa").select("*").eq("kelas_id", kelasId).order("urutan"),
  ]);

  if (!kelasData) notFound();
  const kelas = kelasData as unknown as KelasDetail;
  const aktif = kelas.tahun_pelajaran.status === "aktif";

  const siswaList = (siswaData ?? []) as Siswa[];

  // Semester ganjil biasanya memakai daftar santri yang sama dengan semester
  // genap sebelumnya. Jika kelas ini masih kosong, tawarkan salin satu klik.
  const sumber =
    aktif && kelas.semester?.nama === "ganjil" && siswaList.length === 0
      ? await cariSemesterSumber(supabase, kelas)
      : null;

  return (
    <div className="space-y-6">
      <KelasHeader kelas={kelas} active="santri" />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {siswaList.length} santri · klik nama untuk melihat riwayat
        </p>
        {aktif && (
          <div className="flex flex-col gap-2 sm:flex-row">
            {sumber && <SalinSantriButton kelasId={kelasId} sumber={sumber} />}
            <Link
              href={`/kelas/${kelasId}/siswa/import`}
              className="btn-primary w-full text-center sm:w-auto"
            >
              Impor dari Excel
            </Link>
          </div>
        )}
      </div>

      {siswaList.length === 0 ? (
        <p className="card text-sm text-slate-500">
          Belum ada santri.{" "}
          {aktif && (
            <>
              <Link
                href={`/kelas/${kelasId}/siswa/import`}
                className="font-semibold text-emerald-700 hover:underline"
              >
                Impor daftar nama dari Excel
              </Link>
              {sumber && (
                <>
                  {" "}
                  atau{" "}
                  <span className="font-semibold text-slate-700">
                    salin dari semester lalu
                  </span>{" "}
                  (tombol di atas).
                </>
              )}
            </>
          )}
        </p>
      ) : (
        <SiswaTable siswaList={siswaList} aktif={aktif} />
      )}
    </div>
  );
}
