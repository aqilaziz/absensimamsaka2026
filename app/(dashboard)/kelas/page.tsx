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

  const [{ data: semData }, { data: data }] = await Promise.all([
    supabase
      .from("semester")
      .select("*")
      .eq("tahun_pelajaran_id", tahun.id)
      .order("urutan"),
    supabase
      .from("kelas")
      .select("*, siswa(count), semester:semester!kelas_semester_id_fkey(nama)")
      .eq("tahun_pelajaran_id", tahun.id)
      .order("nama"),
  ]);

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

  const kelasSemester = (data ?? []) as unknown as (KelasDenganSiswa & {
    semester: { nama: NamaSemester } | null;
  })[];

  // Ambil hanya kelas pada semester yang sedang dipilih, lalu buang field
  // bantu `semester` agar bentuknya kembali menjadi KelasDenganSiswa.
  const kelasList: KelasDenganSiswa[] = kelasSemester
    .filter((k) =>
      k.semester
        ? k.semester.nama === semester.nama
        : k.semester_id === semester.id,
    )
    .map(({ semester: _semesterBantu, ...rest }) => rest);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Kelas
          </h1>
          <p className="text-sm text-slate-500">
            Tahun pelajaran {tahun.nama} · {labelSemester(semester.nama)} (
            {formatTanggal(semester.tgl_mulai)} –{" "}
            {formatTanggal(semester.tgl_selesai)})
          </p>
        </div>
        <KelasForm semesters={semesters} semesterAwal={semester.id} />
      </div>

      {/* Pilih semester: Ganjil / Genap */}
      <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-slate-200">
        {semesters.map((s) => (
          <Link
            key={s.id}
            href={`/kelas?semester=${s.nama}`}
            className={
              s.nama === semester.nama
                ? "shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white"
                : "shrink-0 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
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
              className="card flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  href={`/kelas/${k.id}`}
                  className="break-words text-base font-semibold text-slate-900 hover:text-emerald-700"
                >
                  {k.nama}
                </Link>
                <p className="text-xs text-slate-400">
                  {k.siswa[0]?.count ?? 0} santri
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
