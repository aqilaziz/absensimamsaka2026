"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, House, School, Search } from "lucide-react";
import {
  MobileMenu,
  type MobileMenuKelas,
  type MobileMenuSemester,
} from "@/components/mobile-menu";

const TUJUAN = [
  { href: "/", label: "Beranda", icon: House, exact: true },
  { href: "/kelas", label: "Kelas", icon: School, exact: true },
  { href: "/cari-santri", label: "Cari", icon: Search, exact: false },
  { href: "/arsip", label: "Arsip", icon: Archive, exact: false },
];

/**
 * Navigation rail Material 3 untuk tablet (768–1023px).
 * Lebar tetap 80px sehingga konten tetap lega; menu lain (Admin, Tahun
 * Pelajaran, Ambil Kelas, daftar kelas, Akun, Keluar) dibuka lewat
 * "Lainnya" memakai panel yang sama dengan HP.
 */
export function NavRail({
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
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col items-center overflow-y-auto border-r border-slate-200/80 bg-white py-4 md:flex lg:hidden">
      <Link href="/" aria-label="Beranda" className="mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logomam1.png"
          alt="Logo MAM 1 Paciran"
          width={40}
          height={40}
          className="h-10 w-10 rounded-xl bg-emerald-50 object-contain p-1 ring-1 ring-emerald-100"
        />
      </Link>

      <div className="mb-3 h-px w-10 bg-slate-200" />

      <nav aria-label="Navigasi tablet" className="flex w-full flex-col items-center gap-1">
        {TUJUAN.map(({ href, label, icon: Icon, exact }) => {
          const aktif = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={aktif ? "page" : undefined}
              title={label}
              className="flex w-full flex-col items-center gap-1 py-1 transition active:scale-95"
            >
              <span
                className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                  aktif
                    ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/70"
                    : "text-slate-400"
                }`}
              >
                <Icon size={19} />
              </span>
              <span
                className={`text-[10px] leading-none ${
                  aktif
                    ? "font-semibold text-emerald-700"
                    : "font-medium text-slate-500"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex w-full flex-col items-center gap-1 pt-3">
        <div className="mb-2 h-px w-10 bg-slate-200" />
        <MobileMenu
          variant="rail"
          nama={nama}
          isAdmin={isAdmin}
          tahunNama={tahunNama}
          semesterLabel={semesterLabel}
          semesters={semesters}
          kelas={kelas}
          logoutAction={logoutAction}
        />
        <span className="mt-2 px-1 text-center text-[9px] font-medium leading-tight text-slate-400">
          {tahunNama ?? ""}
        </span>
      </div>
    </aside>
  );
}
