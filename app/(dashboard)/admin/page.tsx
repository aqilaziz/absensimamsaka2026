import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { PersenBadge } from "@/components/persen-badge";
import { labelSemester } from "@/lib/periode";
import { temaMapel } from "@/lib/mapel";
import type { AdminKelasRow, TahunPelajaran } from "@/lib/types";

interface GuruLite {
  id: string;
  nama: string;
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
  const rowsFilter = guruTerpilih
    ? rows.filter((r) => r.guru_id === guruTerpilih)
    : rows;

  // Kelompokkan per pembuat kelas (urutkan sesuai daftar guru).
  // Kelas buatan admin (guru_id NULL) dikelompokkan sebagai "bersama".
  const kunciGuru = (r: AdminKelasRow) => r.guru_id ?? "bersama";
  const olehGuru = new Map<string, AdminKelasRow[]>();
  for (const r of rowsFilter) {
    const arr = olehGuru.get(kunciGuru(r)) ?? [];
    arr.push(r);
    olehGuru.set(kunciGuru(r), arr);
  }
  const urutanGuru = gurus
    .filter((g) => olehGuru.has(g.id))
    .map((g) => ({ guru: g, rows: olehGuru.get(g.id)! }));
  // Kelompok yang tidak ada di daftar role guru (termasuk kelas bersama).
  const ekstra = [...olehGuru.keys()]
    .filter((id) => !gurus.some((g) => g.id === id))
    .map((id) => ({
      guru: {
        id,
        nama:
          rowsFilter.find((r) => kunciGuru(r) === id)?.guru ?? "Bersama (Admin)",
      },
      rows: olehGuru.get(id)!,
    }));
  const kelompok = [...urutanGuru, ...ekstra];

  const totalKelas = rowsFilter.length;
  const totalSantri = rowsFilter.reduce((a, r) => a + r.jumlah_santri, 0);
  const rataHadir = (() => {
    const punyaStat = rowsFilter.filter((r) => r.persen_hadir != null);
    if (punyaStat.length === 0) return null;
    return (
      Math.round(
        (punyaStat.reduce((a, r) => a + Number(r.persen_hadir), 0) /
          punyaStat.length) *
          10,
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
      <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-slate-200">
        <Link
          href={`/admin?tahun=${pilihTahun.nama}`}
          className={
            !guruTerpilih
              ? "shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
              : "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
          }
        >
          Semua Guru
        </Link>
        {gurus.map((g) => (
          <Link
            key={g.id}
            href={`/admin?tahun=${pilihTahun.nama}&guru=${g.id}`}
            className={
              guruTerpilih === g.id
                ? "shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                : "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
            }
          >
            {g.nama}
          </Link>
        ))}
      </div>

      {/* Kartu ringkasan */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Guru" value={kelompok.length} />
        <StatCard label="Kelas" value={totalKelas} />
        <StatCard label="Total Santri" value={totalSantri} />
        <StatCard
          label="Rata-rata % Hadir"
          value={rataHadir != null ? `${rataHadir}%` : "—"}
        />
      </div>

      {kelompok.length === 0 ? (
        <p className="card text-sm text-slate-500">
          Belum ada kelas di tahun {pilihTahun.nama}.
        </p>
      ) : (
        <div className="space-y-6">
          {kelompok.map(({ guru, rows: kelasRows }) => (
            <section key={guru.id}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {guru.nama}
                <span className="text-xs font-normal text-slate-400">
                  {kelasRows.length} kelas
                </span>
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {kelasRows.map((r) => {
                  const t = temaMapel(r.mapel_warna);
                  return (
                    <Link
                      key={r.kelas_id}
                      href={`/admin/${r.kelas_id}?tahun=${pilihTahun.nama}`}
                      className={`group block rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 border-t-4 transition hover:shadow-md hover:ring-emerald-300 ${t.batang}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                          {r.kelas}
                        </p>
                        <span className="text-[11px] font-medium text-slate-400">
                          {labelSemester(r.semester)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {r.mapel && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${t.dot}`}
                            />
                            {r.mapel}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {r.jumlah_santri} santri · {r.total_hari} hari
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span>
                          <b className="text-emerald-600">{r.hadir}</b> Hadir
                        </span>
                        <span>
                          <b className="text-amber-600">{r.sakit}</b> Sakit
                        </span>
                        <span>
                          <b className="text-sky-600">{r.izin}</b> Izin
                        </span>
                        <span>
                          <b className="text-red-600">{r.alpha}</b> Alpha
                        </span>
                        <span className="ml-auto">
                          {r.persen_hadir != null ? (
                            <PersenBadge value={Number(r.persen_hadir)} />
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              belum ada absensi
                            </span>
                          )}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
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
