import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KelasForm } from "./kelas-form";
import { KelasDeleteButton } from "./kelas-delete-button";
import {
  formatTanggal,
  labelSemester,
  semesterAktifHariIni,
} from "@/lib/periode";
import type {
  Kelas,
  NamaSemester,
  Semester,
  TahunPelajaran,
} from "@/lib/types";

interface KelasDenganSiswa extends Kelas {
  siswa: { count: number }[];
}

export default async function KelasPage({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string }>;
}) {
  const sp = await searchParams;
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

  const { data: semData } = await supabase
    .from("semester")
    .select("*")
    .eq("tahun_pelajaran_id", tahun.id)
    .order("urutan");

  const semesters = (semData ?? []) as Semester[];

  const pilihan: NamaSemester =
    sp.semester === "genap" || sp.semester === "ganjil"
      ? sp.semester
      : semesterAktifHariIni(tahun);

  const semester =
    semesters.find((s) => s.nama === pilihan) ?? semesters[0] ?? null;

  if (!semester) {
    return (
      <div className="card max-w-lg text-sm text-slate-600">
        Tahun pelajaran ini belum punya semester. Jalankan migrasi{" "}
        <code className="rounded bg-slate-100 px-1">0005_semester.sql</code>.
      </div>
    );
  }

  const { data } = await supabase
    .from("kelas")
    .select("*, siswa(count)")
    .eq("semester_id", semester.id)
    .order("nama");

  const kelasList = (data ?? []) as unknown as KelasDenganSiswa[];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelas</h1>
          <p className="text-sm text-slate-500">
            Tahun pelajaran {tahun.nama} · {labelSemester(semester.nama)} (
            {formatTanggal(semester.tgl_mulai)} –{" "}
            {formatTanggal(semester.tgl_selesai)})
          </p>
        </div>
        <KelasForm semesters={semesters} semesterAwal={semester.id} />
      </div>

      {/* Pilih semester: Ganjil / Genap */}
      <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200">
        {semesters.map((s) => (
          <Link
            key={s.id}
            href={`/kelas?semester=${s.nama}`}
            className={
              s.nama === semester.nama
                ? "rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white"
                : "rounded-lg px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            }
          >
            {labelSemester(s.nama)}
          </Link>
        ))}
      </div>

      {kelasList.length === 0 ? (
        <p className="card text-sm text-slate-500">
          Belum ada kelas di {labelSemester(semester.nama)}. Klik{" "}
          <b>Buat Kelas</b> untuk menambah.
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
                <KelasForm
                  kelas={k}
                  semesters={semesters}
                  semesterAwal={semester.id}
                />
                <KelasDeleteButton kelasId={k.id} nama={k.nama} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
