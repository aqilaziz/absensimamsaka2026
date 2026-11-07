import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { ambilKelasSaya, type KelasRingkas } from "@/lib/kelas";
import { ambilProfilSendiri } from "@/lib/profil";
import { labelSemester, semesterAktifHariIni } from "@/lib/periode";
import type {
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

  const [profil, { data: aktifList }] = await Promise.all([
    ambilProfilSendiri(supabase),
    supabase.from("tahun_pelajaran").select("*").eq("status", "aktif"),
  ]);
  const isAdmin = profil?.role === "admin";
  // Hanya ada satu tahun pelajaran aktif untuk seluruh madrasah.
  const aktif = (aktifList ?? []) as TahunPelajaran[];
  const tahun = aktif[0] ?? null;

  let kelasList: KelasRingkas[] = [];
  let jumlahSantri = 0;
  let absensiHariIni = 0;
  let jumlahTugas = 0;
  const semesterOf = new Map<string, NamaSemester>();
  let semesterBerjalan: Semester | null = null;

  if (tahun) {
    const { data: semData } = await supabase
      .from("semester")
      .select("*")
      .eq("tahun_pelajaran_id", tahun.id)
      .order("urutan");
    const semesters = (semData ?? []) as Semester[];
    semesters.forEach((s) => semesterOf.set(s.id, s.nama));
    semesterBerjalan =
      semesters.find((s) => s.nama === semesterAktifHariIni(tahun)) ?? null;

    if (isAdmin) {
      const { data } = await supabase
        .from("kelas")
        .select("id, nama, semester_id")
        .eq("tahun_pelajaran_id", tahun.id)
        .order("nama");
      kelasList = (data ?? []) as KelasRingkas[];
    } else if (profil?.id) {
      // Guru hanya melihat kelas yang sudah ia centang di "Ambil Kelas".
      kelasList = await ambilKelasSaya(supabase, profil.id, tahun.id);
    }

    const kelasIds = kelasList.map((k) => k.id);
    if (kelasIds.length > 0) {
      const [{ count: cSiswa }, { data: absenHariIni }, { count: cTugas }] =
        await Promise.all([
          supabase
            .from("siswa")
            .select("id", { count: "exact", head: true })
            .in("kelas_id", kelasIds),
          // Absensi kini per mapel: satu santri bisa punya beberapa baris
          // pada hari yang sama, jadi hitung santri unik.
          supabase
            .from("absensi")
            .select("siswa_id")
            .in("kelas_id", kelasIds)
            .eq("tanggal", format(new Date(), "yyyy-MM-dd")),
          supabase
            .from("tugas")
            .select("id", { count: "exact", head: true })
            .in("kelas_id", kelasIds),
        ]);
      jumlahSantri = cSiswa ?? 0;
      absensiHariIni = new Set(
        (absenHariIni ?? []).map((a) => (a as { siswa_id: string }).siswa_id),
      ).size;
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
          {isAdmin
            ? "Mulai dengan membuat tahun pelajaran aktif, lalu buat kelas dan impor daftar santri."
            : "Admin madrasah belum membuat tahun pelajaran aktif. Coba lagi nanti."}
        </p>
        {isAdmin && (
          <Link
            href="/tahun-pelajaran"
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Buat Tahun Pelajaran
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          {format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId })}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Ahlan, {profil?.nama ?? "Guru"}
        </h1>
        <p className="text-sm text-slate-500">
          Tahun pelajaran {tahun.nama}
          {semesterBerjalan && ` · ${labelSemester(semesterBerjalan.nama)}`}
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
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            {isAdmin ? "Kelas" : "Kelas yang Anda ampu"}
          </h2>
          <span className="text-xs font-medium text-slate-400">
            {kelasList.length} kelas
          </span>
        </div>
        {kelasList.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200">
            {isAdmin ? (
              <>
                Belum ada kelas.{" "}
                <Link
                  href="/kelas"
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Buat kelas pertama
                </Link>
              </>
            ) : (
              <>
                Anda belum mengambil kelas.{" "}
                <Link
                  href="/ambil-kelas"
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Ambil kelas di sini
                </Link>
              </>
            )}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kelasList.map((k) => (
              <div
                key={k.id}
                className="surface relative p-5 transition active:scale-[0.99] hover:ring-emerald-300 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {/* Stretched link: ::after menutupi seluruh kartu sehingga
                      klik di mana pun membuka detail kelas. Elemen interaktif
                      lain di dalam kartu perlu `relative z-10`. */}
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                  <Link
                    href={`/kelas/${k.id}/absensi`}
                    className="text-base font-bold tracking-tight text-slate-900 after:absolute after:inset-0 after:rounded-2xl hover:text-emerald-700"
                  >
                    {k.nama}
                  </Link>
                </div>
                {semesterOf.get(k.semester_id) && (
                  <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {semesterOf.get(k.semester_id) === "genap"
                      ? "Genap"
                      : "Ganjil"}
                  </span>
                )}
                <div className="relative z-10 mt-3 flex flex-wrap gap-2 text-xs">
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
    <div className="surface p-4 sm:p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        {icon}
      </span>
      <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
}
