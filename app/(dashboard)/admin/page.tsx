import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { PersenBadge } from "@/components/persen-badge";
import { labelSemester } from "@/lib/periode";
import { ChipMapel } from "./chip-mapel";
import { PilihGuru } from "./pilih-guru";
import type { AdminKelasRow, TahunPelajaran } from "@/lib/types";

/** Jumlah chip yang dikirim bersama halaman; sisanya dimuat saat diklik. */
const MAKS_CHIP = 6;

interface GuruLite {
  id: string;
  nama: string;
}

/** Angka dari view bisa berupa string (bigint) — samakan jadi number. */
function angka(v: number | string | null | undefined): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

interface GuruDiKelas {
  id: string;
  nama: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  hari: number;
}

interface MapelDiKelas {
  nama: string;
  warna: string | null;
  guru: string[];
}

interface KelasRekap {
  id: string;
  nama: string;
  semester: AdminKelasRow["semester"];
  santri: number;
  guru: GuruDiKelas[];
  mapel: MapelDiKelas[];
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  hari: number;
  persen: number | null;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string; guru?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const supabase = await createClient();

  const [tahunRes, guruRes] = await Promise.all([
    supabase.from("tahun_pelajaran").select("*").order("tgl_mulai", {
      ascending: false,
    }),
    supabase
      .from("profiles")
      .select("id, nama")
      .eq("role", "guru")
      .order("nama"),
  ]);

  const tahunList = (tahunRes.data ?? []) as TahunPelajaran[];
  const gurus = (guruRes.data ?? []) as GuruLite[];

  if (tahunList.length === 0) {
    return (
      <div className="card max-w-lg text-sm text-slate-600">
        Belum ada tahun pelajaran sama sekali.
      </div>
    );
  }

  const aktif = tahunList.find((t) => t.status === "aktif") ?? tahunList[0];
  // Filter memakai id: nama tahun bisa sama antar-data, id tidak.
  const pilihTahun = tahunList.find((t) => t.id === sp.tahun) ?? aktif;

  const guruTerpilih = sp.guru ?? "";

  const { data: rowData } = await supabase
    .from("v_admin_rekap_kelas")
    .select("*")
    .eq("tahun_id", pilihTahun.id);

  const rows = (rowData ?? []) as AdminKelasRow[];
  const rowsFilter =
    guruTerpilih === "belum"
      ? rows.filter((r) => r.guru_id == null)
      : guruTerpilih
        ? rows.filter((r) => r.guru_id === guruTerpilih)
        : rows;

  // Jumlah kelas unik per guru (satu kelas bisa muncul beberapa baris bila
  // diampu lebih dari satu mapel).
  const kelasPerGuru = new Map<string, Set<string>>();
  for (const r of rows) {
    const kunci = r.guru_id ?? "belum";
    const set = kelasPerGuru.get(kunci) ?? new Set<string>();
    set.add(r.kelas_id);
    kelasPerGuru.set(kunci, set);
  }
  const opsiGuru = gurus.map((g) => ({
    id: g.id,
    nama: g.nama,
    jumlahKelas: kelasPerGuru.get(g.id)?.size ?? 0,
  }));
  const adaTanpaPengampu = (kelasPerGuru.get("belum")?.size ?? 0) > 0;

  // ===== Gabungkan baris (kelas × mapel × guru) menjadi SATU kartu per kelas.
  // View mengelompokkan per pengampu, jadi absensi guru yang mengampu dua
  // mapel di kelas yang sama akan muncul di dua baris → guru didedup dulu
  // sebelum dijumlahkan agar angka tidak dobel.
  const perKelas = new Map<
    string,
    {
      id: string;
      nama: string;
      semester: AdminKelasRow["semester"];
      santri: number;
      guru: Map<string, GuruDiKelas>;
      mapel: Map<string, MapelDiKelas>;
    }
  >();

  for (const r of rowsFilter) {
    let k = perKelas.get(r.kelas_id);
    if (!k) {
      k = {
        id: r.kelas_id,
        nama: r.kelas,
        semester: r.semester,
        santri: angka(r.jumlah_santri),
        guru: new Map(),
        mapel: new Map(),
      };
      perKelas.set(r.kelas_id, k);
    }

    const gid = r.guru_id ?? "belum";
    if (!k.guru.has(gid)) {
      k.guru.set(gid, {
        id: gid,
        nama: r.guru,
        hadir: angka(r.hadir),
        sakit: angka(r.sakit),
        izin: angka(r.izin),
        alpha: angka(r.alpha),
        hari: angka(r.total_hari),
      });
    }

    const kunciMapel = r.mapel ?? "__tanpa__";
    const m = k.mapel.get(kunciMapel) ?? {
      nama: r.mapel ?? "Tanpa mapel",
      warna: r.mapel_warna,
      guru: [] as string[],
    };
    if (!m.guru.includes(r.guru)) m.guru.push(r.guru);
    k.mapel.set(kunciMapel, m);
  }

