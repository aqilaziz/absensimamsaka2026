"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { labelSemester } from "@/lib/periode";
import type { NamaSemester } from "@/lib/types";
import {
  Archive,
  CalendarRange,
  CheckSquare,
  ChevronRight,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Search,
  Shield,
  Users,
  X,
} from "lucide-react";

export interface MobileMenuKelas {
  id: string;
  nama: string;
  semester_id: string;
}

export interface MobileMenuSemester {
  id: string;
  nama: NamaSemester;
}

function inisial(nama: string) {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? "")
    .join("");
}

function ItemMenu({
  href,
  label,
  icon: Icon,
  exact = false,
}: {
  href: string;
  label: string;
  icon: typeof Users;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const aktif = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition active:scale-[0.98] ${
        aktif
          ? "bg-emerald-50 font-semibold text-emerald-700"
          : "font-medium text-slate-600 active:bg-slate-100"
      }`}
    >
      <Icon size={18} strokeWidth={aktif ? 2.2 : 1.9} />
      <span className="flex-1">{label}</span>
      {aktif && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}
    </Link>
  );
}

/**
 * Panel navigasi HP yang dibuka dari avatar di top bar.
 * Permukaan terang (Material 3) agar senada dengan top bar & bottom nav.
 */
export function MobileMenu({
  nama,
  isAdmin,
  tahunNama,
  semesterLabel,
  semesters,
  kelas,
  logoutAction,
}: {
  nama: string;
  isAdmin: boolean;
  tahunNama: string | null;
  semesterLabel: string | null;
  semesters: MobileMenuSemester[];
  kelas: MobileMenuKelas[];
  logoutAction: () => Promise<void>;
}) {
  const [buka, setBuka] = useState(false);
  const pathname = usePathname();

  useEffect(() => setBuka(false), [pathname]);

  useEffect(() => {
    if (!buka) return;
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = asal;
    };
  }, [buka]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setBuka(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setBuka(true)}
        aria-label="Buka menu"
        aria-expanded={buka}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 transition active:scale-95"
      >
        {inisial(nama) || "GU"}
      </button>

      {buka && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setBuka(false)}
            aria-hidden="true"
          />

          <div className="absolute right-0 top-0 flex h-full w-[19rem] max-w-[88vw] flex-col overflow-y-auto rounded-l-3xl bg-white shadow-2xl">
            <div className="flex items-start gap-3 px-5 pb-4 pt-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {inisial(nama) || "GU"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">
                  {nama}
                </p>
                <p className="text-xs text-slate-500">
                  {isAdmin ? "Admin madrasah" : "Guru"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBuka(false)}
                aria-label="Tutup menu"
                className="rounded-full p-1.5 text-slate-400 transition active:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mx-4 rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700/70">
                Tahun Pelajaran Aktif
              </p>
              <p className="mt-0.5 text-sm font-bold text-emerald-900">
                {tahunNama ?? "Belum ada"}
              </p>
              {semesterLabel && (
                <p className="text-xs font-medium text-emerald-700">
                  {semesterLabel}
                </p>
              )}
            </div>

            <div className="mt-5 px-3">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Menu
              </p>
              <div className="space-y-0.5">
                <ItemMenu href="/" label="Dashboard" icon={LayoutDashboard} exact />
                {isAdmin && (
                  <ItemMenu href="/tahun-pelajaran" label="Tahun Pelajaran" icon={CalendarRange} />
                )}
                <ItemMenu href="/kelas" label="Kelas" icon={Users} exact />
                {!isAdmin && (
                  <ItemMenu href="/ambil-kelas" label="Ambil Kelas" icon={CheckSquare} />
                )}
                <ItemMenu href="/cari-santri" label="Cari Santri" icon={Search} />
                <ItemMenu href="/arsip" label="Arsip" icon={Archive} />
                {isAdmin && (
                  <ItemMenu href="/admin" label="Dashboard Admin" icon={Shield} />
                )}
              </div>
            </div>

            {kelas.length > 0 && (
              <div className="mt-5 px-3">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Kelas
                </p>
                {semesters.length > 0
                  ? semesters.map((s) => {
                      const items = kelas.filter((k) => k.semester_id === s.id);
                      if (items.length === 0) return null;
                      return (
                        <div key={s.id} className="mb-2">
                          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            {labelSemester(s.nama)}
                          </p>
                          {items.map((k) => (
                            <Link
                              key={k.id}
                              href={`/kelas/${k.id}/absensi`}
                              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition active:bg-slate-100"
                            >
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                              <span className="min-w-0 flex-1 truncate">
                                {k.nama}
                              </span>
                              <ChevronRight size={14} className="shrink-0 text-slate-300" />
                            </Link>
                          ))}
                        </div>
                      );
                    })
                  : kelas.map((k) => (
                      <Link
                        key={k.id}
                        href={`/kelas/${k.id}/absensi`}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 active:bg-slate-100"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {k.nama}
                      </Link>
                    ))}
              </div>
            )}

            <div className="mt-auto space-y-1 border-t border-slate-100 px-3 pb-6 pt-3">
              <ItemMenu href="/akun" label="Akun & Kata Sandi" icon={KeyRound} />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition active:bg-red-100"
                >
                  <LogOut size={16} /> Keluar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
