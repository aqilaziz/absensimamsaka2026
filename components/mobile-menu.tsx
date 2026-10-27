"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NavLink } from "@/components/nav-link";
import { labelSemester } from "@/lib/periode";
import type { NamaSemester } from "@/lib/types";
import {
  Archive,
  CalendarRange,
  CheckSquare,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
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

/**
 * Menu HP berbentuk tombol burger → panel geser dari kanan.
 * Menggantikan deretan menu yang harus digeser ke samping.
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

  // Tutup otomatis setiap pindah halaman.
  useEffect(() => {
    setBuka(false);
  }, [pathname]);

  // Cegah halaman di belakang ikut tergulir saat menu terbuka.
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
        className="shrink-0 rounded-lg p-2 text-emerald-100 transition active:bg-emerald-800"
      >
        <Menu size={22} />
      </button>

      {buka && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Latar gelap — klik untuk menutup */}
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setBuka(false)}
            aria-hidden="true"
          />

          <div className="absolute right-0 top-0 flex h-full w-[17rem] max-w-[85vw] flex-col overflow-y-auto bg-emerald-950 shadow-2xl">
            <div className="flex items-start justify-between gap-2 px-4 pb-3 pt-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight text-white">
                  {nama}
                </p>
                <p className="text-xs text-emerald-200/70">
                  {isAdmin ? "Admin madrasah" : "Guru"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBuka(false)}
                aria-label="Tutup menu"
                className="shrink-0 rounded-lg p-1.5 text-emerald-100 transition active:bg-emerald-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mx-3 rounded-lg bg-emerald-900/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-emerald-300/70">
                Tahun Pelajaran Aktif
              </p>
              <p className="text-sm font-semibold text-emerald-50">
                {tahunNama ?? "Belum ada"}
              </p>
              {semesterLabel && (
                <p className="mt-0.5 text-[11px] font-medium text-emerald-200/80">
                  {semesterLabel}
                </p>
              )}
            </div>

            <nav className="mt-3 space-y-0.5 px-2">
              <NavLink href="/" exact>
                <span className="flex items-center gap-2">
                  <LayoutDashboard size={16} /> Dashboard
                </span>
              </NavLink>
              {isAdmin && (
                <NavLink href="/tahun-pelajaran">
                  <span className="flex items-center gap-2">
                    <CalendarRange size={16} /> Tahun Pelajaran
                  </span>
                </NavLink>
              )}
              <NavLink href="/kelas" exact>
                <span className="flex items-center gap-2">
                  <Users size={16} /> Kelas
                </span>
              </NavLink>
              {!isAdmin && (
                <NavLink href="/ambil-kelas">
                  <span className="flex items-center gap-2">
                    <CheckSquare size={16} /> Ambil Kelas
                  </span>
                </NavLink>
              )}
              <NavLink href="/cari-santri">
                <span className="flex items-center gap-2">
                  <Search size={16} /> Cari Santri
                </span>
              </NavLink>
              <NavLink href="/arsip">
                <span className="flex items-center gap-2">
                  <Archive size={16} /> Arsip
                </span>
              </NavLink>
              {isAdmin && (
                <NavLink href="/admin">
                  <span className="flex items-center gap-2">
                    <Shield size={16} /> Admin
                  </span>
                </NavLink>
              )}
            </nav>

            {kelas.length > 0 && (
              <div className="mt-4 px-2 pb-2">
                <p className="mb-1 px-3 text-[11px] uppercase tracking-wide text-emerald-300/70">
                  Kelas
                </p>
                {semesters.length > 0
                  ? semesters.map((s) => {
                      const items = kelas.filter(
                        (k) => k.semester_id === s.id,
                      );
                      if (items.length === 0) return null;
                      return (
                        <div key={s.id} className="mb-2">
                          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/60">
                            {labelSemester(s.nama)}
                          </p>
                          <div className="space-y-0.5">
                            {items.map((k) => (
                              <NavLink key={k.id} href={`/kelas/${k.id}/absensi`}>
                                <span className="flex items-center gap-2 truncate">
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500/60" />
                                  <span className="truncate">{k.nama}</span>
                                </span>
                              </NavLink>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  : kelas.map((k) => (
                      <NavLink key={k.id} href={`/kelas/${k.id}/absensi`}>
                        <span className="flex items-center gap-2 truncate">
                          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500/60" />
                          <span className="truncate">{k.nama}</span>
                        </span>
                      </NavLink>
                    ))}
              </div>
            )}

            <div className="mt-auto space-y-1.5 p-3">
              <NavLink href="/akun">
                <span className="flex items-center gap-2">
                  <KeyRound size={16} /> Akun &amp; Kata Sandi
                </span>
              </NavLink>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition active:bg-red-700"
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
