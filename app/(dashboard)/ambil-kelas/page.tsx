import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AmbilKelasGrid } from "./ambil-kelas-grid";
import { labelSemester } from "@/lib/periode";
import type { Mapel, Semester, TahunPelajaran } from "@/lib/types";

export default async function AmbilKelasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user?.id ?? "";

  const { data: aktifArr } = await supabase
    .from("tahun_pelajaran")
    .select("*")
    .eq("status", "aktif");
  const tahun = ((aktifArr ?? []) as TahunPelajaran[])[0] ?? null;

  if (!tahun) {
    return (
      <div className="card max-w-lg text-sm text-slate-600">
        Belum ada tahun pelajaran aktif. Hubungi admin madrasah untuk
        menyiapkannya.
      </div>
    );
  }

  const [{ data: semData }, { data: kelasData }, { data: mapelData }, { data: pengampuData }] =
    await Promise.all([
      supabase
        .from("semester")
        .select("*")
        .eq("tahun_pelajaran_id", tahun.id)
        .order("urutan"),
      supabase
        .from("kelas")
        .select("id, nama, semester_id")
        .eq("tahun_pelajaran_id", tahun.id)
        .order("nama"),
      supabase.from("mapel").select("*").order("nama"),
      supabase.from("kelas_ajar").select("id, kelas_id, mapel_id, guru_id"),
    ]);

  const semesters = (semData ?? []) as Semester[];
  const mapels = (mapelData ?? []) as Mapel[];
  const kelasList = (kelasData ?? []) as {
    id: string;
    nama: string;
    semester_id: string;
  }[];
  const pengampu = (pengampuData ?? []) as {
    id: string;
    kelas_id: string;
    mapel_id: string;
    guru_id: string;
  }[];

  const namaSemester = new Map(semesters.map((s) => [s.id, s.nama]));
  const jumlahSaya = pengampu.filter((p) => p.guru_id === uid).length;

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Ambil Kelas
        </h1>
        <p className="text-sm text-slate-500">
          Centang kelas yang Anda ampu beserta mata pelajarannya. Tahun
          pelajaran {tahun.nama} · {jumlahSaya} kelas sudah diambil.
        </p>
      </div>

      {kelasList.length === 0 ? (
        <p className="card text-sm text-slate-500">
          Admin belum membuat kelas untuk tahun ini. Coba lagi nanti.
        </p>
      ) : mapels.length === 0 ? (
        <p className="card text-sm text-slate-500">
          Admin belum membuat daftar mata pelajaran. Hubungi admin madrasah.
        </p>
      ) : (
        <AmbilKelasGrid
          uid={uid}
          kelasList={kelasList.map((k) => ({
            id: k.id,
            nama: k.nama,
            semester: labelSemester(
              namaSemester.get(k.semester_id) ?? "ganjil",
            ),
          }))}
          mapels={mapels.map((m) => ({
            id: m.id,
            nama: m.nama,
            warna: m.warna,
          }))}
          pengampu={pengampu}
        />
      )}

      <p className="text-xs text-slate-400">
        Setelah diambil, kelas akan muncul di{" "}
        <Link href="/kelas" className="font-medium text-emerald-700 hover:underline">
          daftar kelas
        </Link>{" "}
        dan Anda bisa mengisi absensi serta tugas.
      </p>
    </div>
  );
}
