"use client";

import { useState } from "react";

type TabKey = "absensi" | "nilai" | "tugas" | "lintas";

export function SantriTabs({
  absensi,
  nilai,
  tugas,
  lintas,
}: {
  absensi: React.ReactNode;
  nilai: React.ReactNode;
  tugas: React.ReactNode;
  lintas: React.ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("absensi");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "absensi", label: "Absensi" },
    { key: "nilai", label: "Nilai" },
    { key: "tugas", label: "Tugas" },
    { key: "lintas", label: "Lintas Tahun" },
  ];

  return (
    <div className="space-y-4">
      <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white"
                : "shrink-0 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "absensi" && absensi}
      {tab === "nilai" && nilai}
      {tab === "tugas" && tugas}
      {tab === "lintas" && lintas}
    </div>
  );
}
