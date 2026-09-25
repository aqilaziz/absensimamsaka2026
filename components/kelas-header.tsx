import Link from "next/link";
import { labelSemester } from "@/lib/periode";
import type { KelasDetail } from "@/lib/types";

type TabKey = "santri" | "absensi" | "tugas" | "rekap";

export function KelasHeader({
  kelas,
  active,
}: {
  kelas: KelasDetail;
  active: TabKey;
}) {
  const tabs: { key: TabKey; label: string; href: string }[] = [
    { key: "santri", label: "Santri", href: `/kelas/${kelas.id}` },
    { key: "absensi", label: "Absensi", href: `/kelas/${kelas.id}/absensi` },
    { key: "tugas", label: "Tugas", href: `/kelas/${kelas.id}/tugas` },
    { key: "rekap", label: "Rekap", href: `/kelas/${kelas.id}/rekap` },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/kelas" className="text-sm text-slate-400 hover:text-slate-600">
          ← Kelas
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{kelas.nama}</h1>
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
      <div className="flex w-fit gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={
              active === t.key
                ? "rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white"
                : "rounded-lg px-4 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
