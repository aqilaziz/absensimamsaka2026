import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KelasHeader } from "@/components/kelas-header";
import { SiswaTable } from "./siswa-table";
import { SalinSantriButton } from "./salin-santri-button";
import { cariSemesterSumber } from "@/lib/santri";
import { ambilKelasDetail, ambilPengampu } from "@/lib/kelas";
import { ambilProfilSendiri } from "@/lib/profil";
import type { KelasAjar, KelasDetail, Mapel, Profile, Siswa } from "@/lib/types";

export default async function KelasDetailPage({
  params,
}: {
  params: Promise<{ kelasId: string }>;
}) {
  const { kelasId } = await params;
  const supabase = await createClient();

  const profil = await ambilProfilSendiri(supabase);
  const isAdmin = profil?.role === "admin";

  const [{ data: kelasData }, { data: siswaData }] = await Promise.all([
    ambilKelasDetail(supabase, kelasId),
    supabase.from("siswa").select("*").eq("kelas_id", kelasId).order("urutan"),
  ]);

  if (!kelasData) notFound();
  const kelas = kelasData as unknown as KelasDetail;

  // Mapel yang diampu guru ini di kelas tersebut.
  const { data: pengampuData } = profil?.id
    ? await ambilPengampu(supabase, kelasId, profil.id)
    : { data: null };

  const pengampuSaya = (pengampuData ?? []) as (KelasAjar & {
    mapel?: Mapel | null;
  })[];

  // Guru yang belum mengambil kelas ini tidak boleh melihat daftar santrinya.
  if (!isAdmin && pengampuSaya.length === 0) redirect("/ambil-kelas");

  kelas.mapel = pengampuSaya[0]?.mapel ?? null;
  kelas.pengampu = pengampuSaya;

  const aktif = kelas.tahun_pelajaran.status === "aktif";
  // Hanya admin yang mengelola daftar santri; guru melihat daftar saja.
  const dapatKelola = aktif && isAdmin;

  const siswaList = (siswaData ?? []) as Siswa[];

  // Semester ganjil biasanya memakai daftar santri yang sama dengan semester
  // genap sebelumnya. Jika kelas ini masih kosong, tawarkan salin satu klik.
  const sumber =
    dapatKelola && kelas.semester?.nama === "ganjil" && siswaList.length === 0
      ? await cariSemesterSumber(supabase, kelas)
      : null;

  return (
    <div className="space-y-6">
      <KelasHeader kelas={kelas} active="santri" />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {siswaList.length} santri · klik nama untuk melihat riwayat
        </p>
        {dapatKelola && (
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
          {dapatKelola ? (
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
          ) : (
            "Daftar santri diisi oleh admin madrasah."
          )}
        </p>
      ) : (
        <SiswaTable siswaList={siswaList} aktif={dapatKelola} />
      )}
    </div>
  );
}
