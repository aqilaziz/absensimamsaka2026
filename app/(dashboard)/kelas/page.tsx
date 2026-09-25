import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KelasForm } from "./kelas-form";
import { KelasDeleteButton } from "./kelas-delete-button";
import type { Kelas, TahunPelajaran } from "@/lib/types";

interface KelasDenganSiswa extends Kelas {
  siswa: { count: number }[];
}

export default async function KelasPage() {
  const supabase = await createClient();

  const { data: tahunAktif } = await supabase
    .from("tahun_pelajaran")
    .select("*")
    .eq("status", "aktif")
    .maybeSingle();

  const tahun = tahunAktif as TahunPelajaran | null;

  if (!tahun) {
    return (
      <div className="card max-w-lg text-sm text-slate-600">
        Belum ada tahun pelajaran aktif.{" "}
        <Link
          href="/tahun-pelajaran"
          className="font-semibold text-emerald-700 hover:underline"
        >
          Buat tahun pelajaran dulu
        </Link>
        .
      </div>
    );
  }

  const { data } = await supabase
    .from("kelas")
    .select("*, siswa(count)")
    .eq("tahun_pelajaran_id", tahun.id)
    .order("nama");

  const kelasList = (data ?? []) as unknown as KelasDenganSiswa[];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelas</h1>
          <p className="text-sm text-slate-500">
            Tahun pelajaran {tahun.nama}
          </p>
        </div>
        <KelasForm />
      </div>

      {kelasList.length === 0 ? (
        <p className="card text-sm text-slate-500">
          Belum ada kelas. Klik <b>Buat Kelas</b> untuk menambah.
        </p>
      ) : (
        <div className="space-y-3">
          {kelasList.map((k) => (
            <div
              key={k.id}
              className="card flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <Link
                  href={`/kelas/${k.id}`}
                  className="text-base font-semibold text-slate-900 hover:text-emerald-700"
                >
                  {k.nama}
                </Link>
                <p className="text-xs text-slate-400">
                  {k.siswa[0]?.count ?? 0} santri
                </p>
              </div>
              <div className="flex items-center gap-2">
                <KelasForm kelas={k} />
                <KelasDeleteButton kelasId={k.id} nama={k.nama} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
