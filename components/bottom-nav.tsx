"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, School, Search, UserRound } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Beranda", icon: House, exact: true },
  { href: "/kelas", label: "Kelas", icon: School, exact: false },
  { href: "/cari-santri", label: "Cari", icon: Search, exact: false },
  { href: "/akun", label: "Akun", icon: UserRound, exact: false },
];

/**
 * Navigasi bawah ala aplikasi Android (Material 3): empat tujuan utama
 * selalu terjangkau, indikator aktif berbentuk pil. Menu lain ada di panel
 * yang dibuka dari avatar di top bar.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 backdrop-blur-lg md:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -6px 24px rgba(15, 23, 42, 0.06)",
      }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const aktif = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={aktif ? "page" : undefined}
                className="flex flex-col items-center gap-1 py-2.5 transition active:scale-95"
              >
                <span
                  className={`flex h-8 w-16 items-center justify-center rounded-full transition ${
                    aktif
                      ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/70"
                      : "text-slate-400"
                  }`}
                >
                  <Icon size={19} />
                </span>
                <span
                  className={`text-[11px] leading-none ${
                    aktif
                      ? "font-semibold text-emerald-700"
                      : "font-medium text-slate-500"
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
