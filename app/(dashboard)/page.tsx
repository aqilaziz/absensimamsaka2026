import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { labelSemester, semesterAktifHariIni } from "@/lib/periode";
import type {
  Kelas,
  NamaSemester,
  Profile,
  Semester,
  TahunPelajaran,
} from "@/lib/types";
import {
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  Users,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: profile }, { data: tahunAktif }] = await Promise.all([
    supabase.from("profiles").select("*").single(),
    supabase
      .from("tahun_pelajaran")
      .select("*")
      .eq("status", "aktif")
      .maybeSingle(),
  ]);

  const profil = profile as Profile | null;
  const tahun = tahunAktif as TahunPelajaran | null;

  let kelasList: Kelas[] = [];
  let jumlahSantri = 0;
  let absensiHariIni = 0;
  let jumlahTugas = 0;
  const semesterOf = new Map<string, NamaSemester>();
  let semesterBerjalan: Semester | null = null;

  if (tahun) {
    const [resKelas, resSemester] = await Promise.all([
      supabase
        .from("kelas")
        .select("*")
        .eq("tahun_pelajaran_id", tahun.id)
        .order("nama"),
      supabase
        .from("semester")
        .select("*")
        .eq("tahun_pelajaran_id", tahun.id)
        .order("urutan"),
    ]);
    kelasList = (resKelas.data ?? []) as Kelas[];
    const semesters = (resSemester.data ?? []) as Semester[];
    semesters.forEach((s) => semesterOf.set(s.id, s.nama));
    semesterBerjalan =
      semesters.find((s) => s.nama === semesterAktifHariIni(tahun)) ?? null;

    const kelasIds = kelasList.map((k) => k.id);
    if (kelasIds.length > 0) {
      const [{ count: cSiswa }, { count: cAbsen }, { count: cTugas }] =
        await Promise.all([
          supabase
            .from("siswa")
            .select("id", { count: "exact", head: true })
            .in("kelas_id", kelasIds),
          supabase
            .from("absensi")
            .select("id", { count: "exact", head: true })
            .in("kelas_id", kelasIds)
            .eq("tanggal", format(new Date(), "yyyy-MM-dd")),
          supabase
            .from("tugas")
            .select("id", { count: "exact", head: true })
            .in("kelas_id", kelasIds),
        ]);
      jumlahSantri = cSiswa ?? 0;
      absensiHariIni = cAbsen ?? 0;
      jumlahTugas = cTugas ?? 0;
    }
  }

  if (!tahun) {
    return (
      <div className="mx-auto w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 sm:p-10">
        <GraduationCap className="mx-auto text-emerald-600" size={40} />
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          Selamat datang, {profil?.nama ?? "Guru"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Mulai dengan membuat tahun pelajaran aktif, lalu buat kelas dan impor
          daftar santri.
        </p>
        <Link
          href="/tahun-pelajaran"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Buat Tahun Pelajaran
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Ahlan, {profil?.nama ?? "Guru"}
        </h1>
        <p className="text-sm text-slate-500">
          Tahun pelajaran {tahun.nama}
          {semesterBerjalan &&
            ` · ${labelSemester(semesterBerjalan.nama)}`} ·{" "}
          {format(new Date(), "EEEE, d MMMM yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Users size={20} />}
          label="Kelas"
          value={kelasList.length}
        />
        <StatCard
          icon={<GraduationCap size={20} />}
          label="Santri"
          value={jumlahSantri}
        />
        <StatCard
          icon={<CalendarCheck size={20} />}
          label="Absensi hari ini"
          value={absensiHariIni}
        />
        <StatCard
          icon={<ClipboardList size={20} />}
          label="Total tugas"
          value={jumlahTugas}
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Kelas Anda
        </h2>
        {kelasList.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200">
            Belum ada kelas.{" "}
            <Link
              href="/kelas"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Buat kelas pertama
            </Link>
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kelasList.map((k) => (
              <div
                key={k.id}
                className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <Link
                  href={`/kelas/${k.id}`}
                  className="text-base font-semibold text-slate-900 hover:text-emerald-700"
                >
                  {k.nama}
                </Link>
                {semesterOf.get(k.semester_id) && (
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {semesterOf.get(k.semester_id) === "genap"
                      ? "Genap"
                      : "Ganjil"}
                  </span>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Link
                    href={`/kelas/${k.id}/absensi`}
                    className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    Absensi
                  </Link>
                  <Link
                    href={`/kelas/${k.id}/tugas`}
                    className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700 hover:bg-sky-100"
                  >
                    Tugas
                  </Link>
                  <Link
                    href={`/kelas/${k.id}/rekap`}
                    className="rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700 hover:bg-violet-100"
                  >
                    Rekap
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <div className="flex items-center gap-2 text-emerald-600">{icon}</div>
      <p className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">
        {value}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