  const daftarKelas: KelasRekap[] = [...perKelas.values()]
    .map((k) => {
      const guruList = [...k.guru.values()];
      const hadir = guruList.reduce((a, g) => a + g.hadir, 0);
      const sakit = guruList.reduce((a, g) => a + g.sakit, 0);
      const izin = guruList.reduce((a, g) => a + g.izin, 0);
      const alpha = guruList.reduce((a, g) => a + g.alpha, 0);
      const total = hadir + sakit + izin + alpha;
      return {
        id: k.id,
        nama: k.nama,
        semester: k.semester,
        santri: k.santri,
        guru: guruList,
        mapel: [...k.mapel.values()].sort((a, b) => a.nama.localeCompare(b.nama)),
        hadir,
        sakit,
        izin,
        alpha,
        hari: guruList.reduce((a, g) => Math.max(a, g.hari), 0),
        persen: total > 0 ? Math.round((hadir / total) * 1000) / 10 : null,
      };
    })
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const guruUnik = new Set(rowsFilter.map((r) => r.guru_id ?? "belum"));
  const totalSantri = daftarKelas.reduce((a, k) => a + k.santri, 0);
  const rataHadir = (() => {
    const punya = daftarKelas.filter((k) => k.persen != null);
    if (punya.length === 0) return null;
    return (
      Math.round(
        (punya.reduce((a, k) => a + (k.persen ?? 0), 0) / punya.length) * 10,
      ) / 10
    );
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Dashboard Admin
          </h1>
          <p className="text-sm text-slate-500">
            Rekap kehadiran santri lintas guru
          </p>
        </div>
        <Link href="/admin/kelas-baru" className="btn-primary">
          + Buat Kelas
        </Link>
      </div>

      {/* Pilih tahun pelajaran */}
      <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-slate-200">
        {tahunList.map((t) => (
          <Link
            key={t.id}
            href={`/admin?tahun=${t.id}${guruTerpilih ? `&guru=${guruTerpilih}` : ""}`}
            className={
              t.id === pilihTahun.id
                ? "shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white"
                : "shrink-0 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            }
          >
            {t.nama}
            {t.status === "aktif" ? " (aktif)" : ""}
          </Link>
        ))}
      </div>

      {/* Filter guru */}
      <PilihGuru
        tahunId={pilihTahun.id}
        nilai={guruTerpilih}
        gurus={opsiGuru}
        adaTanpaPengampu={adaTanpaPengampu}
      />

      {/* Kartu ringkasan */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Guru" value={guruUnik.size} />
        <StatCard label="Kelas" value={daftarKelas.length} />
        <StatCard label="Total Santri" value={totalSantri} />
        <StatCard
          label="Rata-rata % Hadir"
          value={rataHadir != null ? `${rataHadir}%` : "—"}
        />
      </div>

      {daftarKelas.length === 0 ? (
        <p className="card text-sm text-slate-500">
          {guruTerpilih === "belum"
            ? `Semua kelas di tahun ${pilihTahun.nama} sudah punya pengampu.`
            : guruTerpilih
              ? "Guru ini belum mengambil kelas di tahun pelajaran ini."
              : `Belum ada kelas di tahun ${pilihTahun.nama}.`}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {daftarKelas.map((k) => (
            <div
              key={k.id}
              className="flex flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-emerald-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/admin/${k.id}?tahun=${pilihTahun.nama}`}
                  className="text-sm font-semibold text-slate-900 hover:text-emerald-700"
                >
                  {k.nama}
                </Link>
                <span className="text-[11px] font-medium text-slate-400">
                  {labelSemester(k.semester)}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {k.santri} santri · {k.hari} hari · {k.guru.length} guru
              </p>

              {/* Chip mapel + guru: hanya beberapa yang dikirim, sisanya
                  diambil saat tombol "+N mapel lainnya" diklik. */}
              {k.mapel.length === 0 ? (
                <span className="mt-2 inline-flex w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                  Belum ada pengampu
                </span>
              ) : (
                <ChipMapel
                  kelasId={k.id}
                  awal={k.mapel.slice(0, MAKS_CHIP)}
                  total={k.mapel.length}
                />
              )}

              <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-slate-600">
                <span>
                  <b className="text-emerald-600">{k.hadir}</b> Hadir
                </span>
                <span>
                  <b className="text-amber-600">{k.sakit}</b> Sakit
                </span>
                <span>
                  <b className="text-sky-600">{k.izin}</b> Izin
                </span>
                <span>
                  <b className="text-red-600">{k.alpha}</b> Alpha
                </span>
                <span className="ml-auto">
                  {k.persen != null ? (
                    <PersenBadge value={k.persen} />
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      belum ada absensi
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
