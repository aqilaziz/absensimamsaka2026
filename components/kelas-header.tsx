import Link from "next/link";
import { labelSemester } from "@/lib/periode";
import { MapelBadge } from "@/components/mapel-badge";
import type { KelasDetail } from "@/lib/types";

type TabKey = "santri" | "absensi" | "nilai" | "tugas" | "rekap";

export function KelasHeader({
  kelas,
  active,
}: {
  kelas: KelasDetail;
  active: TabKey;
}) {
  const tabs: { key: TabKey; label: string; href: string }[] = [
    { key: "absensi", label: "Absensi", href: `/kelas/${kelas.id}/absensi` },
    { key: "nilai", label: "Nilai", href: `/kelas/${kelas.id}/nilai` },
    { key: "tugas", label: "Tugas", href: `/kelas/${kelas.id}/tugas` },
    { key: "rekap", label: "Rekap", href: `/kelas/${kelas.id}/rekap` },
    { key: "santri", label: "Santri", href: `/kelas/${kelas.id}` },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Link
          href="/kelas"
          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 transition active:scale-95"
        >
          ← Kelas
        </Link>
        <h1 className="w-full text-2xl font-bold tracking-tight text-slate-900 sm:w-auto sm:text-2xl">
          {kelas.nama}
        </h1>
        {kelas.mapel && <MapelBadge mapel={kelas.mapel} />}
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {kelas.tahun_pelajaran.nama}
          {kelas.tahun_pelajaran.status === "arsip" && " · Arsip"}
        </span>
        {kelas.semester && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {labelSemester(kelas.semester.nama)}
          </span>
        )}
      </div>
      <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 p-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            prefetch={false}
            className={
              active === t.key
                ? "shrink-0 whitespace-nowrap rounded-xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm"
                : "shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition active:bg-white/60"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
