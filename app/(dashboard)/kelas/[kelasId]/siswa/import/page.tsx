import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ImportForm } from "./import-form";
import type { KelasDetail, Siswa } from "@/lib/types";

export default async function ImportSiswaPage({
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
    supabase.from("siswa").select("nama").eq("kelas_id", kelasId),
  ]);

  if (!kelasData) notFound();
  const kelas = kelasData as unknown as KelasDetail;

  if (kelas.tahun_pelajaran.status !== "aktif") {
    return (
      <p className="card max-w-lg text-sm text-slate-500">
        Tahun pelajaran sudah diarsipkan, santri tidak dapat ditambah.
      </p>
    );
  }

  const namaSudahAda = ((siswaData ?? []) as Pick<Siswa, "nama">[]).map(
    (s) => s.nama,
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/kelas/${kelasId}`}
          className="shrink-0 text-sm text-slate-400 hover:text-slate-600"
        >
          ← {kelas.nama}
        </Link>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Impor Santri
        </h1>
      </div>
      <ImportForm kelasId={kelasId} namaSudahAda={namaSudahAda} />
    </div>
  );
}
