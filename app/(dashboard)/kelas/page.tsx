import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KelasForm } from "./kelas-form";
import { KelasDeleteButton } from "./kelas-delete-button";
import { MapelKelola } from "./mapel-kelola";
import { MapelBadge } from "@/components/mapel-badge";
import {
  formatTanggal,
  labelSemester,
  semesterAktifHariIni,
} from "@/lib/periode";
import type {
  Mapel,
  NamaSemester,
  Profile,
  Semester,
  TahunPelajaran,
  WarnaMapel,
} from "@/lib/types";

interface KelasKartu {
  id: string;
  nama: string;
  semester_id: string;
  jumlahSantri: number;
  /** Mapel yang diampu guru yang sedang login (kosong untuk admin). */
  mapelSaya: Pick<Mapel, "nama" | "warna">[];
  /** Jumlah pengampu (dipakai admin). */
  jumlahPengampu: number;
}

export default async function KelasPage({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .single();
  const profil = profile as Pick<Profile, "id" | "role"> | null;
  const uid = profil?.id ?? null;
  const isAdmin = profil?.role === "admin";

  // Hanya ada satu tahun aktif untuk seluruh madrasah (dijaga index unik
  // `satu_tahun_aktif_global`), sehingga tidak perlu memilih lagi.
  const { data: tahunAktifArr } = await supabase
    .from("tahun_pelajaran")
    .select("*")
    .eq("status", "aktif");
  const tahun = ((tahunAktifArr ?? []) as TahunPelajaran[])[0] ?? null;

  if (!tahun) {
    return (
      <div className="card max-w-lg text-sm text-slate-600">
        Belum ada tahun pelajaran aktif.{" "}
        {isAdmin ? (
          <Link
            href="/tahun-pelajaran"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Buat tahun pelajaran dulu
          </Link>
        ) : (
          "Hubungi admin madrasah untuk menyiapkannya."
        )}
        .
      </div>
    );
  }

  const [{ data: semData }, { data: mapelData }] = await Promise.all([
    supabase
      .from("semester")
      .select("*")
      .eq("tahun_pelajaran_id", tahun.id)
      .order("urutan"),
    supabase.from("mapel").select("*").order("nama"),
  ]);

  const semesters = (semData ?? []) as Semester[];
  const mapels = (mapelData ?? []) as Mapel[];

  let kelasList: KelasKartu[] = [];

  if (isAdmin) {
    const [{ data: kelasData }, { data: pengampuData }] = await Promise.all([
      supabase
        .from("kelas")
        .select("id, nama, semester_id, siswa(count)")
        .eq("tahun_pelajaran_id", tahun.id)
        .order("nama"),
      supabase.from("kelas_ajar").select("kelas_id"),
    ]);

    const hitungPengampu = new Map<string, number>();
    for (const p of (pengampuData ?? []) as { kelas_id: string }[]) {
      hitungPengampu.set(p.kelas_id, (hitungPengampu.get(p.kelas_id) ?? 0) + 1);
    }

    kelasList = ((kelasData ?? []) as unknown as {
      id: string;
      nama: string;
      semester_id: string;
      siswa: { count: number }[];
    }[]).map((k) => ({
      id: k.id,
      nama: k.nama,
      semester_id: k.semester_id,
      jumlahSantri: k.siswa?.[0]?.count ?? 0,
      mapelSaya: [],
      jumlahPengampu: hitungPengampu.get(k.id) ?? 0,
    }));
  } else if (uid) {
    // Guru hanya melihat kelas yang ia centang di halaman "Ambil Kelas".
    const { data } = await supabase
      .from("kelas_ajar")
      .select(
        "kelas_id, mapel:mapel!kelas_ajar_mapel_id_fkey(nama, warna), kelas:kelas!kelas_ajar_kelas_id_fkey(id, nama, semester_id, tahun_pelajaran_id, siswa(count))",
      )
      .eq("guru_id", uid);

    const baris = (data ?? []) as unknown as {
      mapel: Pick<Mapel, "nama" | "warna"> | null;
      kelas: {
        id: string;
        nama: string;
        semester_id: string;
        tahun_pelajaran_id: string;
        siswa: { count: number }[];
      } | null;
    }[];

    const peta = new Map<string, KelasKartu>();
    for (const r of baris) {
      const k = r.kelas;
      if (!k || k.tahun_pelajaran_id !== tahun.id) continue;
      const kartu = peta.get(k.id) ?? {
        id: k.id,
        nama: k.nama,
        semester_id: k.semester_id,
        jumlahSantri: k.siswa?.[0]?.count ?? 0,
        mapelSaya: [],
        jumlahPengampu: 0,
      };
      if (r.mapel) kartu.mapelSaya.push(r.mapel);
      peta.set(k.id, kartu);
    }
    kelasList = [...peta.values()].sort((a, b) =>
      a.nama.localeCompare(b.nama),
    );
  }

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

  const kelasSemester = kelasList.filter(
    (k) => k.semester_id === semester.id,
  );

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
        {isAdmin ? (
          <KelasForm semesters={semesters} semesterAwal={semester.id} />
        ) : (
          <Link href="/ambil-kelas" className="btn-primary">
            + Ambil Kelas
          </Link>
        )}
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

      {isAdmin && <MapelKelola mapels={mapels} />}

      {kelasSemester.length === 0 ? (
        <p className="card text-sm text-slate-500">
          {isAdmin ? (
            <>
              Belum ada kelas di {labelSemester(semester.nama)}. Klik{" "}
              <b>Buat Kelas</b> untuk menambah.
            </>
          ) : (
            <>
              Anda belum mengambil kelas di {labelSemester(semester.nama)}.{" "}
              <Link
                href="/ambil-kelas"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Ambil kelas sekarang
              </Link>
              .
            </>
          )}
        </p>
      ) : (
        <div className="space-y-3">
          {kelasSemester.map((k) => (
            <div
              key={k.id}
              className="card relative flex flex-col gap-3 border-l-4 border-l-emerald-500 transition hover:ring-emerald-300 hover:shadow-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Stretched link: ::after menutupi seluruh kartu sehingga
                      klik di mana pun membuka detail kelas. Tombol Edit/Hapus
                      di bawahnya diberi `relative z-10`. */}
                  <Link
                    href={`/kelas/${k.id}`}
                    className="break-words text-base font-semibold text-slate-900 after:absolute after:inset-0 after:rounded-xl hover:text-emerald-700"
                  >
                    {k.nama}
                  </Link>
                  {k.mapelSaya.map((m) => (
                    <MapelBadge key={m.nama} mapel={m} />
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  {k.jumlahSantri} santri
                  {isAdmin && ` · ${k.jumlahPengampu} pengampu`}
                </p>
              </div>

              <div className="relative z-10 flex flex-wrap items-center gap-2">
                {isAdmin ? (
                  <>
                    <KelasForm
                      kelas={k}
                      semesters={semesters}
                      semesterAwal={semester.id}
                    />
                    <KelasDeleteButton kelasId={k.id} nama={k.nama} />
                  </>
                ) : (
                  <>
                    <Link
                      href={`/kelas/${k.id}/absensi`}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      Absensi
                    </Link>
                    <Link
                      href={`/kelas/${k.id}/tugas`}
                      className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
                    >
                      Tugas
                    </Link>
                    <Link
                      href={`/kelas/${k.id}/rekap`}
                      className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                    >
                      Rekap
                    </Link>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
